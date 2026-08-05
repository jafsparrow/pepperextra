import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import * as authschema from "@repo/db/auth-schema"
import { admin as adminPlugin, organization } from "better-auth/plugins"
import { expo } from "@better-auth/expo"

import type { OrganizationOptions } from "better-auth/plugins"

import type { DatabaseClient } from "@repo/db"
import {
  ac,
  customAdminRole,
  financeRole,
} from "./admin-access-control/roles.js"
import {
  orgAccessControl,
  owner,
  manager,
  branchManager,
  salesperson,
  cashier,
  stationStaff,
  staff,
  systemRoles,
} from "./org-access-control/org-roles.js"

// Re-export organization hook types for consumers
type OrgHooks = NonNullable<OrganizationOptions["organizationHooks"]>
export type OrganizationHooks = OrgHooks
export type BeforeCreateOrganizationData = Parameters<
  NonNullable<OrgHooks["beforeCreateOrganization"]>
>[0]
export type AfterCreateOrganizationData = Parameters<
  NonNullable<OrgHooks["afterCreateOrganization"]>
>[0]
export type BeforeAddMemberData = Parameters<
  NonNullable<OrgHooks["beforeAddMember"]>
>[0]
export type AfterAddMemberData = Parameters<
  NonNullable<OrgHooks["afterAddMember"]>
>[0]
export type BeforeRemoveMemberData = Parameters<
  NonNullable<OrgHooks["beforeRemoveMember"]>
>[0]
export type AfterRemoveMemberData = Parameters<
  NonNullable<OrgHooks["afterRemoveMember"]>
>[0]
export type BeforeUpdateMemberRoleData = Parameters<
  NonNullable<OrgHooks["beforeUpdateMemberRole"]>
>[0]
export type AfterUpdateMemberRoleData = Parameters<
  NonNullable<OrgHooks["afterUpdateMemberRole"]>
>[0]
export type BeforeCreateInvitationData = Parameters<
  NonNullable<OrgHooks["beforeCreateInvitation"]>
>[0]
export type AfterCreateInvitationData = Parameters<
  NonNullable<OrgHooks["afterCreateInvitation"]>
>[0]
export type BeforeAcceptInvitationData = Parameters<
  NonNullable<OrgHooks["beforeAcceptInvitation"]>
>[0]
export type AfterAcceptInvitationData = Parameters<
  NonNullable<OrgHooks["afterAcceptInvitation"]>
>[0]
export type BeforeRejectInvitationData = Parameters<
  NonNullable<OrgHooks["beforeRejectInvitation"]>
>[0]
export type AfterRejectInvitationData = Parameters<
  NonNullable<OrgHooks["afterRejectInvitation"]>
>[0]
export type BeforeCancelInvitationData = Parameters<
  NonNullable<OrgHooks["beforeCancelInvitation"]>
>[0]
export type AfterCancelInvitationData = Parameters<
  NonNullable<OrgHooks["afterCancelInvitation"]>
>[0]
export type BeforeDeleteOrganizationData = Parameters<
  NonNullable<OrgHooks["beforeDeleteOrganization"]>
>[0]
export type AfterDeleteOrganizationData = Parameters<
  NonNullable<OrgHooks["afterDeleteOrganization"]>
>[0]
export type BeforeUpdateOrganizationData = Parameters<
  NonNullable<OrgHooks["beforeUpdateOrganization"]>
>[0]
export type AfterUpdateOrganizationData = Parameters<
  NonNullable<OrgHooks["afterUpdateOrganization"]>
>[0]
export type BeforeCreateTeamData = Parameters<
  NonNullable<OrgHooks["beforeCreateTeam"]>
>[0]
export type AfterCreateTeamData = Parameters<
  NonNullable<OrgHooks["afterCreateTeam"]>
>[0]
export type BeforeUpdateTeamData = Parameters<
  NonNullable<OrgHooks["beforeUpdateTeam"]>
>[0]
export type AfterUpdateTeamData = Parameters<
  NonNullable<OrgHooks["afterUpdateTeam"]>
>[0]
export type BeforeDeleteTeamData = Parameters<
  NonNullable<OrgHooks["beforeDeleteTeam"]>
>[0]
export type AfterDeleteTeamData = Parameters<
  NonNullable<OrgHooks["afterDeleteTeam"]>
>[0]
export type BeforeAddTeamMemberData = Parameters<
  NonNullable<OrgHooks["beforeAddTeamMember"]>
>[0]
export type AfterAddTeamMemberData = Parameters<
  NonNullable<OrgHooks["afterAddTeamMember"]>
>[0]
export type BeforeRemoveTeamMemberData = Parameters<
  NonNullable<OrgHooks["beforeRemoveTeamMember"]>
>[0]
export type AfterRemoveTeamMemberData = Parameters<
  NonNullable<OrgHooks["afterRemoveTeamMember"]>
>[0]

// NOTE- This is used by external apps who provides the db client
// and want to create an instance of BetterAuth with the provided db client..
//  This is useful for apps that want to use BetterAuth with
// their own database client,
// instead of using the default one provided by BetterAuth. Usually because
// of .env variables provided by the external app.

type TeamHooks = Pick<
  NonNullable<OrganizationOptions["organizationHooks"]>,
  | "beforeCreateTeam"
  | "afterCreateTeam"
  | "beforeUpdateTeam"
  | "afterUpdateTeam"
  | "beforeDeleteTeam"
  | "afterDeleteTeam"
  | "beforeAddTeamMember"
  | "afterAddTeamMember"
  | "beforeRemoveTeamMember"
  | "afterRemoveTeamMember"
>

interface AuthConfigOptions {
  secret: string
  baseUrl: string
  organizationHooks?: NonNullable<OrganizationOptions["organizationHooks"]>
  teamHooks?: Partial<TeamHooks>
  allowUserToCreateOrganization?: NonNullable<
    OrganizationOptions["allowUserToCreateOrganization"]
  >
  sendResetPassword?: NonNullable<
    BetterAuthOptions["emailAndPassword"]
  >["sendResetPassword"]
}

export const createAuthInstance = (
  dbClient: DatabaseClient,
  options: AuthConfigOptions
) => {
  return betterAuth({
    database: drizzleAdapter(dbClient, {
      provider: "pg",
      schema: authschema,
    }),
    secret: options.secret,
    baseURL: options.baseUrl,
    user: {
      additionalFields: {
        //this is for detecting the org owner created users.
        customAccountType: {
          type: ["owner", "staff"],
          required: false,
          defaultValue: "staff",
        },
        passwordResetRequired: {
          type: "boolean",
          required: false,
          defaultValue: true, // true on creation/admin reset
          // input: true so the mobile client can clear the flag via updateUser
          // after a forced password reset (changePassword does not fire
          // onPasswordReset in better-auth 1.6.22).
          input: true,
        },
      },
    },
    plugins: [
      expo(),
      organization({
        maxOrganizationsPerUser: 1,
        ac: orgAccessControl,
        roles: {
          ...systemRoles,
          owner,
          manager,
          branchManager,
          salesperson,
          cashier,
          stationStaff,
          staff,
        },
        teams: { enabled: true },
        allowUserToCreateOrganization: options.allowUserToCreateOrganization,
        organizationHooks: {
          ...options.organizationHooks,
          ...options.teamHooks,
        } as NonNullable<OrganizationOptions["organizationHooks"]>,
      }),
      adminPlugin({
        ac: ac,
        roles: {
          customAdminRole,
          financeRole,
        },
      }),
    ],
    emailAndPassword: {
      enabled: true,
      ...(options.sendResetPassword
        ? { sendResetPassword: options.sendResetPassword }
        : {}),
    },
    trustedOrigins: [
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:8081",
      "mobile://",
      "exp://",
      "exp://**", // Expo Go with different IPs
    ],
  })
}

export type AuthInstance = ReturnType<typeof createAuthInstance>
export type AppUser = AuthInstance["$Infer"]["Session"]["user"]
// export const config = {
//   database: drizzleAdapter(
//     createDatabaseClient(process.env.PEPPER_DATABASE_URL!),
//     { provider: "pg" }
//   ),

//   baseURL: "http://localhost:3000",
//   emailAndPassword: {
//     enabled: true,
//   },
// } satisfies BetterAuthOptions

// export const auth = betterAuth(config)
// export const Session = typeof auth.$Infer.Session

// [note]: after adding the organisation and admin pugic, typescript has issue because of in
// the betterAuth instance generates massively nested, inferred internal types. TypeScript tries to generate a .d.ts type declaration
//  file for your package, but because those internal types (in this case, from zod) aren't directly exported
//  at the top level of the package boundary, TypeScript panics and complains that the type is "not portable."
// [FIX]: Turn off declaration emitting (Best if this package isn't a shared library), maily because we are not build  *.d.ts file to be exported.
// in tsconfig: {
//   "compilerOptions": {
//     "declaration": false,
//     "declarationMap": false
//   }
// }
