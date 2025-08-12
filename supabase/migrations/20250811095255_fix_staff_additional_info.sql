-- Add additional_info column to staff table if it doesn't exist
ALTER TABLE staff ADD COLUMN IF NOT EXISTS additional_info JSONB DEFAULT '{}'::jsonb;

-- Update any existing staff records to have empty additional_info if null
UPDATE staff SET additional_info = '{}'::jsonb WHERE additional_info IS NULL;