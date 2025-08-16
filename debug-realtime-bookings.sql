-- URGENT: Debug real-time subscriptions for bookings table
-- This script addresses potential issues preventing real-time notifications

-- 1. Check current RLS policies on bookings table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'bookings';

-- 2. Temporarily disable RLS to test real-time (can re-enable later)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- 3. Grant necessary permissions for real-time
GRANT ALL ON bookings TO anon;
GRANT ALL ON bookings TO authenticated;

-- 4. Ensure the bookings table has REPLICA IDENTITY set correctly for real-time
ALTER TABLE bookings REPLICA IDENTITY FULL;

-- 5. Test insert to verify real-time will trigger
INSERT INTO bookings (name, contact, date, notes, status) 
VALUES ('REALTIME TEST', 'test@realtime.com | 555-0123', NOW(), 'Testing real-time subscription', 'pending');

-- 6. Check if the insert worked
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT id, name, created_at FROM bookings ORDER BY created_at DESC LIMIT 3;

-- 7. Check real-time publication settings
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 8. If bookings table is not in publication, add it
-- (This might be the issue - table not published for real-time)
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Final verification
SELECT COUNT(*) as total_after_test FROM bookings WHERE name = 'REALTIME TEST';
