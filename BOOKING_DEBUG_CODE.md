// BOOKING NOTIFICATION DEBUG TEST
// Add this to your BookingScreen.tsx temporarily to debug

// ADD THIS RIGHT AFTER THE SUCCESSFUL BOOKING INSERT:

console.log('=== BOOKING NOTIFICATION DEBUG ===');
console.log('✅ Booking inserted successfully');
console.log('🔄 About to call refreshData()...');

try {
  await refreshData();
  console.log('✅ refreshData() completed successfully');
} catch (refreshError) {
  console.error('❌ refreshData() failed:', refreshError);
}

console.log('🔔 Booking notification should now appear on artist dashboard');
console.log('=== END DEBUG ===');

// ALSO ADD THIS TO TEST DATABASE CONNECTIVITY:
// Before the insert, add this test:

console.log('🧪 Testing database connectivity...');
const { data: testData, error: testError } = await supabase
  .from('bookings')
  .select('count', { count: 'exact' });

if (testError) {
  console.error('❌ Database test failed:', testError);
} else {
  console.log('✅ Database test passed, current booking count:', testData);
}

// This will help us see if:
// 1. The insert is actually working
// 2. The refreshData is being called
// 3. The database is accessible
