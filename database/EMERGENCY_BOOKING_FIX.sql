-- EMERGENCY FIX FOR BOOKINGS DATABASE
-- Go to Supabase Dashboard > SQL Editor and run this:

-- 1. DISABLE RLS COMPLETELY (temporary fix)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- 2. Make sure table structure is correct
-- Check what columns exist:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings';

-- 3. If missing columns, add them:
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS contact text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 4. Grant permissions to anonymous users (for booking form)
GRANT INSERT, SELECT ON bookings TO anon;
GRANT SELECT ON bookings TO authenticated;

-- 5. Test with this insert:
INSERT INTO bookings (name, contact, date, notes) 
VALUES ('Test Booking', 'test@example.com | 1234567890', NOW(), 'Test from SQL');

-- If this works, your app will work!
-- You can re-enable RLS later with proper policies.
