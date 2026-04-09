import { queryClient } from '../../lib/queryClient'
import { apiClient } from '../../lib/api'
import { AppDispatch } from '../index'
import { setLoading, setCampaigns, setError } from './campaigns.slice'
import { Campaign, CreateCampaignDto, PaginatedCampaigns } from '@repo/schemas'

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

export const createCampaign =
  (dto: Pick<CreateCampaignDto, 'name' | 'subject' | 'body'>) =>
  async (dispatch: AppDispatch): Promise<Campaign> => {
    const campaign = await apiClient.post<Campaign>('/campaigns', dto)
    queryClient.removeQueries({ queryKey: ['campaigns'] })
    await dispatch(fetchCampaigns())
    return campaign
  }
