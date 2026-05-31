import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type AddressState = {
  pickupAddress: string
  dropoffAddress: string
  pickupCoordinates: number[] | null
  dropoffCoordinates: number[] | null
}

const initialState: AddressState = {
  pickupAddress: '123 Main Street, Mumbai, MH 400001',
  dropoffAddress: '123 Main Street, Mumbai, MH 400001',
  pickupCoordinates: null,   // ✅ add this
  dropoffCoordinates: null,  // ✅ add this
}

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setAddress(
      state,
      action: PayloadAction<{
        type: 'pickup' | 'dropoff'
        address: string
        coordinates?: number[] | null
      }>
    ) {
      if (action.payload.type === 'pickup') {
        state.pickupAddress = action.payload.address
        if (action.payload.coordinates !== undefined) {
          state.pickupCoordinates = action.payload.coordinates
        }
      } else {
        state.dropoffAddress = action.payload.address
        if (action.payload.coordinates !== undefined) {
          state.dropoffCoordinates = action.payload.coordinates
        }
      }
    },
  },
})

export const { setAddress } = addressSlice.actions
export const selectPickupAddress = (state: any) => state.address.pickupAddress
export const selectDropoffAddress = (state: any) => state.address.dropoffAddress
export const selectPickupCoordinates = (state: any) => state.address.pickupCoordinates
export const selectDropoffCoordinates = (state: any) => state.address.dropoffCoordinates
export default addressSlice.reducer