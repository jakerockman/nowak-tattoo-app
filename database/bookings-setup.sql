-- Bookings System Database Schema
-- Run this in your Supabase SQL editor after setting up the chat tables

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
-- Allow anyone to create bookings (for public booking form)
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Only authenticated artists can view all bookings
CREATE POLICY "Artists can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'artist'
    )
  );

-- Artists can update booking status
CREATE POLICY "Artists can update bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'artist'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for booking images (run this in the SQL editor)
-- Note: This needs to be run as a separate statement due to storage permissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-images', 'booking-images', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for booking images
-- Allow anyone to upload booking images
CREATE POLICY "Anyone can upload booking images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'booking-images');

-- Only artists can view booking images
CREATE POLICY "Artists can view booking images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'booking-images' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'artist'
    )
  );

-- Artists can delete booking images
CREATE POLICY "Artists can delete booking images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'booking-images' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'artist'
    )
  );

-- Enable realtime for bookings table
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
