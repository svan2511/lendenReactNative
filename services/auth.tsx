import { apiRequest } from './api';

export const registerUser = (payload: {
  name: string;
  phone: string;
}) => {
  return apiRequest('/register', {
    method: 'POST',
    body: payload,
  });
};


export const loginUser = (payload: {
  phone: string;
}) => {
  return apiRequest('/login', {
    method: 'POST',
    body: payload,
  });
};


/* ---------------- VERIFY OTP ---------------- */
export const verifyOtp = (payload: {
  phone: string;
  otp: string;
}) => {
  return apiRequest('/otp/verify', {
    method: 'POST',
    body: payload,
  });
};