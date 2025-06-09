import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface userState {
  value: number
}

const initialState: userState = {
  value: 0,
}

const UserSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
  },
})

export const { incrementByAmount } = UserSlice.actions

export default UserSlice.reducer