-- QUICK BOOKING NOTIFICATIONS FIX
-- Copy and paste this into Supabase SQL Editor

-- Disable RLS to allow anonymous bookings
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT INSERT ON bookings TO anon;
GRANT SELECT ON bookings TO authenticated;

-- Test booking
INSERT INTO bookings (name, contact, date, notes) 
VALUES ('TEST', 'test@example.com | +1234567890', NOW(), 'DELETE THIS');

-- Check if it worked
SELECT COUNT(*) FROM bookings;

-- This should fix your booking notifications immediately
