import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Campaign, PaginatedCampaigns } from '@repo/schemas'

type CampaignsState = {
  items: Campaign[]
  total: number
  page: number
  limit: number
  totalPages: number
  loading: boolean
  error: string | null
}

const initialState: CampaignsState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  loading: false,
  error: null,
}

export const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setCampaigns(state, action: PayloadAction<PaginatedCampaigns>) {
      state.items = action.payload.data
      state.total = action.payload.total
      state.page = action.payload.page
      state.limit = action.payload.limit
      state.totalPages = action.payload.totalPages
      state.loading = false
      state.error = null
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload
      state.loading = false
    },
  },
})

export const { setLoading, setCampaigns, setError } = campaignsSlice.actions
export default campaignsSlice.reducer
