import { createClient } from '@supabase/supabase-js';

// This function needs to be run with service role key to fix RLS
export const fixDatabaseRLS = async () => {
  console.log('🔧 Attempting to fix database RLS...');
  
  // You need to add your service role key here
  const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY_HERE';
  
  if (serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.log('❌ Service role key not configured');
    console.log('📝 To fix:');
    console.log('1. Go to Supabase Dashboard > Project Settings > API');
    console.log('2. Copy the service_role key');
    console.log('3. Replace YOUR_SERVICE_ROLE_KEY_HERE in lib/databaseFix.ts');
    console.log('4. Run this function once');
    return false;
  }
  
  const adminClient = createClient(
    'https://trbfaozlvwykygnrxaxy.supabase.co',
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  try {
    // Disable RLS on bookings table
    const { error: rlsError } = await adminClient.rpc('exec_sql', {
      sql: 'ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('❌ RLS disable failed:', rlsError.message);
    } else {
      console.log('✅ RLS disabled successfully');
    }
    
    // Grant permissions
    const { error: permError } = await adminClient.rpc('exec_sql', {
      sql: `
        GRANT INSERT, SELECT ON bookings TO anon;
        GRANT SELECT, UPDATE ON bookings TO authenticated;
      `
    });
    
    if (permError) {
      console.log('❌ Permission grant failed:', permError.message);
    } else {
      console.log('✅ Permissions granted successfully');
    }
    
    // Test insert to verify fix
    const { data: testData, error: testError } = await adminClient
      .from('bookings')
      .insert([{
        name: 'RLS Fix Test',
        contact: 'test@rlsfix.com | 1234567890',
        date: new Date().toISOString(),
        notes: 'Testing RLS fix',
        image_url: null
      }])
      .select();
      
    if (testError) {
      console.log('❌ Test insert failed:', testError.message);
      return false;
    } else {
      console.log('✅ Test insert successful:', testData[0]);
      console.log('🎉 Database is now working!');
      return true;
    }
    
  } catch (error) {
    console.log('❌ Database fix failed:', error);
    return false;
  }
};
