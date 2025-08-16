-- Add 'viewed' field to bookings table to track which bookings the artist has seen
ALTER TABLE bookings ADD COLUMN viewed BOOLEAN DEFAULT FALSE;

-- Mark all existing bookings as viewed (optional - or you can leave them unviewed)
-- UPDATE bookings SET viewed = TRUE;

-- Test: Insert a new booking (will be unviewed by default)
INSERT INTO bookings (name, contact, date, notes, status, viewed) 
VALUES ('Test Unviewed', 'test@unviewed.com | 555-0000', NOW(), 'Testing viewed field', 'pending', FALSE);

-- Check the data
SELECT id, name, viewed, created_at FROM bookings ORDER BY created_at DESC LIMIT 5;
