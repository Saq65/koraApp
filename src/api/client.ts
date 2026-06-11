import axios from "axios";

export const apiClient = async (
  endpoint: string,
  method: string = "GET",
  body?: any,
  token?: string
) => {
  try {
    const response = await axios({
      url: `${process.env.EXPO_PUBLIC_API_URL}${endpoint}`,
      method,
      data: body,
      headers: {
        "Content-Type": "application/json",
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
      },
    });

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong"
    );
  }
};