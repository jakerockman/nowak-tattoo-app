describe('Booking validation logic', () => {
  function validateBooking(name: string, email: string, phone: string) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValidEmail = emailRegex.test(email.trim());
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const isValidPhone = cleanPhone.length >= 8 && cleanPhone.length <= 15;
    return {
      name: !name.trim(),
      email: !email.trim() || !isValidEmail,
      phone: !phone.trim() || !isValidPhone,
    };
  }

  it('should fail validation if name is empty', () => {
    const errors = validateBooking('', 'test@email.com', '12345678');
    expect(errors.name).toBe(true);
  });

  it('should fail validation if email is invalid', () => {
    const errors = validateBooking('Test', 'invalid-email', '12345678');
    expect(errors.email).toBe(true);
  });

  it('should fail validation if phone is too short', () => {
    const errors = validateBooking('Test', 'test@email.com', '123');
    expect(errors.phone).toBe(true);
  });

  it('should pass validation for valid input', () => {
    const errors = validateBooking('Test', 'test@email.com', '123456789');
    expect(errors.name).toBe(false);
    expect(errors.email).toBe(false);
    expect(errors.phone).toBe(false);
  });
});
