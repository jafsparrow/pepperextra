import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@repo/db';
import type {
  Supplier,
  SupplierDetails,
  SupplierFinancialSummary,
  PurchaseInvoice,
  PurchaseInvoiceDetail,
  SupplierPayment,
} from '@repo/contracts';

const uuid = () => crypto.randomUUID();

@Injectable()
export class SupplierService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  async listSuppliers(organizationId: string): Promise<Supplier[]> {
    console.log(organizationId);
    // TODO: implement when db tables are defined
    return Promise.resolve([
      {
        id: 'sup-omancem',
        organizationId,
        name: 'Oman Cement Company',
        contactName: 'Salim Al Harthy',
        contactPhone: '+968 9244 1122',
        contactEmail: 'sales@oman-cement.om',
        paymentTermsDays: 30,
      },
      {
        id: 'sup-muscat-steel',
        organizationId,
        name: 'Muscat Steel Trading',
        contactName: 'Rajesh Kumar',
        contactPhone: '+968 9133 4455',
        contactEmail: 'info@muscatsteel.om',
        paymentTermsDays: 15,
      },
      {
        id: 'sup-jotun',
        organizationId,
        name: 'Jotun Oman',
        contactName: 'Aisha Al Balushi',
        contactPhone: '+968 2456 7788',
        contactEmail: 'orders.oman@jotun.com',
        paymentTermsDays: 45,
      },
    ]);
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
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id: uuid(),
      organizationId,
      name: data.name,
      contactName: data.contactName ?? null,
      contactPhone: data.contactPhone ?? null,
      contactEmail: data.contactEmail ?? null,
      paymentTermsDays: data.paymentTermsDays ?? null,
    });
  }

  async updateSupplier(
    id: string,
    data: Partial<{
      name: string;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      paymentTermsDays: number;
    }>,
  ): Promise<Supplier> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id,
      organizationId: '',
      name: data.name ?? '',
      contactName: data.contactName ?? null,
      contactPhone: data.contactPhone ?? null,
      contactEmail: data.contactEmail ?? null,
      paymentTermsDays: data.paymentTermsDays ?? null,
    });
  }

  async deleteSupplier(id: string): Promise<void> {
    console.log(id);
    // TODO: implement when db tables are defined
    return Promise.resolve();
  }

  async getSupplier(
    organizationId: string,
    id: string,
  ): Promise<SupplierDetails> {
    // TODO: implement when db tables are defined
    const supplier: Supplier = {
      id,
      organizationId,
      name: 'Oman Cement Company',
      contactName: 'Salim Al Harthy',
      contactPhone: '+968 9244 1122',
      contactEmail: 'sales@oman-cement.om',
      paymentTermsDays: 30,
    };

    const financialSummary: SupplierFinancialSummary = {
      totalBilledMinor: '15000000',
      totalPaidMinor: '5000000',
      totalCreditedMinor: '0',
      outstandingMinor: '10000000',
      overdueMinor: '3000000',
      invoiceCount: 5,
      openInvoiceCount: 3,
      overdueInvoiceCount: 2,
    };

    return Promise.resolve({ ...supplier, financialSummary });
  }

  async listSupplierInvoices(
    organizationId: string,
    supplierId: string,
  ): Promise<PurchaseInvoice[]> {
    void organizationId;
    void supplierId;
    // TODO: implement when db tables are defined
    return Promise.resolve([
      {
        id: 'pi-001',
        invoiceNumber: 'PINV-2024-001',
        status: 'active',
        issuedAt: '2024-01-10T00:00:00Z',
        dueDate: '2024-02-09T00:00:00Z',
        grandTotalMinor: '5000000',
        paidMinor: '0',
        creditedMinor: '0',
        outstandingMinor: '5000000',
      },
      {
        id: 'pi-002',
        invoiceNumber: 'PINV-2024-002',
        status: 'active',
        issuedAt: '2024-01-20T00:00:00Z',
        dueDate: '2024-02-19T00:00:00Z',
        grandTotalMinor: '3000000',
        paidMinor: '1000000',
        creditedMinor: '0',
        outstandingMinor: '2000000',
      },
      {
        id: 'pi-003',
        invoiceNumber: 'PINV-2024-003',
        status: 'paid',
        issuedAt: '2024-01-05T00:00:00Z',
        dueDate: '2024-02-04T00:00:00Z',
        grandTotalMinor: '2000000',
        paidMinor: '2000000',
        creditedMinor: '0',
        outstandingMinor: '0',
      },
      {
        id: 'pi-004',
        invoiceNumber: 'PINV-2024-004',
        status: 'active',
        issuedAt: '2024-02-01T00:00:00Z',
        dueDate: '2024-03-03T00:00:00Z',
        grandTotalMinor: '4500000',
        paidMinor: '0',
        creditedMinor: '0',
        outstandingMinor: '4500000',
      },
      {
        id: 'pi-005',
        invoiceNumber: 'PINV-2024-005',
        status: 'active',
        issuedAt: '2024-02-15T00:00:00Z',
        dueDate: '2024-03-17T00:00:00Z',
        grandTotalMinor: '1500000',
        paidMinor: '500000',
        creditedMinor: '0',
        outstandingMinor: '1000000',
      },
    ]);
  }

  async getSupplierInvoice(
    organizationId: string,
    supplierId: string,
    invoiceId: string,
  ): Promise<PurchaseInvoiceDetail> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id: invoiceId,
      invoiceNumber: 'PINV-2024-001',
      status: 'active',
      issuedAt: '2024-01-10T00:00:00Z',
      dueDate: '2024-02-09T00:00:00Z',
      grandTotalMinor: '5000000',
      paidMinor: '0',
      creditedMinor: '0',
      outstandingMinor: '5000000',
      lines: [
        {
          id: 'pil-001',
          description: 'Portland Cement - 50kg bags',
          quantity: '100',
          unitCostMinor: '35000',
          lineTotalMinor: '3500000',
          taxBreakdown: { '5%': 175000 },
        },
        {
          id: 'pil-002',
          description: 'White Cement - 50kg bags',
          quantity: '50',
          unitCostMinor: '28000',
          lineTotalMinor: '1400000',
          taxBreakdown: { '5%': 70000 },
        },
      ],
      subtotalMinor: '4900000',
      taxTotalMinor: '245000',
      taxBreakdown: { '5%': 245000 },
    });
  }

  async listSupplierPayments(
    organizationId: string,
    supplierId: string,
  ): Promise<SupplierPayment[]> {
    void organizationId;
    void supplierId;
    // TODO: implement when db tables are defined
    return Promise.resolve([
      {
        id: 'sp-001',
        purchaseInvoiceId: 'pi-002',
        invoiceNumber: 'PINV-2024-002',
        amountMinor: '1000000',
        method: 'bank_transfer',
        reference: 'TXN-2024-001',
        paidAt: '2024-01-25T00:00:00Z',
      },
      {
        id: 'sp-002',
        purchaseInvoiceId: 'pi-003',
        invoiceNumber: 'PINV-2024-003',
        amountMinor: '2000000',
        method: 'bank_transfer',
        reference: 'TXN-2024-002',
        paidAt: '2024-01-30T00:00:00Z',
      },
      {
        id: 'sp-003',
        purchaseInvoiceId: 'pi-005',
        invoiceNumber: 'PINV-2024-005',
        amountMinor: '500000',
        method: 'cash',
        reference: 'CSH-2024-001',
        paidAt: '2024-02-20T00:00:00Z',
      },
    ]);
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
  ): Promise<SupplierPayment[]> {
    // TODO: implement when db tables are defined
    // For now, return mock payments based on allocations
    const payments: SupplierPayment[] = data.allocations.map((alloc) => ({
      id: uuid(),
      purchaseInvoiceId: alloc.purchaseInvoiceId,
      invoiceNumber: `PINV-2024-${alloc.purchaseInvoiceId.slice(-3)}`,
      amountMinor: alloc.amountMinor,
      method: data.method,
      reference: data.reference ?? null,
      paidAt: data.paidAt,
    }));

    return Promise.resolve(payments);
  }
}
