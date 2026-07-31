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
} from "./product-group.js"
import {
  listProducts,
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
} from "./customer.js"

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

export type {
  TeamSettings,
  TaxConfig,
  ServiceCharge,
} from "./team-settings.js"

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
  productSchema,
  productCreateSchema,
  productUpdateSchema,
} from "./product.js"

export type { Product } from "./product.js"

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
} from "./customer.js"

export type { Customer } from "./customer.js"

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
  },
  product: {
    list: listProducts,
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
    create: createCustomer,
    update: updateCustomer,
    delete: deleteCustomer,
  },
})
