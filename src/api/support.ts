import { apiClient } from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem("token");
};

export const getComplaintCategories = async () => {
  return apiClient("/complaint-categories", "GET");
};

// Fetch the logged-in customer's own complaints (open + resolved + rejected).
export const getMyComplaints = async () => {
  const token = await getAuthToken();
  return apiClient("/complaints/my", "GET", undefined, token ?? undefined);
};

export const submitComplaint = async (complaintData: {
  category: string;
  orderId?: string;
  subject: string;
  description: string;
  photoUris?: string[];
}) => {
  const formData = new FormData();

  formData.append("category", complaintData.category);

  if (complaintData.orderId) {
    formData.append("orderId", complaintData.orderId);
  }

  formData.append("subject", complaintData.subject);
  formData.append("description", complaintData.description);

  complaintData.photoUris?.slice(0, 3).forEach((uri, index) => {
    const filename =
      uri.split("/").pop() || `photo-${index + 1}.jpg`;

    const match = /\.(\w+)$/.exec(filename);

    let type = "image/jpeg";

    if (match) {
      const extension = match[1].toLowerCase();

      if (extension === "png") {
        type = "image/png";
      } else if (
        extension === "jpg" ||
        extension === "jpeg"
      ) {
        type = "image/jpeg";
      } else if (extension === "webp") {
        type = "image/webp";
      }
    }

    formData.append(
      "photos",
      {
        uri,
        name: filename,
        type,
      } as any
    );
  });

  const token = (await getAuthToken()) ?? undefined;

  return apiClient(
    "/complaints",
    "POST",
    formData,
    token,
    true
  );
};