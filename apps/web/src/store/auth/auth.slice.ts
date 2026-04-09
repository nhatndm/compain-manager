import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MeResponse } from '@repo/schemas'

type AuthState = {
  user: MeResponse | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setUser(state, action: PayloadAction<MeResponse | null>) {
      state.user = action.payload
      state.loading = false
      state.error = null
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload
      state.loading = false
    },
    clearAuth(state) {
      state.user = null
      state.error = null
    },
    clearError(state) {
      state.error = null
    },
  },
})

export const { setLoading, setUser, setError, clearAuth, clearError } = authSlice.actions
export default authSlice.reducer
