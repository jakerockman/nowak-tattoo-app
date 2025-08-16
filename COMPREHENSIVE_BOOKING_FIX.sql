-- COMPREHENSIVE BOOKING NOTIFICATIONS FIX
-- Run this in Supabase SQL Editor to fix booking notifications

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Step 2: Ensure proper table structure
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending'
);

-- Step 3: Disable RLS temporarily to allow bookings
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Step 4: Grant permissions to anonymous users (needed for booking form)
GRANT INSERT ON bookings TO anon;
GRANT SELECT ON bookings TO authenticated;
GRANT SELECT ON bookings TO anon;

-- Step 5: Test the fix with a sample booking
INSERT INTO bookings (name, contact, date, notes) 
VALUES ('Test Customer', 'test@example.com | +1234567890', NOW() + interval '7 days', 'Test booking - please delete');

-- Step 6: Verify the insert worked
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 3;

-- Step 7: Re-enable RLS with proper policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert bookings (customers booking)
CREATE POLICY "Allow anonymous booking inserts" ON bookings
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow authenticated users to view all bookings (artists)
CREATE POLICY "Allow authenticated to view bookings" ON bookings
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow anonymous users to insert (needed for customer bookings)
CREATE POLICY "Allow booking submissions" ON bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Final test
INSERT INTO bookings (name, contact, date, notes) 
VALUES ('Test Customer 2', 'test2@example.com | +1234567890', NOW() + interval '14 days', 'Second test booking - please delete');

SELECT 'SUCCESS: Bookings table is ready!' as status;
