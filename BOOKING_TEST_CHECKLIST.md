# 📋 BOOKING SYSTEM TEST CHECKLIST

## **MANUAL TESTING STEPS:**

### **📱 STEP 1: OPEN APP**
- [ ] Scan QR code with Expo Go
- [ ] App loads without errors
- [ ] Home screen displays correctly

### **📝 STEP 2: NAVIGATE TO BOOKING SCREEN**
- [ ] Tap "Book Appointment" or similar button
- [ ] Booking form loads
- [ ] All fields are visible (Name, Email, Phone, Date, Notes)

### **✍️ STEP 3: FILL OUT BOOKING FORM**
**Test Data:**
- Name: `Test Customer`
- Email: `test@example.com`
- Phone: `+1234567890`
- Date: Select tomorrow's date
- Notes: `Test booking from app`

### **✅ STEP 4: SUBMIT BOOKING**
- [ ] Tap Submit button
- [ ] Success message appears
- [ ] Form resets to empty state

### **🔔 STEP 5: TEST REAL-TIME NOTIFICATIONS**
- [ ] Open artist dashboard (if possible)
- [ ] Check if booking count updated
- [ ] Verify new booking appears in list

### **💾 STEP 6: VERIFY DATABASE**
- [ ] Run SQL: `SELECT * FROM bookings ORDER BY created_at DESC LIMIT 3;`
- [ ] Confirm test booking appears in database

## **EXPECTED RESULTS:**
✅ Booking successfully submitted
✅ Real-time notification triggered  
✅ Data appears in database
✅ Artist dashboard shows updated count

## **TROUBLESHOOTING:**
If booking fails:
1. Check Metro bundler console for errors
2. Verify database permissions with: `APP_TEST_DATABASE.sql`
3. Check network connectivity
4. Verify Supabase configuration
