import { BadRequestException } from '@nestjs/common'
import { CampaignStatus } from '@repo/schemas'

type CampaignAction = 'update' | 'delete' | 'schedule' | 'send'

type Transition =
  | { type: 'to'; from: string; to: string }   // moves to a new status
  | { type: 'guard'; from: string }             // validates current status, no status change

const TRANSITIONS: Record<CampaignAction, Transition> = {
  update:   { type: 'guard', from: CampaignStatus.draft },
  delete:   { type: 'guard', from: CampaignStatus.draft },
  schedule: { type: 'to',    from: CampaignStatus.draft,     to: CampaignStatus.scheduled },
  send:     { type: 'to',    from: CampaignStatus.scheduled, to: CampaignStatus.sent },
}

/**
 * Asserts the campaign is in the correct state for the given action.
 * Returns the next status — for 'to' transitions this is a new status,
 * for guards this is the same status (unchanged).
 * Throws BadRequestException if the transition is not allowed.
 */
export function assertTransition(currentStatus: string, action: CampaignAction): string {
  const transition = TRANSITIONS[action]

  if (currentStatus !== transition.from) {
    throw new BadRequestException(
      `Cannot '${action}' a campaign with status '${currentStatus}'. Expected '${transition.from}'.`,
    )
  }

  return transition.type === 'to' ? transition.to : currentStatus
}
