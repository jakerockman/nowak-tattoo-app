-- FIX BOOKING DATABASE ISSUES
-- Copy and paste this into Supabase SQL Editor and run it

-- Step 1: Disable RLS on bookings table (it's blocking all inserts)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Step 2: Make sure table has correct structure
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS contact text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;

-- Step 3: Create simple insert policy (enable RLS back with working policy)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bookings (customers need to book)
CREATE POLICY "Anyone can create bookings" ON bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow artists to view all bookings
CREATE POLICY "Artists can view all bookings" ON bookings
    FOR SELECT
    TO authenticated
    USING (true);

-- Step 4: Grant necessary permissions
GRANT INSERT ON bookings TO anon;
GRANT SELECT ON bookings TO authenticated;

-- Test the fix
INSERT INTO bookings (contact, message, created_at) 
VALUES ('test@example.com', 'Test booking - delete this', NOW());

-- If above works, your booking form will work!
