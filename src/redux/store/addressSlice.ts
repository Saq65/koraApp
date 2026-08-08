import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type Coordinates = [number, number]

type AddressState = {
  pickupAddress: string
  dropoffAddress: string
  pickupCoordinates: Coordinates | null
  dropoffCoordinates: Coordinates | null
}

const initialState: AddressState = {
  pickupAddress: '',
  dropoffAddress: '',
  pickupCoordinates: null,
  dropoffCoordinates: null,
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
        coordinates?: Coordinates | null
      }>
    ) {
      const { type, address, coordinates } = action.payload

      if (type === 'pickup') {
        state.pickupAddress = address

        if (coordinates !== undefined) {
          state.pickupCoordinates = coordinates
        }
      } else {
        state.dropoffAddress = address

        if (coordinates !== undefined) {
          state.dropoffCoordinates = coordinates
        }
      }
    },

    clearAddresses(state) {
      state.pickupAddress = ''
      state.dropoffAddress = ''
      state.pickupCoordinates = null
      state.dropoffCoordinates = null
    },
  },
})

export const { setAddress, clearAddresses } = addressSlice.actions

export const selectPickupAddress = (state: any) =>
  state.address.pickupAddress

export const selectDropoffAddress = (state: any) =>
  state.address.dropoffAddress

export const selectPickupCoordinates = (state: any) =>
  state.address.pickupCoordinates

export const selectDropoffCoordinates = (state: any) =>
  state.address.dropoffCoordinates

export default addressSlice.reducer