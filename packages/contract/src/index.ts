import { oc, populateContractRouterPaths } from "@orpc/contract"
import z, { success } from "zod"
import { listGalxy } from "./galaxies.js"
import {
  banOrganizationStaffUser,
  changeOwnPassword,
  createOrganizationStaffUser,
  resetOrganizationStaffUserPassword,
  resetUserPassword,
} from "./users.js"
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  updateOrganizationName,
} from "./org-settings.js"
import {
  getTeamSettings,
  updateTeamSettings,
  listTaxConfigs,
  createTaxConfig,
  updateTaxConfig,
  deleteTaxConfig,
  listServiceCharges,
  createServiceCharge,
  updateServiceCharge,
  deleteServiceCharge,
} from "./team-settings.js"
import {
  getBranchProfile,
  updateBranchProfile,
  updateBranchInfo,
} from "./branch.js"
import {
  listProductGroups,
  createProductGroup,
  updateProductGroup,
  deleteProductGroup,
  listGroupProducts,
  addGroupProduct,
  removeGroupProduct,
} from "./product-group.js"
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.js"
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./product.js"
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "./supplier.js"
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomer,
  listCustomerInvoices,
  listCustomerPayments,
  listCustomerCreditNotes,
  listCustomerWarrantyClaims,
  listCustomerSites,
  createCustomerSite,
  updateCustomerSite,
  deleteCustomerSite,
} from "./customer.js"
import { listCountries } from "./localization.js"

// [NOTE] :- zod schema should be exported just like that
// not as export type {}, coz we need whole thing to be available
export {
  organizationStaffUserCreateInputSchema,
  organizationStaffUserSchema,
} from "./users.js"

export type {
  CreateOrganizationStaffUserDto,
  OrganizationStaffUser,
} from "./users.js"

export {
  organizationSettingsSchema,
  organizationSettingsUpdateSchema,
  updateOrganizationNameSchema,
} from "./org-settings.js"

export type { OrganizationSettings } from "./org-settings.js"

export {
  teamSettingsSchema,
  teamSettingsUpdateSchema,
  taxConfigSchema,
  taxConfigCreateSchema,
  taxConfigUpdateSchema,
  serviceChargeSchema,
  serviceChargeCreateSchema,
  serviceChargeUpdateSchema,
} from "./team-settings.js"

export type { TeamSettings, TaxConfig, ServiceCharge } from "./team-settings.js"

export {
  branchProfileSchema,
  branchProfileUpdateSchema,
  branchInfoUpdateSchema,
} from "./branch.js"

export type { BranchProfile, BranchInfoUpdate } from "./branch.js"

export {
  productGroupSchema,
  productGroupCreateSchema,
  productGroupUpdateSchema,
} from "./product-group.js"

export type { ProductGroup } from "./product-group.js"

export {
  categorySchema,
  categoryCreateSchema,
  categoryUpdateSchema,
} from "./category.js"

export type { Category } from "./category.js"

export {
  productSchema,
  productCreateSchema,
  productUpdateSchema,
  productDetailSchema,
  productImageSchema,
  productLocationOverrideSchema,
  productStockSchema,
  loyaltyPointsConfigSchema,
} from "./product.js"

export type {
  Product,
  ProductDetail,
  ProductImage,
  ProductLocationOverride,
  ProductStock,
  LoyaltyPointsConfig,
} from "./product.js"

export {
  supplierSchema,
  supplierCreateSchema,
  supplierUpdateSchema,
} from "./supplier.js"

export type { Supplier } from "./supplier.js"

export {
  customerSchema,
  customerCreateSchema,
  customerUpdateSchema,
  customerTypeSchema,
  customerDetailsSchema,
  customerFinancialSummarySchema,
  customerSiteSchema,
  customerSiteCreateSchema,
  customerSiteUpdateSchema,
  customerSiteManagerSchema,
  customerInvoiceSchema,
  customerPaymentSchema,
  customerCreditNoteSchema,
  customerWarrantyClaimSchema,
  siteStatusSchema,
} from "./customer.js"

export type {
  Customer,
  CustomerDetails,
  CustomerFinancialSummary,
  CustomerSite,
  CustomerInvoice,
  CustomerPayment,
  CustomerCreditNote,
  CustomerWarrantyClaim,
} from "./customer.js"

export { countrySchema } from "./localization.js"

export type { Country } from "./localization.js"

export const planetSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  description: z.string(),
})

export type Planet = z.infer<typeof planetSchema>

const listPlanets = oc
  .route({
    method: "GET",
    path: "/planets",
  })
  .input(
    z.object({
      limit: z.coerce.number().int().min(1).max(100).optional(),
      cursor: z.coerce.number().int().min(0).default(0),
    })
  )
  .output(z.array(planetSchema))

const findPlanet = oc
  .route({ method: "GET", path: "/planets/{id}" })
  .input(
    z.object({
      id: z.coerce.number().int().min(1),
    })
  )
  .output(planetSchema)

const createPlanet = oc
  .route({ method: "POST", path: "/planets" })
  .input(
    z.object({
      name: z.string().min(2),
      description: z.string().optional(),
    })
  )
  .output(planetSchema)

const deletePlanet = oc
  .route({ method: "DELETE", path: "/planets/{id}" })
  .input(z.object({ id: z.coerce.number().int().min(1) }))
  .output(z.object({ success: z.boolean() }))

export const contracts = populateContractRouterPaths({
  planet: {
    list: listPlanets,
    find: findPlanet,
    create: createPlanet,
    delete: deletePlanet,
  },
  galaxy: {
    list: listGalxy,
  },
  organizationStaffUser: {
    create: createOrganizationStaffUser,
    resetPassword: resetOrganizationStaffUserPassword,
    ban: banOrganizationStaffUser,
  },
  organizationSettings: {
    get: getOrganizationSettings,
    update: updateOrganizationSettings,
    updateName: updateOrganizationName,
  },
  teamSettings: {
    get: getTeamSettings,
    update: updateTeamSettings,
  },
  taxConfig: {
    list: listTaxConfigs,
    create: createTaxConfig,
    update: updateTaxConfig,
    delete: deleteTaxConfig,
  },
  serviceCharge: {
    list: listServiceCharges,
    create: createServiceCharge,
    update: updateServiceCharge,
    delete: deleteServiceCharge,
  },
  branchProfile: {
    get: getBranchProfile,
    update: updateBranchProfile,
    updateInfo: updateBranchInfo,
  },
  user: {
    resetPassword: resetUserPassword,
    changeOwnPassword: changeOwnPassword,
  },
  productGroup: {
    list: listProductGroups,
    create: createProductGroup,
    update: updateProductGroup,
    delete: deleteProductGroup,
    listProducts: listGroupProducts,
    addProduct: addGroupProduct,
    removeProduct: removeGroupProduct,
  },
  category: {
    list: listCategories,
    create: createCategory,
    update: updateCategory,
    delete: deleteCategory,
  },
  product: {
    list: listProducts,
    get: getProduct,
    create: createProduct,
    update: updateProduct,
    delete: deleteProduct,
  },
  supplier: {
    list: listSuppliers,
    create: createSupplier,
    update: updateSupplier,
    delete: deleteSupplier,
  },
  customer: {
    list: listCustomers,
    get: getCustomer,
    create: createCustomer,
    update: updateCustomer,
    delete: deleteCustomer,
    listInvoices: listCustomerInvoices,
    listPayments: listCustomerPayments,
    listCreditNotes: listCustomerCreditNotes,
    listWarrantyClaims: listCustomerWarrantyClaims,
    listSites: listCustomerSites,
    createSite: createCustomerSite,
    updateSite: updateCustomerSite,
    deleteSite: deleteCustomerSite,
  },
  countries: {
    list: listCountries,
  },
})
