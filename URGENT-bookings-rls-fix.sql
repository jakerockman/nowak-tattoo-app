-- URGENT: Fix bookings table RLS for guest users
-- This allows anyone to insert bookings (customer booking enquiries)

-- Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to INSERT bookings (guest customer bookings)
CREATE POLICY "Anyone can insert bookings" ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Only authenticated artists can SELECT/UPDATE/DELETE bookings  
CREATE POLICY "Artists can manage bookings" ON bookings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 3: Allow anonymous users to insert bookings (for guest bookings)
CREATE POLICY "Public booking submission" ON bookings
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Test the fix
INSERT INTO bookings (name, contact, date, notes) 
VALUES ('Test Fix', 'test@fix.com | 1234567890', NOW(), 'Testing RLS fix');

-- Verify policies
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'bookings';
