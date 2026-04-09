import { configureStore } from '@reduxjs/toolkit'
import authReducer from './auth/auth.slice'
import campaignsReducer from './campaigns/campaigns.slice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    campaigns: campaignsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
