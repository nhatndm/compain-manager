import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../index'

export const selectCampaignsState = (state: RootState) => state.campaigns

export const selectAllCampaigns = createSelector(
  selectCampaignsState,
  (campaigns) => campaigns.items,
)

export const selectCampaignsLoading = createSelector(
  selectCampaignsState,
  (campaigns) => campaigns.loading,
)

export const selectCampaignsError = createSelector(
  selectCampaignsState,
  (campaigns) => campaigns.error,
)

export const selectCampaignsPagination = createSelector(
  selectCampaignsState,
  ({ total, page, limit, totalPages }) => ({ total, page, limit, totalPages }),
)
