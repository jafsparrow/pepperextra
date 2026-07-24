export const BRANCH_QUERY_KEYS = {
  all: ["branches"] as const,
  lists: () => [...BRANCH_QUERY_KEYS.all, "list"] as const,
  list: (orgId: string | undefined) => [...BRANCH_QUERY_KEYS.lists(), orgId] as const,
}
