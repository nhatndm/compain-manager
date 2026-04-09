export const CAMPAIGN_ERRORS = {
  NOT_FOUND: 'Campaign not found',
  FORBIDDEN: 'You do not have access to this campaign',
  LINK_EXPIRED: 'This link has expired',
  SCHEDULE_IN_PAST: 'scheduledAt must be a future date',
} as const
