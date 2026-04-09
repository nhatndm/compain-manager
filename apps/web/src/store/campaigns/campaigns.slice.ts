import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Campaign, CampaignRecipientItem, CampaignStats, PaginatedCampaigns } from '@repo/schemas'

export type CampaignDetail = Campaign & { stats: CampaignStats }
export type TrackingState = 'idle' | 'loading' | 'success' | 'error'

type CampaignsState = {
  // List
  items: Campaign[]
  total: number
  page: number
  limit: number
  totalPages: number
  loading: boolean
  error: string | null
  // Detail
  detail: CampaignDetail | null
  detailLoading: boolean
  detailError: string | null
  // Mutations (edit / schedule / send)
  mutationError: string | null
  // Open tracking
  trackingState: TrackingState
  // Recipients
  recipients: CampaignRecipientItem[]
  recipientsTotal: number
  recipientsPage: number
  recipientsLimit: number
  recipientsTotalPages: number
  recipientsLoading: boolean
  recipientsError: string | null
}

const initialState: CampaignsState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  loading: false,
  error: null,
  detail: null,
  detailLoading: false,
  detailError: null,
  mutationError: null,
  trackingState: 'idle',
  recipients: [],
  recipientsTotal: 0,
  recipientsPage: 1,
  recipientsLimit: 20,
  recipientsTotalPages: 0,
  recipientsLoading: false,
  recipientsError: null,
}

export const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    // List
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
    // Detail
    setDetailLoading(state, action: PayloadAction<boolean>) {
      state.detailLoading = action.payload
    },
    setDetail(state, action: PayloadAction<CampaignDetail>) {
      state.detail = action.payload
      state.detailLoading = false
      state.detailError = null
    },
    setDetailError(state, action: PayloadAction<string>) {
      state.detailError = action.payload
      state.detailLoading = false
    },
    clearDetail(state) {
      state.detail = null
      state.detailError = null
    },
    // Mutations
    setMutationError(state, action: PayloadAction<string | null>) {
      state.mutationError = action.payload
    },
    // Tracking
    setTrackingState(state, action: PayloadAction<TrackingState>) {
      state.trackingState = action.payload
    },
    // Recipients
    setRecipientsLoading(state, action: PayloadAction<boolean>) {
      state.recipientsLoading = action.payload
    },
    setRecipients(state, action: PayloadAction<{ data: CampaignRecipientItem[]; total: number; page: number; limit: number; totalPages: number }>) {
      state.recipients = action.payload.data
      state.recipientsTotal = action.payload.total
      state.recipientsPage = action.payload.page
      state.recipientsLimit = action.payload.limit
      state.recipientsTotalPages = action.payload.totalPages
      state.recipientsLoading = false
      state.recipientsError = null
    },
    setRecipientsError(state, action: PayloadAction<string>) {
      state.recipientsError = action.payload
      state.recipientsLoading = false
    },
    clearRecipients(state) {
      state.recipients = []
      state.recipientsTotal = 0
      state.recipientsPage = 1
      state.recipientsTotalPages = 0
      state.recipientsError = null
    },
  },
})

export const {
  setLoading, setCampaigns, setError,
  setDetailLoading, setDetail, setDetailError, clearDetail,
  setMutationError,
  setTrackingState,
  setRecipientsLoading, setRecipients, setRecipientsError, clearRecipients,
} = campaignsSlice.actions

export default campaignsSlice.reducer
