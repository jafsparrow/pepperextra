import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { and, eq, isNull } from 'drizzle-orm';
import { categories, products } from '@repo/db';
import type { Category } from '@repo/contracts';

type CategoryRow = typeof categories.$inferSelect;

@Injectable()
export class CategoryService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  private toCategory(row: CategoryRow): Category {
    return {
      id: row.id,
      organizationId: row.orgId,
      parentId: row.parentId,
      name: row.name,
      sortOrder: row.sortOrder,
    };
  }

  async listCategories(organizationId: string): Promise<Category[]> {
    const rows = await this.db.query.categories.findMany({
      where: { orgId: organizationId, deletedAt: { isNull: true } },
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.name)],
    });

    return rows.map((row) => this.toCategory(row));
  }

  async createCategory(
    organizationId: string,
    data: { name: string; parentId?: string | null; sortOrder?: number },
  ): Promise<Category> {
    if (data.parentId) {
      await this.assertParentExists(organizationId, data.parentId);
    }

    const [row] = await this.db
      .insert(categories)
      .values({
        orgId: organizationId,
        parentId: data.parentId ?? null,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    return this.toCategory(row);
  }

  async updateCategory(
    organizationId: string,
    id: string,
    data: Partial<{
      name: string;
      parentId?: string | null;
      sortOrder: number;
    }>,
  ): Promise<Category> {
    const existing = await this.findCategory(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (data.parentId !== undefined && data.parentId !== null) {
      await this.assertParentExists(organizationId, data.parentId);
      await this.assertNoCycle(id, data.parentId);
    }

    const [row] = await this.db
      .update(categories)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(categories.id, id),
          eq(categories.orgId, organizationId),
          isNull(categories.deletedAt),
        ),
      )
      .returning();

    return this.toCategory(row);
  }

  async deleteCategory(organizationId: string, id: string): Promise<void> {
    const existing = await this.findCategory(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const child = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.parentId, id),
          eq(categories.orgId, organizationId),
          isNull(categories.deletedAt),
        ),
      )
      .limit(1);

    if (child.length > 0) {
      throw new ConflictException(
        'Category has sub-categories. Move or delete them first.',
      );
    }

    const assigned = await this.db
      .select({ id: products.id })
      .from(products)
      .where(
        and(eq(products.categoryId, id), eq(products.orgId, organizationId)),
      )
      .limit(1);

    if (assigned.length > 0) {
      throw new ConflictException(
        'Category is assigned to products. Remove the assignment first.',
      );
    }

    await this.db
      .update(categories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(categories.id, id),
          eq(categories.orgId, organizationId),
          isNull(categories.deletedAt),
        ),
      );
  }

  private async findCategory(
    organizationId: string,
    id: string,
  ): Promise<CategoryRow | null> {
    const row = await this.db.query.categories.findFirst({
      where: { id, orgId: organizationId, deletedAt: { isNull: true } },
    });
    return row ?? null;
  }

  private async assertParentExists(
    organizationId: string,
    parentId: string,
  ): Promise<void> {
    const parent = await this.db.query.categories.findFirst({
      where: {
        id: parentId,
        orgId: organizationId,
        deletedAt: { isNull: true },
      },
      columns: { id: true },
    });

    if (!parent) {
      throw new BadRequestException('Parent category not found');
    }
  }

  private async assertNoCycle(id: string, parentId: string): Promise<void> {
    let current: string | null = parentId;
    const visited = new Set<string>();

    while (current) {
      if (current === id) {
        throw new BadRequestException(
          'A category cannot be moved under itself or its own descendant.',
        );
      }
      if (visited.has(current)) {
        return;
      }
      visited.add(current);

      const [row] = await this.db
        .select({ parentId: categories.parentId })
        .from(categories)
        .where(eq(categories.id, current))
        .limit(1);
      current = row?.parentId ?? null;
    }
  }
}
