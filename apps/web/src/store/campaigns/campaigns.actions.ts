import { queryClient } from '../../lib/queryClient'
import { apiClient } from '../../lib/api'
import { AppDispatch } from '../index'
import { setLoading, setCampaigns, setError } from './campaigns.slice'
import { PaginatedCampaigns } from '@repo/schemas'

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
