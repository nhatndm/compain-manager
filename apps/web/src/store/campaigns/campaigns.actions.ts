import { queryClient } from '../../lib/queryClient'
import { apiClient } from '../../lib/api'
import { AppDispatch } from '../index'
import {
  setLoading, setCampaigns, setError,
  setDetailLoading, setDetail, setDetailError,
  setMutationError,
  setTrackingState,
  CampaignDetail,
} from './campaigns.slice'
import { Campaign, CreateCampaignDto, PaginatedCampaigns, UpdateCampaignDto } from '@repo/schemas'

// ── List ────────────────────────────────────────────────────────────────────

export const fetchCampaigns = (page = 1, limit = 20) => async (dispatch: AppDispatch): Promise<void> => {
  dispatch(setLoading(true))
  try {
    const data = await queryClient.fetchQuery({
      queryKey: ['campaigns', page, limit],
      queryFn: () => apiClient.get<PaginatedCampaigns>(`/campaigns?page=${page}&limit=${limit}`),
    })
    dispatch(setCampaigns(data))
  } catch (err) {
    dispatch(setError(err instanceof Error ? err.message : 'Failed to fetch campaigns'))
  }
}

// ── Create ──────────────────────────────────────────────────────────────────

export const createCampaign =
  (dto: CreateCampaignDto) =>
  async (dispatch: AppDispatch): Promise<Campaign> => {
    const campaign = await apiClient.post<Campaign>('/campaigns', dto)
    queryClient.removeQueries({ queryKey: ['campaigns'] })
    await dispatch(fetchCampaigns())
    return campaign
  }

// ── Detail ──────────────────────────────────────────────────────────────────

export const fetchCampaignDetail = (id: string) => async (dispatch: AppDispatch): Promise<void> => {
  dispatch(setDetailLoading(true))
  try {
    const data = await queryClient.fetchQuery({
      queryKey: ['campaign', id],
      queryFn: () => apiClient.get<CampaignDetail>(`/campaigns/${id}`),
      staleTime: 0,
    })
    dispatch(setDetail(data))
  } catch (err) {
    dispatch(setDetailError(err instanceof Error ? err.message : 'Failed to load campaign'))
  }
}

// ── Update ──────────────────────────────────────────────────────────────────

export const updateCampaign =
  (id: string, dto: UpdateCampaignDto) =>
  async (dispatch: AppDispatch): Promise<boolean> => {
    dispatch(setMutationError(null))
    try {
      await apiClient.patch(`/campaigns/${id}`, dto)
      queryClient.removeQueries({ queryKey: ['campaign', id] })
      await dispatch(fetchCampaignDetail(id))
      return true
    } catch (err) {
      dispatch(setMutationError(err instanceof Error ? err.message : 'Failed to update campaign'))
      return false
    }
  }

// ── Schedule ────────────────────────────────────────────────────────────────

export const scheduleCampaign =
  (id: string, scheduledAt: string) =>
  async (dispatch: AppDispatch): Promise<boolean> => {
    dispatch(setMutationError(null))
    try {
      await apiClient.post(`/campaigns/${id}/schedule`, { scheduledAt })
      queryClient.removeQueries({ queryKey: ['campaign', id] })
      await dispatch(fetchCampaignDetail(id))
      return true
    } catch (err) {
      dispatch(setMutationError(err instanceof Error ? err.message : 'Failed to schedule campaign'))
      return false
    }
  }

// ── Send ────────────────────────────────────────────────────────────────────

export const sendCampaign = (id: string) => async (dispatch: AppDispatch): Promise<boolean> => {
  dispatch(setMutationError(null))
  try {
    await apiClient.post(`/campaigns/${id}/send`)
    queryClient.removeQueries({ queryKey: ['campaign', id] })
    await dispatch(fetchCampaignDetail(id))
    return true
  } catch (err) {
    dispatch(setMutationError(err instanceof Error ? err.message : 'Failed to send campaign'))
    return false
  }
}

// ── Open tracking (public) ───────────────────────────────────────────────────

export const trackOpen = (trackingToken: string) => async (dispatch: AppDispatch): Promise<void> => {
  dispatch(setTrackingState('loading'))
  try {
    await apiClient.get(`/campaigns/open/${trackingToken}`)
    dispatch(setTrackingState('success'))
  } catch {
    dispatch(setTrackingState('error'))
  }
}
