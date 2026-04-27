import { apiClient } from "./client";

// ✅ REGISTER
export const registerUser = (payload: any) => {
  return apiClient("/auth/register", "POST", payload);
};

// ✅ LOGIN
export const loginUser = (payload: any) => {
  return apiClient("/auth/login", "POST", payload);
};

// ✅ SEND OTP (login)
export const sendOtp = (mobile: string) => {
  return apiClient("/auth/send-otp", "POST", { mobile });
};

// ✅ VERIFY OTP (login)
export const verifyOtp = (mobile: string, otp: string) => {
  return apiClient("/auth/verify-otp", "POST", { mobile, otp });
};

// ----------------------------------------------------------------------
// PASSWORD RESET FLOW
// ----------------------------------------------------------------------

// Step 1: Request reset code (forgot password)
export const forgotPassword = (mobile: string) => {
  return apiClient("/auth/forgot-password", "POST", { mobile });
};

// Step 2: Verify reset code (OTP)
export const verifyResetOtp = (mobile: string, otp: string) => {
  return apiClient("/auth/verify-reset-otp", "POST", { mobile, otp });
};

// Step 3: Reset password using the token received from verifyResetOtp
export const resetPassword = (resetToken: string, newPassword: string, confirmPassword: string) => {
  return apiClient("/auth/reset-password", "POST", { resetToken, newPassword, confirmPassword });
};

// Optional: resend reset code (same as forgotPassword)
export const resendResetCode = forgotPassword;