import { apiClient } from "./client";

// ✅ REGISTER
export const registerUser = (payload: any) => {
  return apiClient("/auth/register", "POST", payload);
};

// ✅ LOGIN
export const loginUser = (payload: any) => {
  return apiClient("/auth/login", "POST", payload);
};


// ✅ SEND OTP
export const sendOtp = (mobile: string) => {
  return apiClient("/auth/send-otp", "POST", {
    mobile,
  });
};

// ✅ VERIFY OTP
export const verifyOtp = (mobile: string, otp: string) => {
  return apiClient("/auth/verify-otp", "POST", {
    mobile,
    otp,
  });
};