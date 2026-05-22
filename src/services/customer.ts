import { apiClient } from "../api/client";
import { getToken } from "../utils/storage";

// ─────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────
export const getProfile = async () => {
  try {
    const token = await getToken();

    const response = await apiClient(
      "/customers/profile",
      "GET",
      undefined,
      token || undefined
    );

    console.log(
      "Login Profile Data:",
      JSON.stringify(response, null, 2)
    );

    return response;
  } catch (error) {
    console.log("Profile Error:", error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────
export const updateProfile = async (payload: any) => {
  const token = await getToken();

  return apiClient(
    "/customers/profile",
    "PUT",
    payload,
    token || undefined
  );
};

// ─────────────────────────────────────────────
// ADD ADDRESS
// ─────────────────────────────────────────────
export const addAddress = async (payload: any) => {
  const token = await getToken();

  return apiClient(
    "/customers/addresses",
    "POST",
    payload,
    token || undefined
  );
};

// ─────────────────────────────────────────────
// UPDATE ADDRESS
// ─────────────────────────────────────────────
export const updateAddress = async (
  addressId: string,
  payload: any
) => {
  const token = await getToken();

  return apiClient(
    `/customers/addresses/${addressId}`,
    "PUT",
    payload,
    token || undefined
  );
};

// ─────────────────────────────────────────────
// DELETE ADDRESS
// ─────────────────────────────────────────────
export const deleteAddress = async (addressId: string) => {
  const token = await getToken();

  return apiClient(
    `/customers/addresses/${addressId}`,
    "DELETE",
    undefined,
    token || undefined
  );
};

// ─────────────────────────────────────────────
// SET DEFAULT ADDRESS
// ─────────────────────────────────────────────
export const setDefaultAddress = async (
  addressId: string
) => {
  const token = await getToken();

  return apiClient(
    `/customers/addresses/${addressId}/default`,
    "PUT",
    undefined,
    token || undefined
  );
};