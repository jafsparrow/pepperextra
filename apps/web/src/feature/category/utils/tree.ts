import type { Category } from "@repo/contracts"

export interface CategoryNode extends Category {
  children: CategoryNode[]
}

export interface FlattenedCategory {
  id: string
  name: string
  depth: number
}

const byOrder = (a: CategoryNode, b: CategoryNode) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  for (const c of categories) {
    map.set(c.id, { ...c, children: [] })
  }

  const roots: CategoryNode[] = []
  for (const c of categories) {
    const node = map.get(c.id)!
    const parent = c.parentId ? map.get(c.parentId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sort = (nodes: CategoryNode[]) => {
    nodes.sort(byOrder)
    for (const n of nodes) sort(n.children)
  }
  sort(roots)
  return roots
}

export function flattenCategoryTree(
  nodes: CategoryNode[]
): FlattenedCategory[] {
  const out: FlattenedCategory[] = []
  const walk = (list: CategoryNode[], depth: number) => {
    for (const n of list) {
      out.push({ id: n.id, name: n.name, depth })
      walk(n.children, depth + 1)
    }
  }
  walk(nodes, 0)
  return out
}

export function collectDescendantIds(node: CategoryNode): string[] {
  return node.children.flatMap((child) => [
    child.id,
    ...collectDescendantIds(child),
  ])
}
