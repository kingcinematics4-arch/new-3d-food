-- Custom Theme Configuration
-- Stores complete custom theme JSON per hotel

ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS custom_theme_config JSONB DEFAULT NULL;

-- Index for potential queries on theme mode
CREATE INDEX IF NOT EXISTS idx_hotels_menu_theme ON hotels(menu_theme);

COMMENT ON COLUMN hotels.custom_theme_config IS 'Complete custom theme configuration including global settings, category overrides, and card overrides';