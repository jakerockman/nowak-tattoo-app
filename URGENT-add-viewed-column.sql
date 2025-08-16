-- URGENT: Add 'viewed' column to bookings table
-- Run this in Supabase SQL Editor NOW to fix the booking tracking

-- 1. Add the viewed column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT FALSE;

-- 2. Update existing bookings as viewed (optional - or leave unviewed to test)
-- Uncomment next line if you want existing bookings to show as already read:
-- UPDATE bookings SET viewed = TRUE WHERE viewed IS NULL;

-- 3. Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'viewed';

-- 4. Test data - check your current bookings
SELECT id, name, status, viewed, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
