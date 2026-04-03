export const apiClient = async (
  endpoint: string,
  method: string = "GET",
  body?: any,
  token?: string
) => {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error: any) {
    throw error;
  }
};