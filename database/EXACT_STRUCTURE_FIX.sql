-- EXACT DATABASE STRUCTURE FIX
-- Run this in Supabase SQL Editor

-- 1. DISABLE RLS (the main blocker)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- 2. Grant permissions
GRANT INSERT, SELECT ON bookings TO anon;
GRANT SELECT, UPDATE ON bookings TO authenticated;

-- 3. Test with exact structure
INSERT INTO bookings (name, contact, date, notes, image_url) 
VALUES (
  'Test User', 
  'test@example.com | 1234567890', 
  NOW(), 
  'Test booking from SQL', 
  NULL
);

-- 4. Verify the data
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;

-- After running this, your app should work!
