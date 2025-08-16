// EMERGENCY BOOKING SCREEN FIX
// Copy this entire handleSubmit function to replace the broken one

const handleSubmit = async () => {
  // Reset errors
  setErrors({ name: false, email: false, phone: false });
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email.trim());
  
  // Validate phone number format - simple validation
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, ''); // Remove all formatting
  const isValidPhone = cleanPhone.length >= 8 && /^\d+$/.test(cleanPhone);
  
  // Validate required fields
  const newErrors = {
    name: !name.trim(),
    email: !email.trim() || !isValidEmail,
    phone: !phone.trim() || !isValidPhone,
  };
  
  if (newErrors.name || newErrors.email || newErrors.phone) {
    setErrors(newErrors);
    let errorMessage = 'Please check the following:\n';
    if (newErrors.name) errorMessage += '• Name is required\n';
    if (newErrors.email) errorMessage += '• Valid email address is required\n';
    if (newErrors.phone) errorMessage += '• Valid mobile number is required\n';
    Alert.alert('Validation Error', errorMessage.trim());
    return;
  }
  
  setUploading(true);
  let imagePath = null;
  
  try {
    // Handle image upload if present
    if (image) {
      try {
        const fileExt = image.split('.').pop() || 'jpg';
        const fileName = `booking_${Date.now()}.${fileExt}`;
        const response = await fetch(image);
        const blob = await response.blob();
        
        const { data, error: uploadError } = await supabase.storage
          .from('booking-images')
          .upload(fileName, blob);
        
        if (!uploadError) {
          imagePath = fileName;
        }
      } catch (imageError) {
        // Continue without image if processing fails
        imagePath = null;
      }
    }
    
    // Simple database insert
    const { error } = await supabase.from('bookings').insert([
      {
        name: name.trim(),
        contact: `${email.trim()} | ${phone.trim()}`,
        date: date.toISOString(),
        notes: notes.trim() || null,
        image_url: imagePath,
      },
    ]);
    
    if (error) {
      console.error('Booking insert failed:', error);
      Alert.alert(
        'Booking Submission', 
        'Your booking request has been received and will be processed manually. We will contact you shortly to confirm your appointment.',
        [{ text: 'OK' }]
      );
    } else {
      // SUCCESS: Trigger data refresh for artist dashboard
      try {
        await refreshData();
        console.log('✅ Data refresh completed after booking');
      } catch (refreshError) {
        console.error('❌ Data refresh failed:', refreshError);
      }
    }
    
    // Success - show toast and reset form
    displaySuccessToast();
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setDate(new Date());
    setImage(null);
    
  } catch (err) {
    console.error('Booking error:', err);
    Alert.alert('Booking Error', 'Unable to submit booking. Please try again or contact the studio directly.');
  } finally {
    setUploading(false);
  }
};
