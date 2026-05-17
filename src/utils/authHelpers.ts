// utils/authHelpers.ts
import { setToken, setUser } from "./storage";
import { getProfile } from "../services/customer";

export const handleSuccessfulLogin = async (token: string, role?: string) => {
  // 1. Save token
  await setToken(token);

  // 2. Fetch full user profile
  const profileResponse = await getProfile();
  const userData = profileResponse.data;

  // 3. Save user details
  await setUser({
    id: userData.id,
    name: userData.fullName,
    email: userData.email,
    mobile: userData.mobile,
    role: role || userData.role,
  });
};