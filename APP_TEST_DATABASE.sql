-- DATABASE CONNECTION TEST
-- Run this in Supabase SQL Editor to verify all systems

-- Test 1: Bookings table access
SELECT COUNT(*) as booking_count FROM bookings;

-- Test 2: Messages table access  
SELECT COUNT(*) as message_count FROM messages;

-- Test 3: RLS status check
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('bookings', 'messages');

-- Test 4: Anonymous permissions check
SELECT 
    grantee, 
    privilege_type, 
    table_name 
FROM information_schema.role_table_grants 
WHERE table_name IN ('bookings', 'messages') 
AND grantee = 'anon';

-- Test 5: Insert a test booking (should work)
INSERT INTO bookings (name, contact, date, notes, status) 
VALUES ('APP TEST', 'app-test@example.com | +1234567890', NOW(), 'Automated app test', 'pending');

-- Test 6: Verify the test booking was inserted
SELECT id, name, contact, created_at, status 
FROM bookings 
WHERE name = 'APP TEST' 
ORDER BY created_at DESC 
LIMIT 1;

SELECT 'ALL DATABASE TESTS COMPLETE' as status;
