import { defineRelations } from "drizzle-orm"
import { user, session, account } from "../auth-schema"

export const authRelations = defineRelations(
  { user, session, account },
  (r) => ({
    // Relationships for the 'user' table
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
    },
    // Relationships for the 'session' table
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },
    // Relationships for the 'account' table
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },
  })
)
