import { apiClient } from "./client";
import { getToken } from "../utils/storage";

export const getActiveOrder=async()=>{

const token=await getToken();

return apiClient(
"/orders/active",
"GET",
undefined,
token || undefined
);

};


export const getRecentOrders=async()=>{

const token=await getToken();

return apiClient(
"/orders/recent",
"GET",
undefined,
token || undefined
);

};


export const createOrder=async(payload:any)=>{

const token=await getToken();

return apiClient(
"/orders",
"POST",
payload,
token || undefined
);

};