const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://trbfaozlvwykygnrxaxy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmZhb3psdnd5a3lnbnJ4YXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzIxMDMsImV4cCI6MjA3MDM0ODEwM30.yoocL7YVlTYpIiH_T9HYMspVU8pBAG6x7yJSFPgLKDU'
);

async function addStatusColumn() {
  console.log('🔧 Adding status column to bookings table...');
  
  try {
    // First check if column exists
    const { data: testData, error: testError } = await supabase
      .from('bookings')
      .select('status')
      .limit(1);
    
    if (testError && testError.message.includes('status')) {
      console.log('❌ Column missing, need to add it manually');
      console.log('');
      console.log('🚨 MANUAL FIX REQUIRED:');
      console.log('1. Go to: https://supabase.com/dashboard');
      console.log('2. Click your project');
      console.log('3. Click "SQL Editor"');
      console.log('4. Copy and paste this:');
      console.log('   ALTER TABLE bookings ADD COLUMN status VARCHAR(20) DEFAULT NULL;');
      console.log('5. Click "Run"');
      console.log('');
      console.log('✅ Then your Mark as Handled will work!');
    } else {
      console.log('✅ Status column already exists!');
      console.log('✅ Mark as Handled should work now!');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('');
    console.log('🚨 MANUAL FIX REQUIRED:');
    console.log('Go to Supabase dashboard and add the status column');
  }
}

addStatusColumn();
