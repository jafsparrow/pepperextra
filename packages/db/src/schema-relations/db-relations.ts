import { defineRelations } from "drizzle-orm"
import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
} from "../auth-schema"
import { team, teamMember } from "../auth-schema"
import { orgMetadata, teamMetadata, userMetadata } from "../schemas/metadata"
import {
  countries,
  currencies,
  taxTypes,
  orgTaxConfig,
} from "../schemas/localization"
import {
  productGroups,
  products,
  productLocationOverrides,
  productAlternatives,
  catalogRequests,
  categories,
} from "../schemas/catalog"
import { priceLists, priceListOverrides } from "../schemas/price-lists"
import { productTags } from "../schemas/tags"
import { productTagAssignments } from "../schemas/tags"
import { stock } from "../schemas/stock"
import { productImages } from "../schemas/images"
import {
  fulfillmentStations,
  fulfillmentStationLines,
} from "../schemas/stations"
import {
  quotations,
  quotationLines,
  quotationCharges,
} from "../schemas/quotations"
import {
  invoices,
  invoiceLines,
  invoiceCharges,
  invoiceCounters,
} from "../schemas/invoices"
import { payments } from "../schemas/payments"
import {
  creditNotes,
  creditNoteLines,
  creditNoteCharges,
} from "../schemas/credit-notes"
import {
  warrantyItems,
  invoiceWarrantyLines,
  warrantyClaims,
  supplierWarrantyClaims,
} from "../schemas/warranty"
import {
  customers,
  customerContacts,
  sites,
  siteContacts,
} from "../schemas/customers"
import {
  suppliers,
  purchaseReceipts,
  purchaseInvoices,
  purchaseInvoiceLines,
  purchaseInvoiceCharges,
  supplierPayments,
} from "../schemas/suppliers"
import { tradespeople, loyaltyRedemptions, qrCodes } from "../schemas/loyalty"

export const dbRelations = defineRelations(
  {
    user,
    session,
    account,
    organization,
    member,
    invitation,
    team,
    teamMember,
    orgMetadata,
    teamMetadata,
    userMetadata,
    countries,
    currencies,
    taxTypes,
    orgTaxConfig,
    productGroups,
    products,
    categories,
    productLocationOverrides,
    productAlternatives,
    catalogRequests,
    priceLists,
    priceListOverrides,
    productTags,
    productTagAssignments,
    stock,
    productImages,
    fulfillmentStations,
    fulfillmentStationLines,
    quotations,
    quotationLines,
    quotationCharges,
    invoices,
    invoiceLines,
    invoiceCharges,
    invoiceCounters,
    payments,
    creditNotes,
    creditNoteLines,
    creditNoteCharges,
    warrantyItems,
    invoiceWarrantyLines,
    warrantyClaims,
    supplierWarrantyClaims,
    customers,
    customerContacts,
    sites,
    siteContacts,
    suppliers,
    purchaseReceipts,
    purchaseInvoices,
    purchaseInvoiceLines,
    purchaseInvoiceCharges,
    supplierPayments,
    tradespeople,
    loyaltyRedemptions,
    qrCodes,
  },
  (r) => ({
    // ── Auth user extensions ──────────────────
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      teamMembers: r.many.teamMember(),
      members: r.many.member(),
      invitations: r.many.invitation(),
      userMetadata: r.many.userMetadata(),
      catalogRequests: r.many.catalogRequests(),
      quotations: r.many.quotations(),
      invoices: r.many.invoices(),
      payments: r.many.payments(),
      creditNotes: r.many.creditNotes(),
      warrantyClaims: r.many.warrantyClaims(),
      loyaltyRedemptions: r.many.loyaltyRedemptions(),
      qrCodes: r.many.qrCodes(),
      sites: r.many.sites(),
      purchaseReceipts: r.many.purchaseReceipts(),
      supplierPayments: r.many.supplierPayments(),
      fulfillmentStationLines: r.many.fulfillmentStationLines(),
    },
    session: { user: r.one.user({ from: r.session.userId, to: r.user.id }) },
    account: { user: r.one.user({ from: r.account.userId, to: r.user.id }) },
    // ── Auth organization extensions ──────────
    organization: {
      teams: r.many.team(),
      members: r.many.member(),
      invitations: r.many.invitation(),
      orgMetadata: r.many.orgMetadata(),
      teamMetadata: r.many.teamMetadata(),
      userMetadata: r.many.userMetadata(),
      orgTaxConfig: r.many.orgTaxConfig(),
      productGroups: r.many.productGroups(),
      products: r.many.products(),
      categories: r.many.categories(),
      productLocationOverrides: r.many.productLocationOverrides(),
      productAlternatives: r.many.productAlternatives(),
      catalogRequests: r.many.catalogRequests(),
      priceLists: r.many.priceLists(),
      priceListOverrides: r.many.priceListOverrides(),
      productTags: r.many.productTags(),
      stock: r.many.stock(),
      productImages: r.many.productImages(),
      fulfillmentStations: r.many.fulfillmentStations(),
      fulfillmentStationLines: r.many.fulfillmentStationLines(),
      quotations: r.many.quotations(),
      quotationLines: r.many.quotationLines(),
      quotationCharges: r.many.quotationCharges(),
      invoices: r.many.invoices(),
      invoiceLines: r.many.invoiceLines(),
      invoiceCharges: r.many.invoiceCharges(),
      invoiceCounters: r.many.invoiceCounters(),
      payments: r.many.payments(),
      creditNotes: r.many.creditNotes(),
      creditNoteLines: r.many.creditNoteLines(),
      creditNoteCharges: r.many.creditNoteCharges(),
      warrantyItems: r.many.warrantyItems(),
      invoiceWarrantyLines: r.many.invoiceWarrantyLines(),
      warrantyClaims: r.many.warrantyClaims(),
      supplierWarrantyClaims: r.many.supplierWarrantyClaims(),
      customers: r.many.customers(),
      customerContacts: r.many.customerContacts(),
      sites: r.many.sites(),
      siteContacts: r.many.siteContacts(),
      suppliers: r.many.suppliers(),
      purchaseReceipts: r.many.purchaseReceipts(),
      purchaseInvoices: r.many.purchaseInvoices(),
      purchaseInvoiceLines: r.many.purchaseInvoiceLines(),
      purchaseInvoiceCharges: r.many.purchaseInvoiceCharges(),
      supplierPayments: r.many.supplierPayments(),
      tradespeople: r.many.tradespeople(),
      loyaltyRedemptions: r.many.loyaltyRedemptions(),
      qrCodes: r.many.qrCodes(),
    },
    // ── Auth team extensions ──────────────────
    team: {
      organization: r.one.organization({
        from: r.team.organizationId,
        to: r.organization.id,
      }),
      teamMembers: r.many.teamMember(),
      teamMetadata: r.many.teamMetadata(),
      stock: r.many.stock(),
      fulfillmentStations: r.many.fulfillmentStations(),
      productLocationOverrides: r.many.productLocationOverrides(),
      productTags: r.many.productTags(),
      catalogRequests: r.many.catalogRequests(),
      purchaseReceipts: r.many.purchaseReceipts(),
      purchaseInvoices: r.many.purchaseInvoices(),
    },
    teamMember: {
      team: r.one.team({ from: r.teamMember.teamId, to: r.team.id }),
      user: r.one.user({ from: r.teamMember.userId, to: r.user.id }),
    },
    member: {
      organization: r.one.organization({
        from: r.member.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({ from: r.member.userId, to: r.user.id }),
    },
    invitation: {
      organization: r.one.organization({
        from: r.invitation.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({ from: r.invitation.inviterId, to: r.user.id }),
    },
    // ── Business table relations ─────────────
    orgMetadata: {
      organization: r.one.organization({
        from: r.orgMetadata.orgId,
        to: r.organization.id,
      }),
      country: r.one.countries({
        from: r.orgMetadata.countryId,
        to: r.countries.id,
      }),
      currency: r.one.currencies({
        from: r.orgMetadata.currencyId,
        to: r.currencies.id,
      }),
    },
    teamMetadata: {
      team: r.one.team({ from: r.teamMetadata.teamId, to: r.team.id }),
      organization: r.one.organization({
        from: r.teamMetadata.orgId,
        to: r.organization.id,
      }),
    },
    userMetadata: {
      user: r.one.user({ from: r.userMetadata.userId, to: r.user.id }),
      organization: r.one.organization({
        from: r.userMetadata.orgId,
        to: r.organization.id,
      }),
      team: r.one.team({ from: r.userMetadata.teamId, to: r.team.id }),
    },
    countries: {
      currency: r.one.currencies({
        from: r.countries.currencyId,
        to: r.currencies.id,
      }),
      orgMetadata: r.many.orgMetadata(),
    },
    currencies: {
      countries: r.many.countries(),
      orgMetadata: r.many.orgMetadata(),
    },
    taxTypes: {
      country: r.one.countries({
        from: r.taxTypes.countryId,
        to: r.countries.id,
      }),
      orgConfigs: r.many.orgTaxConfig(),
    },
    orgTaxConfig: {
      organization: r.one.organization({
        from: r.orgTaxConfig.orgId,
        to: r.organization.id,
      }),
      taxType: r.one.taxTypes({
        from: r.orgTaxConfig.taxTypeId,
        to: r.taxTypes.id,
      }),
    },
    productGroups: {
      organization: r.one.organization({
        from: r.productGroups.orgId,
        to: r.organization.id,
      }),
      products: r.many.products(),
    },
    categories: {
      organization: r.one.organization({
        from: r.categories.orgId,
        to: r.organization.id,
      }),
      parent: r.one.categories({
        from: r.categories.parentId,
        to: r.categories.id,
      }),
      children: r.many.categories(),
      products: r.many.products(),
    },
    products: {
      organization: r.one.organization({
        from: r.products.orgId,
        to: r.organization.id,
      }),
      productGroup: r.one.productGroups({
        from: r.products.productGroupId,
        to: r.productGroups.id,
      }),
      category: r.one.categories({
        from: r.products.categoryId,
        to: r.categories.id,
      }),
      locationOverrides: r.many.productLocationOverrides(),
      stock: r.many.stock(),
      catalogRequests: r.many.catalogRequests(),
      quotationLines: r.many.quotationLines(),
      invoiceLines: r.many.invoiceLines(),
      qrCodes: r.many.qrCodes(),
      purchaseReceipts: r.many.purchaseReceipts(),
      purchaseInvoiceLines: r.many.purchaseInvoiceLines(),
      supplierWarrantyClaims: r.many.supplierWarrantyClaims(),
      images: r.many.productImages(),
    },
    productAlternatives: {
      product: r.one.products({
        from: r.productAlternatives.productId,
        to: r.products.id,
      }),
      alternativeProduct: r.one.products({
        from: r.productAlternatives.alternativeProductId,
        to: r.products.id,
      }),
      organization: r.one.organization({
        from: r.productAlternatives.orgId,
        to: r.organization.id,
      }),
    },
    productImages: {
      product: r.one.products({
        from: r.productImages.productId,
        to: r.products.id,
      }),
      organization: r.one.organization({
        from: r.productImages.orgId,
        to: r.organization.id,
      }),
    },
    productLocationOverrides: {
      product: r.one.products({
        from: r.productLocationOverrides.productId,
        to: r.products.id,
      }),
      team: r.one.team({
        from: r.productLocationOverrides.teamId,
        to: r.team.id,
      }),
      organization: r.one.organization({
        from: r.productLocationOverrides.orgId,
        to: r.organization.id,
      }),
    },
    catalogRequests: {
      organization: r.one.organization({
        from: r.catalogRequests.orgId,
        to: r.organization.id,
      }),
      team: r.one.team({ from: r.catalogRequests.teamId, to: r.team.id }),
      submittedByUser: r.one.user({
        from: r.catalogRequests.submittedBy,
        to: r.user.id,
      }),
      mappedProduct: r.one.products({
        from: r.catalogRequests.mappedToSku,
        to: r.products.id,
      }),
    },
    priceLists: {
      organization: r.one.organization({
        from: r.priceLists.orgId,
        to: r.organization.id,
      }),
      overrides: r.many.priceListOverrides(),
    },
    priceListOverrides: {
      priceList: r.one.priceLists({
        from: r.priceListOverrides.priceListId,
        to: r.priceLists.id,
      }),
      product: r.one.products({
        from: r.priceListOverrides.productId,
        to: r.products.id,
      }),
      organization: r.one.organization({
        from: r.priceListOverrides.orgId,
        to: r.organization.id,
      }),
    },
    productTags: {
      organization: r.one.organization({
        from: r.productTags.orgId,
        to: r.organization.id,
      }),
      team: r.one.team({ from: r.productTags.teamId, to: r.team.id }),
      tagAssignments: r.many.productTagAssignments(),
    },
    productTagAssignments: {
      tag: r.one.productTags({
        from: r.productTagAssignments.tagId,
        to: r.productTags.id,
      }),
      product: r.one.products({
        from: r.productTagAssignments.productId,
        to: r.products.id,
      }),
    },
    stock: {
      product: r.one.products({ from: r.stock.productId, to: r.products.id }),
      team: r.one.team({ from: r.stock.teamId, to: r.team.id }),
      organization: r.one.organization({
        from: r.stock.orgId,
        to: r.organization.id,
      }),
    },
    fulfillmentStations: {
      organization: r.one.organization({
        from: r.fulfillmentStations.orgId,
        to: r.organization.id,
      }),
      team: r.one.team({ from: r.fulfillmentStations.teamId, to: r.team.id }),
      stationLines: r.many.fulfillmentStationLines(),
    },
    fulfillmentStationLines: {
      quotationLine: r.one.quotationLines({
        from: r.fulfillmentStationLines.quotationLineId,
        to: r.quotationLines.id,
      }),
      station: r.one.fulfillmentStations({
        from: r.fulfillmentStationLines.stationId,
        to: r.fulfillmentStations.id,
      }),
      organization: r.one.organization({
        from: r.fulfillmentStationLines.orgId,
        to: r.organization.id,
      }),
      markedByUser: r.one.user({
        from: r.fulfillmentStationLines.markedBy,
        to: r.user.id,
      }),
    },
    quotations: {
      organization: r.one.organization({
        from: r.quotations.orgId,
        to: r.organization.id,
      }),
      team: r.one.team({ from: r.quotations.teamId, to: r.team.id }),
      createdByUser: r.one.user({
        from: r.quotations.createdBy,
        to: r.user.id,
      }),
      lines: r.many.quotationLines(),
      charges: r.many.quotationCharges(),
    },
    quotationLines: {
      quotation: r.one.quotations({
        from: r.quotationLines.quotationId,
        to: r.quotations.id,
      }),
      product: r.one.products({
        from: r.quotationLines.productId,
        to: r.products.id,
      }),
      organization: r.one.organization({
        from: r.quotationLines.orgId,
        to: r.organization.id,
      }),
      stationLines: r.many.fulfillmentStationLines(),
    },
    quotationCharges: {
      quotation: r.one.quotations({
        from: r.quotationCharges.quotationId,
        to: r.quotations.id,
      }),
      taxType: r.one.taxTypes({
        from: r.quotationCharges.taxTypeId,
        to: r.taxTypes.id,
      }),
      organization: r.one.organization({
        from: r.quotationCharges.orgId,
        to: r.organization.id,
      }),
    },
    invoices: {
      organization: r.one.organization({
        from: r.invoices.orgId,
        to: r.organization.id,
      }),
      team: r.one.team({ from: r.invoices.teamId, to: r.team.id }),
      issuedByUser: r.one.user({ from: r.invoices.issuedBy, to: r.user.id }),
      lines: r.many.invoiceLines(),
      charges: r.many.invoiceCharges(),
      payments: r.many.payments(),
      creditNotes: r.many.creditNotes(),
      warrantyLines: r.many.invoiceWarrantyLines(),
    },
    invoiceLines: {
      invoice: r.one.invoices({
        from: r.invoiceLines.invoiceId,
        to: r.invoices.id,
      }),
      product: r.one.products({
        from: r.invoiceLines.productId,
        to: r.products.id,
      }),
      organization: r.one.organization({
        from: r.invoiceLines.orgId,
        to: r.organization.id,
      }),
      warrantyLines: r.many.invoiceWarrantyLines(),
      creditNoteLines: r.many.creditNoteLines(),
    },
    invoiceCharges: {
      invoice: r.one.invoices({
        from: r.invoiceCharges.invoiceId,
        to: r.invoices.id,
      }),
      taxType: r.one.taxTypes({
        from: r.invoiceCharges.taxTypeId,
        to: r.taxTypes.id,
      }),
      organization: r.one.organization({
        from: r.invoiceCharges.orgId,
        to: r.organization.id,
      }),
    },
    invoiceCounters: {
      organization: r.one.organization({
        from: r.invoiceCounters.orgId,
        to: r.organization.id,
      }),
    },
    payments: {
      organization: r.one.organization({
        from: r.payments.orgId,
        to: r.organization.id,
      }),
      invoice: r.one.invoices({
        from: r.payments.invoiceId,
        to: r.invoices.id,
      }),
      recordedByUser: r.one.user({
        from: r.payments.recordedBy,
        to: r.user.id,
      }),
    },
    creditNotes: {
      organization: r.one.organization({
        from: r.creditNotes.orgId,
        to: r.organization.id,
      }),
      invoice: r.one.invoices({
        from: r.creditNotes.invoiceId,
        to: r.invoices.id,
      }),
      createdByUser: r.one.user({
        from: r.creditNotes.createdBy,
        to: r.user.id,
      }),
      lines: r.many.creditNoteLines(),
      charges: r.many.creditNoteCharges(),
    },
    creditNoteLines: {
      creditNote: r.one.creditNotes({
        from: r.creditNoteLines.creditNoteId,
        to: r.creditNotes.id,
      }),
      invoiceLine: r.one.invoiceLines({
        from: r.creditNoteLines.invoiceLineId,
        to: r.invoiceLines.id,
      }),
      product: r.one.products({
        from: r.creditNoteLines.productId,
        to: r.products.id,
      }),
      organization: r.one.organization({
        from: r.creditNoteLines.orgId,
        to: r.organization.id,
      }),
    },
    creditNoteCharges: {
      creditNote: r.one.creditNotes({
        from: r.creditNoteCharges.creditNoteId,
        to: r.creditNotes.id,
      }),
      taxType: r.one.taxTypes({
        from: r.creditNoteCharges.taxTypeId,
        to: r.taxTypes.id,
      }),
      organization: r.one.organization({
        from: r.creditNoteCharges.orgId,
        to: r.organization.id,
      }),
    },
    warrantyItems: {
      organization: r.one.organization({
        from: r.warrantyItems.orgId,
        to: r.organization.id,
      }),
      invoiceWarrantyLines: r.many.invoiceWarrantyLines(),
    },
    invoiceWarrantyLines: {
      organization: r.one.organization({
        from: r.invoiceWarrantyLines.orgId,
        to: r.organization.id,
      }),
      invoice: r.one.invoices({
        from: r.invoiceWarrantyLines.invoiceId,
        to: r.invoices.id,
      }),
      invoiceLine: r.one.invoiceLines({
        from: r.invoiceWarrantyLines.invoiceLineId,
        to: r.invoiceLines.id,
      }),
      warrantyItem: r.one.warrantyItems({
        from: r.invoiceWarrantyLines.warrantyId,
        to: r.warrantyItems.id,
      }),
      claims: r.many.warrantyClaims(),
    },
    warrantyClaims: {
      organization: r.one.organization({
        from: r.warrantyClaims.orgId,
        to: r.organization.id,
      }),
      warrantyLine: r.one.invoiceWarrantyLines({
        from: r.warrantyClaims.warrantyLineId,
        to: r.invoiceWarrantyLines.id,
      }),
      handledByUser: r.one.user({
        from: r.warrantyClaims.handledBy,
        to: r.user.id,
      }),
    },
    supplierWarrantyClaims: {
      organization: r.one.organization({
        from: r.supplierWarrantyClaims.orgId,
        to: r.organization.id,
      }),
      supplier: r.one.suppliers({
        from: r.supplierWarrantyClaims.supplierId,
        to: r.suppliers.id,
      }),
      product: r.one.products({
        from: r.supplierWarrantyClaims.productId,
        to: r.products.id,
      }),
    },
    customers: {
      organization: r.one.organization({
        from: r.customers.orgId,
        to: r.organization.id,
      }),
      contacts: r.many.customerContacts(),
      sites: r.many.sites(),
    },
    customerContacts: {
      customer: r.one.customers({
        from: r.customerContacts.customerId,
        to: r.customers.id,
      }),
      organization: r.one.organization({
        from: r.customerContacts.orgId,
        to: r.organization.id,
      }),
    },
    sites: {
      organization: r.one.organization({
        from: r.sites.orgId,
        to: r.organization.id,
      }),
      customer: r.one.customers({
        from: r.sites.customerId,
        to: r.customers.id,
      }),
      linkedByUser: r.one.user({ from: r.sites.linkedBy, to: r.user.id }),
      contacts: r.many.siteContacts(),
    },
    siteContacts: {
      site: r.one.sites({ from: r.siteContacts.siteId, to: r.sites.id }),
      organization: r.one.organization({
        from: r.siteContacts.orgId,
        to: r.organization.id,
      }),
    },
    suppliers: {
      organization: r.one.organization({
        from: r.suppliers.orgId,
        to: r.organization.id,
      }),
      purchaseReceipts: r.many.purchaseReceipts(),
      purchaseInvoices: r.many.purchaseInvoices(),
      supplierPayments: r.many.supplierPayments(),
      supplierWarrantyClaims: r.many.supplierWarrantyClaims(),
    },
    purchaseReceipts: {
      organization: r.one.organization({
        from: r.purchaseReceipts.orgId,
        to: r.organization.id,
      }),
      team: r.one.team({ from: r.purchaseReceipts.teamId, to: r.team.id }),
      supplier: r.one.suppliers({
        from: r.purchaseReceipts.supplierId,
        to: r.suppliers.id,
      }),
      product: r.one.products({
        from: r.purchaseReceipts.productId,
        to: r.products.id,
      }),
      recordedByUser: r.one.user({
        from: r.purchaseReceipts.recordedBy,
        to: r.user.id,
      }),
    },
    purchaseInvoices: {
      organization: r.one.organization({
        from: r.purchaseInvoices.orgId,
        to: r.organization.id,
      }),
      team: r.one.team({ from: r.purchaseInvoices.teamId, to: r.team.id }),
      supplier: r.one.suppliers({
        from: r.purchaseInvoices.supplierId,
        to: r.suppliers.id,
      }),
      lines: r.many.purchaseInvoiceLines(),
      charges: r.many.purchaseInvoiceCharges(),
      payments: r.many.supplierPayments(),
    },
    purchaseInvoiceLines: {
      purchaseInvoice: r.one.purchaseInvoices({
        from: r.purchaseInvoiceLines.purchaseInvoiceId,
        to: r.purchaseInvoices.id,
      }),
      product: r.one.products({
        from: r.purchaseInvoiceLines.productId,
        to: r.products.id,
      }),
      organization: r.one.organization({
        from: r.purchaseInvoiceLines.orgId,
        to: r.organization.id,
      }),
    },
    purchaseInvoiceCharges: {
      purchaseInvoice: r.one.purchaseInvoices({
        from: r.purchaseInvoiceCharges.purchaseInvoiceId,
        to: r.purchaseInvoices.id,
      }),
      taxType: r.one.taxTypes({
        from: r.purchaseInvoiceCharges.taxTypeId,
        to: r.taxTypes.id,
      }),
      organization: r.one.organization({
        from: r.purchaseInvoiceCharges.orgId,
        to: r.organization.id,
      }),
    },
    supplierPayments: {
      organization: r.one.organization({
        from: r.supplierPayments.orgId,
        to: r.organization.id,
      }),
      supplier: r.one.suppliers({
        from: r.supplierPayments.supplierId,
        to: r.suppliers.id,
      }),
      purchaseInvoice: r.one.purchaseInvoices({
        from: r.supplierPayments.purchaseInvoiceId,
        to: r.purchaseInvoices.id,
      }),
      recordedByUser: r.one.user({
        from: r.supplierPayments.recordedBy,
        to: r.user.id,
      }),
    },
    tradespeople: {
      organization: r.one.organization({
        from: r.tradespeople.orgId,
        to: r.organization.id,
      }),
      customer: r.one.customers({
        from: r.tradespeople.customerId,
        to: r.customers.id,
      }),
      redemptions: r.many.loyaltyRedemptions(),
      scannedQrCodes: r.many.qrCodes(),
    },
    loyaltyRedemptions: {
      organization: r.one.organization({
        from: r.loyaltyRedemptions.orgId,
        to: r.organization.id,
      }),
      tradesperson: r.one.tradespeople({
        from: r.loyaltyRedemptions.tradespersonId,
        to: r.tradespeople.id,
      }),
      processedByUser: r.one.user({
        from: r.loyaltyRedemptions.processedBy,
        to: r.user.id,
      }),
    },
    qrCodes: {
      organization: r.one.organization({
        from: r.qrCodes.orgId,
        to: r.organization.id,
      }),
      product: r.one.products({ from: r.qrCodes.productId, to: r.products.id }),
      tradesperson: r.one.tradespeople({
        from: r.qrCodes.tradespersonId,
        to: r.tradespeople.id,
      }),
      scannedByUser: r.one.user({ from: r.qrCodes.scannedBy, to: r.user.id }),
    },
  })
)
