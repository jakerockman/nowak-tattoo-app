// VERIFICATION SCRIPT - Run this after fixing RLS to confirm everything works
// Usage: node scripts/verifyFix.js

const { createClient } = require('@supabase/supabase-js');

async function verifyFix() {
  console.log('🔍 VERIFYING DATABASE FIX...');
  
  const supabase = createClient(
    'https://trbfaozlvwykygnrxaxy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmZhb3psdnd5a3lnbnJ4YXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzIxMDMsImV4cCI6MjA3MDM0ODEwM30.yoocL7YVlTYpIiH_T9HYMspVU8pBAG6x7yJSFPgLKDU'
  );
  
  let allTestsPassed = true;
  
  // Test 1: Insert booking (exact structure your app uses)
  console.log('\\n📝 Test 1: Booking Insert');
  const { data: insertData, error: insertError } = await supabase
    .from('bookings')
    .insert([{
      name: 'Verification Test',
      contact: 'verify@test.com | 9876543210',
      date: new Date().toISOString(),
      notes: 'Verification test booking',
      image_url: null
    }])
    .select();
    
  if (insertError) {
    console.log('❌ FAILED:', insertError.message);
    allTestsPassed = false;
  } else {
    console.log('✅ SUCCESS: Booking inserted with ID', insertData[0].id);
  }
  
  // Test 2: Fetch bookings (what your dashboard does)
  console.log('\\n📊 Test 2: Fetch Bookings');
  const { data: fetchData, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (fetchError) {
    console.log('❌ FAILED:', fetchError.message);
    allTestsPassed = false;
  } else {
    console.log('✅ SUCCESS:', fetchData.length, 'bookings found');
    if (fetchData.length > 0) {
      console.log('Sample booking:', {
        id: fetchData[0].id,
        name: fetchData[0].name,
        contact: fetchData[0].contact,
        date: fetchData[0].date
      });
    }
  }
  
  // Test 3: Count messages (what your message counter does)
  console.log('\\n💬 Test 3: Message Count');
  const { count, error: countError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
    .eq('sender_type', 'user');
    
  if (countError) {
    console.log('❌ FAILED:', countError.message);
    allTestsPassed = false;
  } else {
    console.log('✅ SUCCESS: Found', count || 0, 'unread messages');
  }
  
  // Clean up test data
  if (insertData && insertData[0]) {
    await supabase.from('bookings').delete().eq('id', insertData[0].id);
    console.log('\\n🧹 Test data cleaned up');
  }
  
  // Final result
  console.log('\\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Your app should work perfectly now.');
    console.log('✅ Bookings can be inserted');
    console.log('✅ Bookings can be fetched');
    console.log('✅ Messages can be counted');
    console.log('\\n🚀 Go test your app - everything should work!');
  } else {
    console.log('❌ SOME TESTS FAILED - check the errors above');
    console.log('💡 Make sure you ran the SQL fix in Supabase dashboard');
  }
  console.log('='.repeat(50));
}

verifyFix().catch(console.error);
