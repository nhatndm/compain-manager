import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AuthUser } from '@repo/schemas'

type AuthState = {
  user: AuthUser | null
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
    setUser(state, action: PayloadAction<AuthUser | null>) {
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
  },
})

export const { setLoading, setUser, setError, clearAuth } = authSlice.actions
export default authSlice.reducer
