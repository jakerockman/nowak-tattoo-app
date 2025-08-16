-- Add status column to bookings table
-- This allows tracking booking states: null/pending, handled, confirmed, completed, cancelled

-- Add the status column
ALTER TABLE bookings 
ADD COLUMN status VARCHAR(20) DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN bookings.status IS 'Booking status: null=new/pending, handled=artist reviewed, confirmed=scheduled, completed=finished, cancelled=cancelled';

-- Create an index for better query performance
CREATE INDEX idx_bookings_status ON bookings(status);

-- Optional: Add a check constraint to ensure valid status values
ALTER TABLE bookings 
ADD CONSTRAINT check_booking_status 
CHECK (status IS NULL OR status IN ('pending', 'handled', 'confirmed', 'completed', 'cancelled'));

-- Test query to verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'status';
