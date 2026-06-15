import { apiClient } from "../api/client";
import { getToken } from "../utils/storage";

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
  console.log('submitReview token:', token);        
  console.log('submitReview payload:', payload);    
  return apiClient("/reviews", "POST", payload, token || undefined);
};

export const getMyReview = async () => {
  const token = await getToken();
  return apiClient("/reviews/my", "GET", undefined, token || undefined);
};

