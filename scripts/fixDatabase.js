// RLS FIX SCRIPT - Run this once to fix the database
// Usage: node scripts/fixDatabase.js

const { createClient } = require('@supabase/supabase-js');

async function fixRLS() {
  console.log('🔧 FIXING DATABASE RLS ISSUE...');
  
  // Try different approaches to fix RLS
  
  // Approach 1: Use anon client to check current state
  const anonClient = createClient(
    'https://trbfaozlvwykygnrxaxy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmZhb3psdnd5a3lnbnJ4YXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzIxMDMsImV4cCI6MjA3MDM0ODEwM30.yoocL7YVlTYpIiH_T9HYMspVU8pBAG6x7yJSFPgLKDU'
  );
  
  console.log('Testing current RLS state...');
  
  const { data: testInsert, error: testError } = await anonClient
    .from('bookings')
    .insert([{
      name: 'RLS Test',
      contact: 'test@rlstest.com | 123456789',
      date: new Date().toISOString(),
      notes: 'Testing RLS',
      image_url: null
    }])
    .select();
    
  if (testError) {
    if (testError.code === '42501') {
      console.log('❌ CONFIRMED: RLS is blocking inserts');
      console.log('📋 MANUAL FIX REQUIRED:');
      console.log('');
      console.log('1. Go to: https://supabase.com/dashboard/project/trbfaozlvwykygnrxaxy');
      console.log('2. Click "SQL Editor" in the left sidebar');
      console.log('3. Click "New Query"');
      console.log('4. Paste this SQL and click "Run":');
      console.log('');
      console.log('-- Fix RLS blocking issue');
      console.log('ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;');
      console.log('GRANT INSERT, SELECT ON bookings TO anon;');
      console.log('GRANT SELECT, UPDATE ON bookings TO authenticated;');
      console.log('');
      console.log('5. After running, test your app again');
      console.log('');
      console.log('🎯 THIS IS THE ONLY WAY TO FIX IT - RLS requires admin privileges');
    } else {
      console.log('❌ Different error:', testError.message);
    }
  } else {
    console.log('✅ SUCCESS: RLS is already fixed!');
    console.log('Test booking created:', testInsert[0]);
    
    // Clean up test data
    await anonClient.from('bookings').delete().eq('name', 'RLS Test');
    console.log('Test data cleaned up');
  }
}

fixRLS().catch(console.error);
