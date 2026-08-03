import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { and, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import {
  purchaseInvoices,
  purchaseInvoiceLines,
  supplierPayments,
  suppliers,
} from '@repo/db';
import type {
  PurchaseInvoice,
  PurchaseInvoiceDetail,
  PurchaseInvoiceLine,
  Supplier,
  SupplierDetails,
  SupplierFinancialSummary,
  SupplierPayment,
} from '@repo/contracts';

const asMinor = (value: bigint | string | number | null | undefined): string =>
  value === null || value === undefined ? '0' : BigInt(value).toString();

const toIso = (value: Date | string | null | undefined): string | null =>
  value === null || value === undefined
    ? null
    : value instanceof Date
      ? value.toISOString()
      : String(value);

type SupplierRow = typeof suppliers.$inferSelect;
type PurchaseInvoiceRow = typeof purchaseInvoices.$inferSelect;

@Injectable()
export class SupplierService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  private toSupplier(row: SupplierRow): Supplier {
    return {
      id: row.id,
      organizationId: row.orgId,
      name: row.name,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      paymentTermsDays: row.paymentTermsDays,
    };
  }

  private outstandingFor(
    grandTotalMinor: bigint,
    status: string,
    paidMinor: bigint,
    creditedMinor: bigint,
  ): bigint {
    if (status === 'paid' || status === 'fully_credited') {
      return 0n;
    }
    const remaining = grandTotalMinor - paidMinor - creditedMinor;
    return remaining > 0n ? remaining : 0n;
  }

  private toInvoice(
    row: PurchaseInvoiceRow,
    paidMinor: bigint,
    creditedMinor: bigint,
  ): PurchaseInvoice {
    return {
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      status: row.status,
      issuedAt: row.issuedAt.toISOString(),
      dueDate: toIso(row.dueDate),
      grandTotalMinor: asMinor(row.grandTotalMinor),
      paidMinor: asMinor(paidMinor),
      creditedMinor: asMinor(creditedMinor),
      outstandingMinor: asMinor(
        this.outstandingFor(
          row.grandTotalMinor,
          row.status,
          paidMinor,
          creditedMinor,
        ),
      ),
    };
  }

  async listSuppliers(organizationId: string): Promise<Supplier[]> {
    const rows = await this.db.query.suppliers.findMany({
      where: {
        orgId: organizationId,
        deletedAt: { isNull: true },
      },
      orderBy: (t, { asc }) => [asc(t.name)],
    });

    return rows.map((row) => this.toSupplier(row));
  }

  async createSupplier(
    organizationId: string,
    data: {
      name: string;
      contactName?: string;
      contactPhone?: string;
      contactEmail?: string;
      paymentTermsDays?: number;
    },
  ): Promise<Supplier> {
    const [row] = await this.db
      .insert(suppliers)
      .values({
        orgId: organizationId,
        name: data.name,
        contactName: data.contactName ?? null,
        contactPhone: data.contactPhone ?? null,
        contactEmail: data.contactEmail ?? null,
        paymentTermsDays: data.paymentTermsDays ?? 30,
      })
      .returning();

    return this.toSupplier(row);
  }

  async updateSupplier(
    id: string,
    organizationId: string,
    data: Partial<{
      name: string;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      paymentTermsDays: number;
    }>,
  ): Promise<Supplier> {
    const [row] = await this.db
      .update(suppliers)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.contactName !== undefined && {
          contactName: data.contactName,
        }),
        ...(data.contactPhone !== undefined && {
          contactPhone: data.contactPhone,
        }),
        ...(data.contactEmail !== undefined && {
          contactEmail: data.contactEmail,
        }),
        ...(data.paymentTermsDays !== undefined && {
          paymentTermsDays: data.paymentTermsDays,
        }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.orgId, organizationId),
          isNull(suppliers.deletedAt),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException('Supplier not found');
    }

    return this.toSupplier(row);
  }

  async deleteSupplier(organizationId: string, id: string): Promise<void> {
    const [row] = await this.db
      .update(suppliers)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.orgId, organizationId),
          isNull(suppliers.deletedAt),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException('Supplier not found');
    }
  }

  async getSupplier(
    organizationId: string,
    id: string,
  ): Promise<SupplierDetails> {
    const row = await this.db.query.suppliers.findFirst({
      where: { id, orgId: organizationId, deletedAt: { isNull: true } },
    });

    if (!row) {
      throw new NotFoundException('Supplier not found');
    }

    const financialSummary = await this.computeFinancialSummary(
      organizationId,
      id,
    );

    return {
      ...this.toSupplier(row),
      financialSummary,
    };
  }

  async listSupplierInvoices(
    organizationId: string,
    supplierId: string,
  ): Promise<PurchaseInvoice[]> {
    const invoiceRows = await this.db
      .select()
      .from(purchaseInvoices)
      .where(
        and(
          eq(purchaseInvoices.orgId, organizationId),
          eq(purchaseInvoices.supplierId, supplierId),
          ne(purchaseInvoices.status, 'void'),
        ),
      )
      .orderBy(desc(purchaseInvoices.issuedAt));

    const paidByInvoice = await this.loadPaidAllocations(
      invoiceRows.map((i) => i.id),
    );

    return invoiceRows.map((invoice) => {
      const paid = paidByInvoice.get(invoice.id) ?? 0n;
      const credited = invoice.creditedMinor;
      return this.toInvoice(invoice, paid, credited);
    });
  }

  async getSupplierInvoice(
    organizationId: string,
    supplierId: string,
    invoiceId: string,
  ): Promise<PurchaseInvoiceDetail> {
    const row = await this.db.query.purchaseInvoices.findFirst({
      where: {
        id: invoiceId,
        orgId: organizationId,
        supplierId,
      },
      with: {
        lines: {
          orderBy: (t, { asc }) => [asc(t.sortOrder)],
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Purchase invoice not found');
    }

    const paidByInvoice = await this.loadPaidAllocations([row.id]);
    const paid = paidByInvoice.get(row.id) ?? 0n;
    const credited = row.creditedMinor;

    return {
      ...this.toInvoice(row, paid, credited),
      subtotalMinor: asMinor(row.subtotalMinor),
      taxTotalMinor: asMinor(row.taxTotalMinor),
      taxBreakdown: row.taxBreakdown,
      lines: row.lines.map((line) => this.toLine(line)),
    };
  }

  async listSupplierPayments(
    organizationId: string,
    supplierId: string,
  ): Promise<SupplierPayment[]> {
    const rows = await this.db
      .select({
        id: supplierPayments.id,
        purchaseInvoiceId: supplierPayments.purchaseInvoiceId,
        invoiceNumber: purchaseInvoices.invoiceNumber,
        amountMinor: supplierPayments.amountMinor,
        method: supplierPayments.method,
        reference: supplierPayments.reference,
        paidAt: supplierPayments.paidAt,
      })
      .from(supplierPayments)
      .innerJoin(
        purchaseInvoices,
        eq(supplierPayments.purchaseInvoiceId, purchaseInvoices.id),
      )
      .where(
        and(
          eq(supplierPayments.orgId, organizationId),
          eq(supplierPayments.supplierId, supplierId),
        ),
      )
      .orderBy(desc(supplierPayments.paidAt));

    return rows.map((row) => ({
      id: row.id,
      purchaseInvoiceId: row.purchaseInvoiceId,
      invoiceNumber: row.invoiceNumber,
      amountMinor: asMinor(row.amountMinor),
      method: row.method,
      reference: row.reference,
      paidAt: row.paidAt.toISOString(),
    }));
  }

  async createSupplierPayment(
    organizationId: string,
    supplierId: string,
    data: {
      amountMinor: string;
      method: 'cash' | 'bank_transfer' | 'cheque' | 'store_credit';
      reference?: string;
      paidAt: string;
      allocations: { purchaseInvoiceId: string; amountMinor: string }[];
    },
    recordedBy: string,
  ): Promise<SupplierPayment[]> {
    if (data.allocations.length === 0) {
      throw new NotFoundException('No allocations provided');
    }

    return this.db.transaction(async (tx) => {
      const created: SupplierPayment[] = [];

      for (const alloc of data.allocations) {
        const amount = BigInt(alloc.amountMinor);
        if (amount <= 0n) {
          continue;
        }

        const [invoice] = await tx
          .select({
            id: purchaseInvoices.id,
            invoiceNumber: purchaseInvoices.invoiceNumber,
            grandTotalMinor: purchaseInvoices.grandTotalMinor,
            paidMinor: purchaseInvoices.paidMinor,
            status: purchaseInvoices.status,
          })
          .from(purchaseInvoices)
          .where(
            and(
              eq(purchaseInvoices.id, alloc.purchaseInvoiceId),
              eq(purchaseInvoices.orgId, organizationId),
              eq(purchaseInvoices.supplierId, supplierId),
            ),
          );

        if (!invoice) {
          throw new NotFoundException('Purchase invoice not found');
        }

        const [paymentRow] = await tx
          .insert(supplierPayments)
          .values({
            orgId: organizationId,
            supplierId,
            purchaseInvoiceId: alloc.purchaseInvoiceId,
            amountMinor: amount,
            method: data.method,
            reference: data.reference ?? null,
            recordedBy,
            paidAt: new Date(data.paidAt),
          })
          .returning();

        const newPaid = invoice.paidMinor + amount;
        const newStatus =
          newPaid >= invoice.grandTotalMinor
            ? ('paid' as const)
            : invoice.status;

        await tx
          .update(purchaseInvoices)
          .set({
            paidMinor: newPaid,
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(purchaseInvoices.id, invoice.id));

        created.push({
          id: paymentRow.id,
          purchaseInvoiceId: paymentRow.purchaseInvoiceId,
          invoiceNumber: invoice.invoiceNumber,
          amountMinor: asMinor(paymentRow.amountMinor),
          method: paymentRow.method,
          reference: paymentRow.reference,
          paidAt: paymentRow.paidAt.toISOString(),
        });
      }

      return created;
    });
  }

  private async computeFinancialSummary(
    organizationId: string,
    supplierId: string,
  ): Promise<SupplierFinancialSummary> {
    const invoiceRows = await this.db
      .select()
      .from(purchaseInvoices)
      .where(
        and(
          eq(purchaseInvoices.orgId, organizationId),
          eq(purchaseInvoices.supplierId, supplierId),
          ne(purchaseInvoices.status, 'void'),
        ),
      );

    const paidByInvoice = await this.loadPaidAllocations(
      invoiceRows.map((i) => i.id),
    );

    let totalBilled = 0n;
    let totalPaid = 0n;
    let totalCredited = 0n;
    let outstanding = 0n;
    let overdue = 0n;
    let openInvoiceCount = 0;
    let overdueInvoiceCount = 0;
    const today = new Date();

    for (const invoice of invoiceRows) {
      totalBilled += invoice.grandTotalMinor;
      const paid = paidByInvoice.get(invoice.id) ?? 0n;
      const credited = invoice.creditedMinor;
      totalPaid += paid;
      totalCredited += credited;

      const due = this.outstandingFor(
        invoice.grandTotalMinor,
        invoice.status,
        paid,
        credited,
      );

      if (due > 0n) {
        outstanding += due;
        openInvoiceCount += 1;
        if (
          invoice.dueDate &&
          new Date(invoice.dueDate).getTime() < today.getTime()
        ) {
          overdue += due;
          overdueInvoiceCount += 1;
        }
      }
    }

    return {
      totalBilledMinor: asMinor(totalBilled),
      totalPaidMinor: asMinor(totalPaid),
      totalCreditedMinor: asMinor(totalCredited),
      outstandingMinor: asMinor(outstanding),
      overdueMinor: asMinor(overdue),
      invoiceCount: invoiceRows.length,
      openInvoiceCount,
      overdueInvoiceCount,
    };
  }

  private async loadPaidAllocations(
    invoiceIds: string[],
  ): Promise<Map<string, bigint>> {
    if (invoiceIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .select({
        purchaseInvoiceId: supplierPayments.purchaseInvoiceId,
        total: sql<string>`COALESCE(SUM(${supplierPayments.amountMinor}), 0)`,
      })
      .from(supplierPayments)
      .where(inArray(supplierPayments.purchaseInvoiceId, invoiceIds))
      .groupBy(supplierPayments.purchaseInvoiceId);

    return new Map(
      rows.map((row) => [row.purchaseInvoiceId, BigInt(row.total)]),
    );
  }

  private toLine(
    row: typeof purchaseInvoiceLines.$inferSelect,
  ): PurchaseInvoiceLine {
    return {
      id: row.id,
      description: row.description,
      quantity: row.quantity.toString(),
      unitCostMinor: asMinor(row.unitCostMinor),
      lineTotalMinor: asMinor(row.lineTotalMinor),
      taxBreakdown: row.taxBreakdown,
    };
  }
}
