# Database Setup Instructions

The booking form error is likely due to missing database tables. Follow these steps to set up the database properly:

## 1. Set Up Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your existing project: `trbfaozlvwykygnrxaxy`

## 2. Create Bookings Table
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `database/bookings-setup.sql`
3. Click **Run** to execute the SQL

## 3. Set Up Storage Bucket
1. Go to **Storage** in the Supabase dashboard
2. Create a new bucket called `booking-images`
3. Set it as **Private** (not public)
4. The SQL script should have set up the policies automatically

## 4. Verify Setup
1. Go to **Table Editor** and verify the `bookings` table exists
2. Go to **Storage** and verify the `booking-images` bucket exists
3. Test the booking form in the app

## Common Issues

### Error: "relation 'public.bookings' does not exist"
- The bookings table hasn't been created
- Run the SQL script in `database/bookings-setup.sql`

### Error: "permission denied for table bookings"
- Row Level Security policies aren't set up correctly
- Re-run the SQL script to ensure policies are created

### Error: "bucket not found"
- The `booking-images` storage bucket doesn't exist
- Create it manually in Storage or run the bucket creation part of the SQL script

### Network/Connection Errors
- Check internet connection
- Verify Supabase project is active and not paused

## Test the Setup
After running the SQL script, test the booking form with:
- Name: Test User
- Email: test@example.com  
- Phone: 555-0123
- Pick any future date/time
- Optional: Add test notes and image

If the form submits successfully and shows the green success toast, the setup is working correctly.
