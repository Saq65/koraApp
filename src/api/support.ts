import { apiClient } from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem("token");
};

export const getComplaintCategories = async () => {
  return apiClient("/complaint-categories", "GET");
};

export const submitComplaint = async (complaintData: {
  category: string;
  orderId?: string;
  subject: string;
  description: string;
  photoUri?: string | null;
}) => {
  const formData = new FormData();
  formData.append("category", complaintData.category);
  if (complaintData.orderId) formData.append("orderId", complaintData.orderId);
  formData.append("subject", complaintData.subject);
  formData.append("description", complaintData.description);

  if (complaintData.photoUri) {
    const filename = complaintData.photoUri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    formData.append("photo", {
      uri: complaintData.photoUri,
      name: filename,
      type,
    } as any);
  }

  const token = (await getAuthToken()) ?? undefined; // 👈 fix here
  return apiClient("/complaints", "POST", formData, token, true);
};