import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../index'

export const selectCampaignsState = (state: RootState) => state.campaigns

// List
export const selectAllCampaigns = createSelector(selectCampaignsState, (s) => s.items)
export const selectCampaignsLoading = createSelector(selectCampaignsState, (s) => s.loading)
export const selectCampaignsError = createSelector(selectCampaignsState, (s) => s.error)
export const selectCampaignsPagination = createSelector(
  selectCampaignsState,
  ({ total, page, limit, totalPages }) => ({ total, page, limit, totalPages }),
)

// Detail
export const selectCampaignDetail = createSelector(selectCampaignsState, (s) => s.detail)
export const selectCampaignDetailLoading = createSelector(selectCampaignsState, (s) => s.detailLoading)
export const selectCampaignDetailError = createSelector(selectCampaignsState, (s) => s.detailError)

// Mutations
export const selectCampaignMutationError = createSelector(selectCampaignsState, (s) => s.mutationError)

// Tracking
export const selectTrackingState = createSelector(selectCampaignsState, (s) => s.trackingState)

// Recipients
export const selectCampaignRecipients = createSelector(selectCampaignsState, (s) => s.recipients)
export const selectCampaignRecipientsLoading = createSelector(selectCampaignsState, (s) => s.recipientsLoading)
export const selectCampaignRecipientsError = createSelector(selectCampaignsState, (s) => s.recipientsError)
export const selectCampaignRecipientsPagination = createSelector(
  selectCampaignsState,
  ({ recipientsTotal, recipientsPage, recipientsLimit, recipientsTotalPages }) => ({
    total: recipientsTotal,
    page: recipientsPage,
    limit: recipientsLimit,
    totalPages: recipientsTotalPages,
  }),
)
