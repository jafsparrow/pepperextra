-- Catalog version bump trigger (Mobile Sync)
--
-- Bumps org_catalog_versions ONCE per write transaction that touches any
-- delta-synced catalog table. Dedup is done with a transaction-local GUC flag,
-- so a bulk CSV import wrapped in one transaction = +1, not +N.
--
-- Stock is intentionally NOT wired to this trigger (independent sync stream).
--
-- Apply with:  psql "$PEPPER_DATABASE_URL" -f custom/001_catalog_version_trigger.sql

CREATE OR REPLACE FUNCTION bump_catalog_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  _org_id text;
BEGIN
  IF TG_TABLE_NAME = 'product_tag_assignments' THEN
    -- Join table without org_id — resolve via the owning tag.
    SELECT org_id INTO _org_id FROM product_tags
      WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.tag_id ELSE NEW.tag_id END;
  ELSE
    _org_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.org_id ELSE NEW.org_id END;
  END IF;

  IF _org_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Once-per-transaction dedup (transaction-local GUC).
  IF current_setting('app.catalog_bumped', true) = 'true' THEN
    RETURN NULL;
  END IF;

  PERFORM set_config('app.catalog_bumped', 'true', true);

  INSERT INTO org_catalog_versions (org_id, version, last_changed_at)
  VALUES (_org_id, 1, now())
  ON CONFLICT (org_id) DO UPDATE
    SET version = org_catalog_versions.version + 1,
        last_changed_at = now();

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_catalog_version_products
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();

CREATE TRIGGER trg_catalog_version_product_groups
AFTER INSERT OR UPDATE OR DELETE ON product_groups
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();

CREATE TRIGGER trg_catalog_version_categories
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();

CREATE TRIGGER trg_catalog_version_product_images
AFTER INSERT OR UPDATE OR DELETE ON product_images
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();

CREATE TRIGGER trg_catalog_version_product_alternatives
AFTER INSERT OR UPDATE OR DELETE ON product_alternatives
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();

CREATE TRIGGER trg_catalog_version_product_tags
AFTER INSERT OR UPDATE OR DELETE ON product_tags
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();

CREATE TRIGGER trg_catalog_version_product_tag_assignments
AFTER INSERT OR UPDATE OR DELETE ON product_tag_assignments
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();

CREATE TRIGGER trg_catalog_version_price_lists
AFTER INSERT OR UPDATE OR DELETE ON price_lists
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();

CREATE TRIGGER trg_catalog_version_price_list_overrides
AFTER INSERT OR UPDATE OR DELETE ON price_list_overrides
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();

CREATE TRIGGER trg_catalog_version_product_location_overrides
AFTER INSERT OR UPDATE OR DELETE ON product_location_overrides
FOR EACH ROW EXECUTE FUNCTION bump_catalog_version();
