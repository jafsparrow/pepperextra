# BuildMate — Product Taxonomy

> This document clarifies three concepts that sound similar but serve completely different purposes.
> Read this before building any catalog, quotation, or home screen feature.

---

## Quick Reference

| Concept              | Table                                             | Purpose                                              | Who manages              | System logic?                           |
| -------------------- | ------------------------------------------------- | ---------------------------------------------------- | ------------------------ | --------------------------------------- |
| **Product Group**    | `product_groups`                                  | Groups alternative brands of the same specification  | Owner / Location Manager | YES — drives quotation alternatives     |
| **Product Category** | `categories` (org-wide tree)                      | Classifies what type of product it is — broad browse taxonomy (sub → sub-sub) | Owner / Location Manager | YES — classification/browse; station routing stays group-based |
| **Product Tag**      | `product_tags`                                    | Labels products for home screen navigation shortcuts | Location Manager only    | NO — display only                       |

---

## 1. Product Group

### What it is

A spec-based grouping of products that are **direct alternatives to each other**.
All products in the same group have the same specification but come from different brands.

### Real example

```
Product Group: "3/4 inch PVC Pipe"
  ├── Brand A — 3/4" PVC Pipe    (base_price: 1.200 OMR)
  ├── Brand B — 3/4" PVC Pipe    (base_price: 0.950 OMR)
  └── Brand C — 3/4" PVC Pipe    (base_price: 0.800 OMR)
```

### What it drives

- **Alternative pricing on the quotation screen** — when staff adds "3/4 inch PVC Pipe" to a quotation, the system finds all other products in the same group and shows their prices colour-coded
- **"Immediate alternative" button** — swaps all line items to the next brand in the group's `brand_priority` order
- **Stock tracking mode** — each group has `stock_tracking_mode`: `group` (total stock across all brands) or `sku` (stock per individual brand)

### Key fields

```typescript
product_groups {
  id
  org_id
  spec_name        // "3/4 inch PVC Pipe" — the specification, not a brand name
  brand_priority   // ["brand_a", "brand_b", "brand_c"] — ordered array of brand_tag values
  stock_tracking_mode  // "group" | "sku"
  group_reorder_threshold
}
```

### Rules

- One product belongs to **one product group only**
- Brand priority order is set by admin — determines which brand is shown first in quotation alternatives
- Product groups are **tenant-scoped** (`org_id`) — shared across all locations

---

## 2. Product Category (`categories` tree)

### What it is

A broad, org-wide classification of **what type of product** a SKU is — e.g. a supermarket-style
tree: `Plumbing → Pipes → Fittings`, with sub → sub-sub categories supported (unlimited depth).
Categories are **classification/browse only**: they hold no stock, price, brand, or routing logic.

Each product links to a category directly via `products.category_id` (per-SKU classification).

### How it differs from product groups

- **Product group** = equivalent brands of the same specification (`4' PVC pipe` = Brand A/B/C).
- **Category** = a broad label a product hangs under (`Plumbing` → `Pipes`).

A category can contain products from many different product groups (and vice-versa is not
restricted either — classification is per-SKU).

### Why station routing stays on product groups

Fulfilment stations still assign `default_category_ids[]` — an array of **`product_group_id`**
values. When a quotation is confirmed, each line item is routed to a station by matching its
`product_group_id` against station assignments. Categories are for browsing/reports only.

### Real example

```
Fulfilment Station: "Plumbing Counter"
  default_category_ids: [group_id_of_pvc_pipes, group_id_of_ball_valves, group_id_of_fittings]

Fulfilment Station: "Electrical Counter"
  default_category_ids: [group_id_of_cables, group_id_of_sockets, group_id_of_conduits]
```

When a quotation line contains "Brand A 3/4 inch PVC Pipe":

1. System reads its `product_group_id`
2. Matches against station `default_category_ids`
3. Routes the line to "Plumbing Counter"

### Product-level override

An individual product can override its category's station:

```typescript
products {
  station_override_id  // if set, this product always goes to this station
                       // regardless of its product_group's station assignment
}
```

### Rules

- Category classification is per-SKU via `products.category_id` — no stock/price/routing logic.
- Categories are a **tree** (`parent_id`), unlimited depth, org-scoped.
- A category cannot be deleted while it has sub-categories or assigned products.
- Product-level `station_override_id` always takes priority over group-level station assignment.

---

## 3. Product Tag

### What it is

A **display-only label** that a Location Manager creates to group products together for the **home screen navigation**.
Tags have no effect on quotation logic, stock tracking, or fulfilment routing.

### Real example

```
Tags created by manager at "Main Branch":
  🟡 "Wires"         → Cable 2.5mm, Cable 4mm, Cable 6mm, Flex 3-core
  🔵 "Pipes"         → PVC Pipe 1/2", PVC Pipe 3/4", UPVC Pipe 4"
  🟢 "Fast Moving"   → Cement 50kg, Iron Rod 12mm, Nails Box, Paint White 5L
  🔴 "Rarely Sold"   → Manhole Cover, EWC Seat, Water Tank 500L
```

### What it drives

- **Home screen tag buttons** — staff taps a tag to instantly see all products under it with current price and stock
- Designed for volatile/frequently-checked products where searching wastes time

### Key fields

```typescript
product_tags {
  id
  org_id
  team_id          // tags are location-specific — different branches have different tags
  name             // "Wires", "Pipes", "Fast Moving"
  colour           // hex colour for the button e.g. "#F59E0B"
  sort_order       // controls button order on home screen
}

product_tag_assignments {
  tag_id
  product_id       // one product can belong to multiple tags
}
```

### Rules

- Tags are **location-specific** (`team_id`) — the "Wires" tag at Branch A can have different products than "Wires" at Branch B
- Only **Location Managers and Owners** can create, edit, or delete tags
- Staff can only **read** tags — they tap them to browse, cannot modify them
- One product **can appear under multiple tags** — e.g. "Cable 2.5mm" can be under both "Wires" and "Fast Moving"
- Tags are **display-only** — removing a product from a tag does not affect stock, pricing, or quotation logic
- Tags are **not** product groups — a tag called "Pipes" can contain products from different product groups (PVC pipes, UPVC pipes, GI pipes)

---

## How They Work Together — Complete Example

```
Staff at Main Branch opens BuildMate mobile app:

HOME SCREEN
  [Wires] [Pipes] [Fast Moving] [Rarely Sold]   ← Product Tags (MODULE 08)
  📌 Cable 2.5mm  1.250 OMR                     ← Pinned widget (personal)
  📌 Iron Rod 12mm 0.380 OMR

Staff taps [Pipes] tag:
  Shows: PVC 1/2", PVC 3/4", UPVC 4", GI Pipe...  ← from product_tag_assignments

Customer asks for 3/4" PVC pipe:
  Staff opens new quotation, searches "3/4 PVC"
  Adds Brand A 3/4" PVC Pipe to quotation

QUOTATION SCREEN
  Brand A — 3/4" PVC × 10  =  12.000 OMR   (green)   ← from product_group "3/4 inch PVC Pipe"
  Brand B — 3/4" PVC × 10  =   9.500 OMR   (blue)    ← alternatives in same product_group
  Brand C — 3/4" PVC × 10  =   8.000 OMR   (amber)

Customer picks Brand B. Staff confirms.

FULFILMENT DISPATCH
  Product group "3/4 inch PVC Pipe" is assigned to "Plumbing Counter" station
  → Line item routed to Plumbing Counter automatically
  → Plumbing Counter staff sees it on their station screen
```

---

## Common Mistakes to Avoid

| Mistake                                  | Why it's wrong                                                                  | Correct approach                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Using product tags to group alternatives | Tags have no system logic — alternatives won't show on quotation screen         | Use product groups for alternatives                                         |
| Using categories for stock or routing    | Categories are classification-only; stock aggregates on product groups          | Categories: browse only. Use `product_groups` for alternatives, stock + station routing |
| Using categories as product groups       | Categories are broad labels, not spec-level alternatives groups                 | Keep `product_groups` for spec equivalents; categories classify (per-SKU)    |
| Making tags org-wide                     | Tags are location-specific (`team_id`) — different branches need different tags | Always scope tags to `team_id`                                              |
| Putting brand name in `spec_name`        | spec_name is the specification, not the brand                                   | `spec_name` = "3/4 inch PVC Pipe", brand goes in `brand_tag` on the product |
| One product in multiple product groups   | A product has exactly one `product_group_id`                                    | Products can be in multiple **tags** but only one **group**                 |
