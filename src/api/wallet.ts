import { apiClient } from "./client";
import { getToken } from "../utils/storage";

export interface WalletTransaction {
  id: string;
  type: "refund" | "credit" | "debit" | "cashback";
  amount: number;
  reason: string;
  orderNumber: string | null;
  createdAt: string;
}

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

export const getWallet = async () => {
  const token = await getToken();
  return apiClient("/wallet", "GET", undefined, token || undefined);
};