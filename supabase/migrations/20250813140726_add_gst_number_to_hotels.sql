-- Migration: Add GST number to hotels table
-- File name: 20250813120000_add_gst_number_to_hotels.sql

-- Add GST number column to hotels table
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gst_number TEXT;

-- Add a comment to describe the field
COMMENT ON COLUMN hotels.gst_number IS 'GST (Goods and Services Tax) registration number of the hotel';

-- Optional: Add a check constraint for GST number format (Indian GST format: 15 characters)
-- ALTER TABLE hotels ADD CONSTRAINT check_gst_format 
-- CHECK (gst_number IS NULL OR LENGTH(gst_number) = 15);

-- Update existing hotels with specific GST numbers based on their location
-- Nexiv-Hotel (Bangalore, Karnataka) - Karnataka state code is 29
UPDATE hotels 
SET gst_number = '29ABCDE1234F1Z5' 
WHERE id = 'b314e38a-548e-4b71-991f-c0022f5db936' 
  AND name = 'Nexiv-Hotel';

-- ANT-Hotel (Villupuram, Tamil Nadu) - Tamil Nadu state code is 33
UPDATE hotels 
SET gst_number = '33FGHIJ5678G1Z9' 
WHERE id = '6a0e73f6-691e-4adc-a835-81d131ec6fe7' 
  AND name = 'ANT-Hotel';

-- Fallback: Update any remaining hotels without GST numbers with placeholder
UPDATE hotels 
SET gst_number = 'PENDING_GST_UPDATE' 
WHERE gst_number IS NULL;

-- If you want to make GST number required for new hotels (optional)
-- ALTER TABLE hotels ALTER COLUMN gst_number SET NOT NULL;