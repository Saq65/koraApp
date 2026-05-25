// store/hooks.ts

import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = () =>
  useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> =
  useSelector;

export const selectCartItems = (state: RootState) =>
  state.cart.items;

export const selectCartCount = (state: RootState) =>
  state.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

// Remove price calculation completely
export const selectCartTotal = (state: RootState) =>
  state.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

export const selectItemQuantity =
  (id: string) => (state: RootState) =>
    state.cart.items.find(
      i => i.id === id
    )?.quantity ?? 0;