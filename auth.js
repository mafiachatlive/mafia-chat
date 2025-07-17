// js/auth.js

import { supabase } from './supabase.js'

// Send OTP to phone
export async function sendOTP(phoneNumber) {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
  })
  if (error) {
    alert('OTP send failed: ' + error.message)
  } else {
    alert('OTP sent successfully!')
  }
}

// Verify OTP
export async function verifyOTP(phoneNumber, otp) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: otp,
    type: 'sms',
  })

  if (error) {
    alert('Verification failed: ' + error.message)
  } else {
    alert('Verification success!')
    window.location.href = 'dashboard.html'
  }
}
