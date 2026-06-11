import { apiClient } from "./client";

export const submitComplaint = async (data: any) => {
  return apiClient("/support/complaint", "POST", data);
};