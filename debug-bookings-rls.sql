-- Check current bookings table RLS policies
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

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  relowner
FROM pg_tables 
WHERE tablename = 'bookings';

-- Test direct insert as anon user
INSERT INTO bookings (name, contact, date, notes) 
VALUES ('Test User', 'test@example.com | 1234567890', NOW(), 'Test booking from debug');
