import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type AddressState = {
  pickupAddress: string
  dropoffAddress: string
}

const initialState: AddressState = {
  pickupAddress: '123 Main Street, Mumbai, MH 400001',
  dropoffAddress: '123 Main Street, Mumbai, MH 400001',
}

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setAddress(state, action: PayloadAction<{ type: 'pickup' | 'dropoff'; address: string }>) {
      if (action.payload.type === 'pickup') state.pickupAddress = action.payload.address
      else state.dropoffAddress = action.payload.address
    },
  },
})

export const { setAddress } = addressSlice.actions
export const selectPickupAddress = (state: any) => state.address.pickupAddress
export const selectDropoffAddress = (state: any) => state.address.dropoffAddress
export default addressSlice.reducer