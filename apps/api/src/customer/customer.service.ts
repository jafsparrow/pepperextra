import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import { and, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import {
  creditNotes,
  customers,
  invoiceLines,
  invoices,
  invoiceWarrantyLines,
  payments,
  products,
  siteContacts,
  sites,
  warrantyClaims,
  warrantyItems,
} from '@repo/db';
import type {
  Customer,
  CustomerCreditNote,
  CustomerDetails,
  CustomerFinancialSummary,
  CustomerInvoice,
  CustomerPayment,
  CustomerSite,
  CustomerWarrantyClaim,
} from '@repo/contracts';

const asMinor = (value: bigint | string | number | null | undefined): string =>
  value === null || value === undefined ? '0' : BigInt(value).toString();

const toIso = (value: Date | string | null | undefined): string | null =>
  value === null || value === undefined
    ? null
    : value instanceof Date
      ? value.toISOString()
      : String(value);

type CustomerRow = typeof customers.$inferSelect;
type SiteRow = typeof sites.$inferSelect & {
  contacts?: (typeof siteContacts.$inferSelect)[];
};

@Injectable()
export class CustomerService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  private toCustomer(row: CustomerRow): Customer {
    return {
      id: row.id,
      organizationId: row.orgId,
      type: row.type,
      name: row.name,
      phone: row.phone,
      email: row.email,
      creditLimitMinor: asMinor(row.creditLimitMinor),
      paymentTermsDays: row.paymentTermsDays,
      vatNumber: row.vatNumber,
      billingAddress: row.billingAddress,
      shippingAddress: row.shippingAddress,
      portalLogin: row.portalLogin,
      taxExempt: row.taxExempt,
      defaultPriceListId: row.defaultPriceListId,
      notes: row.notes,
    };
  }

  private toSite(row: SiteRow): CustomerSite {
    return {
      id: row.id,
      organizationId: row.orgId,
      customerId: row.customerId,
      name: row.name,
      description: row.description,
      address: row.address,
      contactNumber: row.contactNumber,
      startDate: toIso(row.startDate),
      expectedEndDate: toIso(row.expectedEndDate),
      status: row.status,
      contacts: (row.contacts ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        role: c.role,
        isPrimary: c.isPrimary,
      })),
    };
  }

  async listCustomers(input: {
    organizationId: string;
    type?: 'retail' | 'account' | 'contractor';
    search?: string;
  }): Promise<Customer[]> {
    const rows = await this.db.query.customers.findMany({
      where: {
        orgId: input.organizationId,
        deletedAt: { isNull: true },
        ...(input.type ? { type: input.type } : {}),
        ...(input.search
          ? {
              OR: [
                { name: { ilike: `%${input.search}%` } },
                { phone: { ilike: `%${input.search}%` } },
                { email: { ilike: `%${input.search}%` } },
              ],
            }
          : {}),
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return rows.map((row) => this.toCustomer(row));
  }

  async getCustomer(
    organizationId: string,
    id: string,
  ): Promise<CustomerDetails> {
    const row = await this.db.query.customers.findFirst({
      where: { id, orgId: organizationId, deletedAt: { isNull: true } },
      with: {
        sites: {
          where: { deletedAt: { isNull: true } },
          with: {
            contacts: { where: { deletedAt: { isNull: true } } },
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Customer not found');
    }

    const financialSummary = await this.computeFinancialSummary(
      organizationId,
      id,
    );

    return {
      ...this.toCustomer(row),
      financialSummary,
      sites: row.sites.map((site) => this.toSite(site)),
    };
  }

  async createCustomer(
    organizationId: string,
    data: {
      type: 'retail' | 'account' | 'contractor';
      name: string;
      phone?: string;
      email?: string;
      creditLimitMinor?: string;
      paymentTermsDays?: number;
      vatNumber?: string;
      billingAddress?: string;
      shippingAddress?: string;
      portalLogin?: boolean;
      taxExempt?: boolean;
      defaultPriceListId?: string;
      notes?: string;
    },
  ): Promise<Customer> {
    const [row] = await this.db
      .insert(customers)
      .values({
        orgId: organizationId,
        type: data.type,
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        creditLimitMinor: data.creditLimitMinor
          ? BigInt(data.creditLimitMinor)
          : 0n,
        paymentTermsDays: data.paymentTermsDays ?? 30,
        vatNumber: data.vatNumber ?? null,
        billingAddress: data.billingAddress ?? null,
        shippingAddress: data.shippingAddress ?? null,
        portalLogin: data.portalLogin ?? false,
        taxExempt: data.taxExempt ?? false,
        defaultPriceListId: data.defaultPriceListId ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    return this.toCustomer(row);
  }

  async updateCustomer(
    id: string,
    organizationId: string,
    data: Partial<{
      type: 'retail' | 'account' | 'contractor';
      name: string;
      phone: string;
      email: string;
      creditLimitMinor: string;
      paymentTermsDays: number;
      vatNumber: string;
      billingAddress: string;
      shippingAddress: string;
      portalLogin: boolean;
      taxExempt: boolean;
      defaultPriceListId: string;
      notes: string;
    }>,
  ): Promise<Customer> {
    const [row] = await this.db
      .update(customers)
      .set({
        ...(data.type !== undefined && { type: data.type }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.creditLimitMinor !== undefined && {
          creditLimitMinor: data.creditLimitMinor
            ? BigInt(data.creditLimitMinor)
            : 0n,
        }),
        ...(data.paymentTermsDays !== undefined && {
          paymentTermsDays: data.paymentTermsDays,
        }),
        ...(data.vatNumber !== undefined && { vatNumber: data.vatNumber }),
        ...(data.billingAddress !== undefined && {
          billingAddress: data.billingAddress,
        }),
        ...(data.shippingAddress !== undefined && {
          shippingAddress: data.shippingAddress,
        }),
        ...(data.portalLogin !== undefined && {
          portalLogin: data.portalLogin,
        }),
        ...(data.taxExempt !== undefined && { taxExempt: data.taxExempt }),
        ...(data.defaultPriceListId !== undefined && {
          defaultPriceListId: data.defaultPriceListId || null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customers.id, id),
          eq(customers.orgId, organizationId),
          isNull(customers.deletedAt),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException('Customer not found');
    }

    return this.toCustomer(row);
  }

  async deleteCustomer(organizationId: string, id: string): Promise<void> {
    await this.db
      .update(customers)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(customers.id, id),
          eq(customers.orgId, organizationId),
          isNull(customers.deletedAt),
        ),
      );
  }

  async listCustomerInvoices(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerInvoice[]> {
    const invoiceRows = await this.db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        issuedAt: invoices.issuedAt,
        dueDate: invoices.dueDate,
        grandTotalMinor: invoices.grandTotalMinor,
        siteId: invoices.siteId,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, organizationId),
          eq(invoices.customerId, customerId),
          ne(invoices.status, 'void'),
        ),
      )
      .orderBy(desc(invoices.issuedAt));

    const [paidByInvoice, creditedByInvoice] = await this.loadAllocations(
      customerId,
      invoiceRows.map((i) => i.id),
    );

    return invoiceRows.map((invoice) => {
      const paid = paidByInvoice.get(invoice.id) ?? 0n;
      const credited = creditedByInvoice.get(invoice.id) ?? 0n;
      const outstanding = this.outstandingFor(
        invoice.grandTotalMinor,
        invoice.status,
        paid,
        credited,
      );
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issuedAt: invoice.issuedAt.toISOString(),
        dueDate: invoice.dueDate,
        grandTotalMinor: asMinor(invoice.grandTotalMinor),
        paidMinor: asMinor(paid),
        creditedMinor: asMinor(credited),
        outstandingMinor: asMinor(outstanding),
        siteId: invoice.siteId,
      };
    });
  }

  async listCustomerPayments(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerPayment[]> {
    const rows = await this.db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        amountMinor: payments.amountMinor,
        method: payments.method,
        reference: payments.reference,
        paidAt: payments.paidAt,
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(
        and(
          eq(invoices.orgId, organizationId),
          eq(invoices.customerId, customerId),
        ),
      )
      .orderBy(desc(payments.paidAt));

    return rows.map((row) => ({
      id: row.id,
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      amountMinor: asMinor(row.amountMinor),
      method: row.method,
      reference: row.reference,
      paidAt: row.paidAt.toISOString(),
    }));
  }

  async listCustomerCreditNotes(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerCreditNote[]> {
    const rows = await this.db
      .select({
        id: creditNotes.id,
        invoiceId: creditNotes.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        creditNoteNumber: creditNotes.creditNoteNumber,
        reason: creditNotes.reason,
        grandTotalMinor: creditNotes.grandTotalMinor,
        createdAt: creditNotes.createdAt,
      })
      .from(creditNotes)
      .innerJoin(invoices, eq(creditNotes.invoiceId, invoices.id))
      .where(
        and(
          eq(invoices.orgId, organizationId),
          eq(invoices.customerId, customerId),
        ),
      )
      .orderBy(desc(creditNotes.createdAt));

    return rows.map((row) => ({
      id: row.id,
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      creditNoteNumber: row.creditNoteNumber,
      reason: row.reason,
      grandTotalMinor: asMinor(row.grandTotalMinor),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listCustomerWarrantyClaims(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerWarrantyClaim[]> {
    const rows = await this.db
      .select({
        id: warrantyClaims.id,
        claimDate: warrantyClaims.claimDate,
        claimType: warrantyClaims.claimType,
        resolution: warrantyClaims.resolution,
        serviceStatus: warrantyClaims.serviceStatus,
        serialNumber: invoiceWarrantyLines.serialNumber,
        warrantyName: warrantyItems.name,
        productName: products.name,
        invoiceNumber: invoices.invoiceNumber,
        notes: warrantyClaims.notes,
        createdAt: warrantyClaims.createdAt,
      })
      .from(warrantyClaims)
      .innerJoin(
        invoiceWarrantyLines,
        eq(warrantyClaims.warrantyLineId, invoiceWarrantyLines.id),
      )
      .innerJoin(invoices, eq(invoiceWarrantyLines.invoiceId, invoices.id))
      .leftJoin(
        invoiceLines,
        eq(invoiceWarrantyLines.invoiceLineId, invoiceLines.id),
      )
      .leftJoin(products, eq(invoiceLines.productId, products.id))
      .leftJoin(
        warrantyItems,
        eq(invoiceWarrantyLines.warrantyId, warrantyItems.id),
      )
      .where(
        and(
          eq(invoices.orgId, organizationId),
          eq(invoices.customerId, customerId),
        ),
      )
      .orderBy(desc(warrantyClaims.createdAt));

    return rows.map((row) => ({
      id: row.id,
      claimDate: row.claimDate,
      claimType: row.claimType,
      resolution: row.resolution,
      serviceStatus: row.serviceStatus,
      serialNumber: row.serialNumber,
      warrantyName: row.warrantyName,
      productName: row.productName,
      invoiceNumber: row.invoiceNumber,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listCustomerSites(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerSite[]> {
    const rows = await this.db.query.sites.findMany({
      where: { orgId: organizationId, customerId, deletedAt: { isNull: true } },
      with: {
        contacts: { where: { deletedAt: { isNull: true } } },
      },
      orderBy: (t, { asc }) => [asc(t.name)],
    });

    return rows.map((site) => this.toSite(site));
  }

  async createCustomerSite(
    organizationId: string,
    customerId: string,
    data: {
      name: string;
      description?: string;
      address?: string;
      contactNumber?: string;
      startDate?: string;
      expectedEndDate?: string;
      status?: 'active' | 'on_hold' | 'completed' | 'cancelled';
      managers?: { name: string; phone?: string; email?: string }[];
    },
    linkedBy: string,
  ): Promise<CustomerSite> {
    const site = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(sites)
        .values({
          orgId: organizationId,
          customerId,
          name: data.name,
          description: data.description ?? null,
          address: data.address ?? null,
          contactNumber: data.contactNumber ?? null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          expectedEndDate: data.expectedEndDate
            ? new Date(data.expectedEndDate)
            : null,
          status: data.status ?? 'active',
          linkedBy,
        })
        .returning();

      if (data.managers && data.managers.length > 0) {
        await tx.insert(siteContacts).values(
          data.managers.map((manager, index) => ({
            siteId: created.id,
            orgId: organizationId,
            name: manager.name,
            phone: manager.phone ?? null,
            email: manager.email ?? null,
            role: 'manager',
            isPrimary: index === 0,
          })),
        );
      }

      return created;
    });

    return this.findSite(organizationId, site.id);
  }

  async updateCustomerSite(
    organizationId: string,
    customerId: string,
    siteId: string,
    data: {
      name?: string;
      description?: string;
      address?: string;
      contactNumber?: string;
      startDate?: string;
      expectedEndDate?: string;
      status?: 'active' | 'on_hold' | 'completed' | 'cancelled';
      managers?: { name: string; phone?: string; email?: string }[];
    },
  ): Promise<CustomerSite> {
    const site = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(sites)
        .set({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.contactNumber !== undefined && {
            contactNumber: data.contactNumber,
          }),
          ...(data.startDate !== undefined && {
            startDate: data.startDate ? new Date(data.startDate) : null,
          }),
          ...(data.expectedEndDate !== undefined && {
            expectedEndDate: data.expectedEndDate
              ? new Date(data.expectedEndDate)
              : null,
          }),
          ...(data.status !== undefined && { status: data.status }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.orgId, organizationId),
            eq(sites.customerId, customerId),
            isNull(sites.deletedAt),
          ),
        )
        .returning();

      if (!updated) {
        throw new NotFoundException('Site not found');
      }

      if (data.managers !== undefined) {
        await tx
          .update(siteContacts)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(siteContacts.siteId, siteId),
              isNull(siteContacts.deletedAt),
            ),
          );

        if (data.managers.length > 0) {
          await tx.insert(siteContacts).values(
            data.managers.map((manager, index) => ({
              siteId,
              orgId: organizationId,
              name: manager.name,
              phone: manager.phone ?? null,
              email: manager.email ?? null,
              role: 'manager',
              isPrimary: index === 0,
            })),
          );
        }
      }

      return updated;
    });

    return this.findSite(organizationId, site.id);
  }

  async deleteCustomerSite(
    organizationId: string,
    customerId: string,
    siteId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [site] = await tx
        .update(sites)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(sites.id, siteId),
            eq(sites.orgId, organizationId),
            eq(sites.customerId, customerId),
            isNull(sites.deletedAt),
          ),
        )
        .returning();

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      await tx
        .update(siteContacts)
        .set({ deletedAt: new Date() })
        .where(
          and(eq(siteContacts.siteId, siteId), isNull(siteContacts.deletedAt)),
        );
    });
  }

  private async findSite(
    organizationId: string,
    siteId: string,
  ): Promise<CustomerSite> {
    const row = await this.db.query.sites.findFirst({
      where: { id: siteId, orgId: organizationId, deletedAt: { isNull: true } },
      with: {
        contacts: { where: { deletedAt: { isNull: true } } },
      },
    });

    if (!row) {
      throw new NotFoundException('Site not found');
    }

    return this.toSite(row);
  }

  private async computeFinancialSummary(
    organizationId: string,
    customerId: string,
  ): Promise<CustomerFinancialSummary> {
    const invoiceRows = await this.db
      .select({
        id: invoices.id,
        status: invoices.status,
        dueDate: invoices.dueDate,
        grandTotalMinor: invoices.grandTotalMinor,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, organizationId),
          eq(invoices.customerId, customerId),
          ne(invoices.status, 'void'),
        ),
      );

    const [paidByInvoice, creditedByInvoice] = await this.loadAllocations(
      customerId,
      invoiceRows.map((i) => i.id),
    );

    const customerRow = await this.db.query.customers.findFirst({
      where: {
        id: customerId,
        orgId: organizationId,
        deletedAt: { isNull: true },
      },
      columns: { creditLimitMinor: true },
    });

    let totalBilled = 0n;
    let totalPaid = 0n;
    let totalCredited = 0n;
    let outstanding = 0n;
    let overdue = 0n;
    let openInvoiceCount = 0;
    let overdueInvoiceCount = 0;
    const today = new Date();

    for (const paid of paidByInvoice.values()) totalPaid += paid;
    for (const credited of creditedByInvoice.values())
      totalCredited += credited;

    for (const invoice of invoiceRows) {
      totalBilled += invoice.grandTotalMinor;
      const paid = paidByInvoice.get(invoice.id) ?? 0n;
      const credited = creditedByInvoice.get(invoice.id) ?? 0n;
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

    const creditLimitMinor = customerRow?.creditLimitMinor ?? null;
    const creditRemainingMinor =
      creditLimitMinor === null
        ? null
        : asMinor(creditLimitMinor - outstanding);

    return {
      totalBilledMinor: asMinor(totalBilled),
      totalPaidMinor: asMinor(totalPaid),
      totalCreditedMinor: asMinor(totalCredited),
      outstandingMinor: asMinor(outstanding),
      overdueMinor: asMinor(overdue),
      invoiceCount: invoiceRows.length,
      openInvoiceCount,
      overdueInvoiceCount,
      creditLimitMinor:
        creditLimitMinor === null ? null : asMinor(creditLimitMinor),
      creditRemainingMinor,
    };
  }

  private async loadAllocations(
    customerId: string,
    invoiceIds: string[],
  ): Promise<[Map<string, bigint>, Map<string, bigint>]> {
    if (invoiceIds.length === 0) {
      return [new Map(), new Map()];
    }

    const [paidRows, creditedRows] = await Promise.all([
      this.db
        .select({
          invoiceId: payments.invoiceId,
          total: sql<string>`COALESCE(SUM(${payments.amountMinor}), 0)`,
        })
        .from(payments)
        .where(inArray(payments.invoiceId, invoiceIds))
        .groupBy(payments.invoiceId),
      this.db
        .select({
          invoiceId: creditNotes.invoiceId,
          total: sql<string>`COALESCE(SUM(${creditNotes.grandTotalMinor}), 0)`,
        })
        .from(creditNotes)
        .where(inArray(creditNotes.invoiceId, invoiceIds))
        .groupBy(creditNotes.invoiceId),
    ]);

    const paidByInvoice = new Map(
      paidRows.map((row) => [row.invoiceId, BigInt(row.total)]),
    );
    const creditedByInvoice = new Map(
      creditedRows.map((row) => [row.invoiceId, BigInt(row.total)]),
    );

    return [paidByInvoice, creditedByInvoice];
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
}
