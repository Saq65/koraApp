import { apiClient } from "./client";

// ✅ REGISTER
export const registerUser = (payload: any) => {
  return apiClient("/auth/register", "POST", payload);
};

// ✅ LOGIN – identifier can be email or mobile
export const loginUser = (payload: { identifier: string; password: string }) => {
  return apiClient("/auth/login", "POST", payload);
};

// ✅ VERIFY EMAIL OTP (after registration)
export const verifyEmail = (email: string, otp: string) => {
  return apiClient("/auth/verify-email", "POST", { email, otp });
};

// ✅ RESEND VERIFICATION OTP (for email verification)
export const resendVerificationOtp = (email: string) => {
  return apiClient("/auth/resend-verification", "POST", { email });
};

// ----------------------------------------------------------------------
// PASSWORD RESET FLOW (uses identifier: email or mobile)
// ----------------------------------------------------------------------

// auth.ts
export const forgotPassword = (email: string) => {
  return apiClient("/auth/forgot-password", "POST", { email });
};

export const verifyResetOtp = (email: string, otp: string) => {
  return apiClient("/auth/verify-reset-otp", "POST", { email, otp });
};

// Step 3: Reset password using the token received from verifyResetOtp
export const resetPassword = (resetToken: string, newPassword: string, confirmPassword: string) => {
  return apiClient("/auth/reset-password", "POST", { resetToken, newPassword, confirmPassword });
};

// Optional: resend reset code (same as forgotPassword)
export const resendResetCode = forgotPassword;