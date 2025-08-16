-- SIMPLE FIX: Enable real-time notifications for bookings
-- Run this in your Supabase SQL editor

-- 1. Make sure the bookings table is in the real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- 2. Disable RLS temporarily to test
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- 3. Test insert (this should trigger real-time)
INSERT INTO bookings (name, contact, date, notes, status) 
VALUES ('REALTIME FIX TEST', 'test@fix.com | 555-0000', NOW(), 'Testing real-time fix', 'pending');

-- Check if it worked
SELECT COUNT(*) as total_bookings FROM bookings;
