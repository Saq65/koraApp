import { apiClient } from "./client";

// ✅ REGISTER
export const registerUser = (payload: any) => {
  return apiClient("/auth/register", "POST", payload);
};

// ✅ LOGIN – identifier can be email or mobile
export const loginUser = (payload: { identifier: string; password: string }) => {
  return apiClient("/auth/login", "POST", payload);
};

// ----------------------------------------------------------------------
// PASSWORD RESET FLOW (uses identifier: email or mobile)
// ----------------------------------------------------------------------

// Step 1: Request reset code (forgot password)
export const forgotPassword = (identifier: string) => {
  return apiClient("/auth/forgot-password", "POST", { identifier });
};

// Step 2: Verify reset code (OTP)
export const verifyResetOtp = (identifier: string, otp: string) => {
  return apiClient("/auth/verify-reset-otp", "POST", { identifier, otp });
};

// Step 3: Reset password using the token received from verifyResetOtp
export const resetPassword = (resetToken: string, newPassword: string, confirmPassword: string) => {
  return apiClient("/auth/reset-password", "POST", { resetToken, newPassword, confirmPassword });
};

// Optional: resend reset code (same as forgotPassword)
export const resendResetCode = forgotPassword;

// ----------------------------------------------------------------------
// (Optional) OTP login removed – not used anymore
// ----------------------------------------------------------------------