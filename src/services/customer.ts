import { apiClient } from "../api/client";
import { getToken } from "../utils/storage";


// ─────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────
export const getProfile = async () => {
  const token = await getToken();

  return apiClient(
    "/customers/profile",
    "GET",
    undefined,
    token || undefined
  );
};


// ─────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────
export const updateProfile = async (
  payload: any
) => {
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
export const addAddress = async (
  payload: any
) => {
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
export const deleteAddress = async (
  addressId: string
) => {
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


export const submitReview = async (payload: {
  orderId?: string;
  overallRating: number;
  categoryRatings?: {
    pickup?: number;
    quality?: number;
    delivery?: number;
    packaging?: number;
  };
  tags?: string[];
  review?: string;
}) => {
  const token = await getToken();
 
  return apiClient(
    "/reviews",
    "POST",
    payload,
    token || undefined
  );
};
 
// ─────────────────────────────────────────────
// GET MY REVIEWS
// ─────────────────────────────────────────────
export const getMyReviews = async () => {
  const token = await getToken();
 
  return apiClient(
    "/reviews/my",
    "GET",
    undefined,
    token || undefined
  );
}
// src/services/customer.ts (add the following functions)

// ─────────────────────────────────────────────
// SAVED ADDRESSES (matching backend routes)
// ─────────────────────────────────────────────

/** Get all saved addresses for the logged-in user (GET /saved-addresses) */
export const getSavedAddresses = async () => {
  const token = await getToken();
  return apiClient("/saved-addresses", "GET", undefined, token || undefined);
};

/** Create a new saved address (POST /saved-addresses) */
export const createSavedAddress = async (payload: {
  label: 'home' | 'office' | 'other';
  customLabel?: string | null;
  address: string;
  coordinates: { lat: number; lng: number };
  isDefault?: boolean;
}) => {
  const token = await getToken();
  return apiClient("/saved-addresses", "POST", payload, token || undefined);
};

/** Update an existing saved address (PUT /saved-addresses/:id) */
export const updateSavedAddress = async (
  addressId: string,
  payload: Partial<{
    label: 'home' | 'office' | 'other';
    customLabel: string | null;
    address: string;
    coordinates: { lat: number; lng: number };
    isDefault: boolean;
  }>
) => {
  const token = await getToken();
  return apiClient(`/saved-addresses/${addressId}`, "PUT", payload, token || undefined);
};

/** Delete a saved address (DELETE /saved-addresses/:id) */
export const deleteSavedAddress = async (addressId: string) => {
  const token = await getToken();
  return apiClient(`/saved-addresses/${addressId}`, "DELETE", undefined, token || undefined);
};