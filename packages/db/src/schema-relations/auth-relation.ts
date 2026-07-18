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

export const authRelations = defineRelations(
  {
    user,
    session,
    account,
    organization,
    member,
    invitation,
    team,
    teamMember,
  },
  (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      teamMembers: r.many.teamMember(),
      members: r.many.member(),
      invitations: r.many.invitation(),
    },
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },
    organization: {
      teams: r.many.team(),
      members: r.many.member(),
      invitations: r.many.invitation(),
    },
    team: {
      organization: r.one.organization({
        from: r.team.organizationId,
        to: r.organization.id,
      }),
      teamMembers: r.many.teamMember(),
    },
    teamMember: {
      team: r.one.team({
        from: r.teamMember.teamId,
        to: r.team.id,
      }),
      user: r.one.user({
        from: r.teamMember.userId,
        to: r.user.id,
      }),
    },
    member: {
      organization: r.one.organization({
        from: r.member.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({
        from: r.member.userId,
        to: r.user.id,
      }),
    },
    invitation: {
      organization: r.one.organization({
        from: r.invitation.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({
        from: r.invitation.inviterId,
        to: r.user.id,
      }),
    },
  })
)
