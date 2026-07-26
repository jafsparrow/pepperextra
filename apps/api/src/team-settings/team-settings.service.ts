import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_TOKEN } from '../db/database.module.js';
import type { DatabaseClient } from '@pepperextra/db';
import type {
  TeamSettings,
  TaxConfig,
  ServiceCharge,
} from '@pepperextra/contracts';

const uuid = () => crypto.randomUUID();

@Injectable()
export class TeamSettingsService {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DatabaseClient) {}

  // --- Team Settings ---

  async getTeamSettings(teamId: string): Promise<TeamSettings> {
    // TODO: implement when db tables are defined
    return await Promise.resolve({
      teamId,
      organizationId: '',
      printEnabled: true,
      paperWidth: '80mm',
      defaultPrinterIp: null,
      receiptFooter: null,
    });
  }

  async updateTeamSettings(
    teamId: string,
    data: Partial<Omit<TeamSettings, 'teamId' | 'organizationId'>>,
  ): Promise<TeamSettings> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      teamId,
      organizationId: '',
      printEnabled: data.printEnabled ?? true,
      paperWidth: data.paperWidth ?? '80mm',
      defaultPrinterIp: data.defaultPrinterIp ?? null,
      receiptFooter: data.receiptFooter ?? null,
    });
  }

  // --- Tax Configs ---

  async listTaxConfigs(teamId: string): Promise<TaxConfig[]> {
    console.log(teamId);
    // TODO: implement when db tables are defined
    return Promise.resolve([]);
  }

  async createTaxConfig(data: {
    teamId: string;
    organizationId: string;
    name: string;
    rate: string;
    type?: 'percentage' | 'fixed';
    isDefault?: boolean;
    active?: boolean;
  }): Promise<TaxConfig> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id: uuid(),
      teamId: data.teamId,
      organizationId: data.organizationId,
      name: data.name,
      rate: data.rate,
      type: data.type ?? 'percentage',
      isDefault: data.isDefault ?? false,
      active: data.active ?? true,
    });
  }

  async updateTaxConfig(
    id: string,
    data: Partial<{
      name: string;
      rate: string;
      type: 'percentage' | 'fixed';
      isDefault: boolean;
      active: boolean;
    }>,
  ): Promise<TaxConfig> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id,
      teamId: '',
      organizationId: '',
      name: data.name ?? '',
      rate: data.rate ?? '0',
      type: data.type ?? 'percentage',
      isDefault: data.isDefault ?? false,
      active: data.active ?? true,
    });
  }

  async deleteTaxConfig(id: string): Promise<void> {
    console.log(id);
    // TODO: implement when db tables are defined
    return Promise.resolve();
  }

  // --- Service Charges ---

  async listServiceCharges(teamId: string): Promise<ServiceCharge[]> {
    console.log(teamId);
    // TODO: implement when db tables are defined
    return Promise.resolve([]);
  }

  async createServiceCharge(data: {
    teamId: string;
    organizationId: string;
    name: string;
    amount: string;
    type?: 'percentage' | 'fixed';
    isDefault?: boolean;
    active?: boolean;
  }): Promise<ServiceCharge> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id: uuid(),
      teamId: data.teamId,
      organizationId: data.organizationId,
      name: data.name,
      amount: data.amount,
      type: data.type ?? 'fixed',
      isDefault: data.isDefault ?? false,
      active: data.active ?? true,
    });
  }

  async updateServiceCharge(
    id: string,
    data: Partial<{
      name: string;
      amount: string;
      type: 'percentage' | 'fixed';
      isDefault: boolean;
      active: boolean;
    }>,
  ): Promise<ServiceCharge> {
    // TODO: implement when db tables are defined
    return Promise.resolve({
      id,
      teamId: '',
      organizationId: '',
      name: data.name ?? '',
      amount: data.amount ?? '0',
      type: data.type ?? 'fixed',
      isDefault: data.isDefault ?? false,
      active: data.active ?? true,
    });
  }

  async deleteServiceCharge(id: string): Promise<string> {
    console.log(id);
    // TODO: implement when db tables are defined
    return Promise.resolve('succes');
  }
}
