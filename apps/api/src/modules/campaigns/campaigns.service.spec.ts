import { Test } from '@nestjs/testing'
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import { KNEX_CONNECTION } from '../../database/knex.module'
import { CAMPAIGN_ERRORS } from './campaigns.errors'

// ── Helpers ────────────────────────────────────────────────────────────────

const FUTURE_DATE = new Date(Date.now() + 86_400_000).toISOString()  // +1 day
const PAST_DATE   = new Date(Date.now() - 86_400_000).toISOString()  // -1 day

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function makeCampaignRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'campaign-1',
    name: 'Test Campaign',
    subject: 'Hello',
    body: 'Body text',
    status: 'draft',
    scheduled_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('CampaignsService', () => {
  let service: CampaignsService
  let mockKnexChain: {
    where: jest.Mock
    join: jest.Mock
    select: jest.Mock
    first: jest.Mock
    update: jest.Mock
    returning: jest.Mock
  }
  let mockKnex: jest.Mock

  beforeEach(async () => {
    mockKnexChain = {
      where: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first: jest.fn(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
    }
    mockKnex = jest.fn().mockReturnValue(mockKnexChain)

    const module = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
      ],
    }).compile()

    service = module.get(CampaignsService)
  })

  // ── schedule ──────────────────────────────────────────────────────────────

  describe('schedule', () => {
    it('throws BadRequestException when scheduledAt is in the past', async () => {
      await expect(
        service.schedule('campaign-1', { scheduledAt: PAST_DATE }, 'user-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws with SCHEDULE_IN_PAST message when date is in the past', async () => {
      await expect(
        service.schedule('campaign-1', { scheduledAt: PAST_DATE }, 'user-1'),
      ).rejects.toThrow(CAMPAIGN_ERRORS.SCHEDULE_IN_PAST)
    })

    it('throws NotFoundException when campaign does not exist', async () => {
      mockKnexChain.first.mockResolvedValue(undefined)

      await expect(
        service.schedule('nonexistent', { scheduledAt: FUTURE_DATE }, 'user-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when campaign belongs to another user', async () => {
      mockKnexChain.first.mockResolvedValue(makeCampaignRow({ created_by: 'other-user' }))

      await expect(
        service.schedule('campaign-1', { scheduledAt: FUTURE_DATE }, 'user-1'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('throws BadRequestException when campaign is not in draft status', async () => {
      mockKnexChain.first.mockResolvedValue(makeCampaignRow({ status: 'sent' }))

      await expect(
        service.schedule('campaign-1', { scheduledAt: FUTURE_DATE }, 'user-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('returns the updated campaign on success', async () => {
      const draftRow = makeCampaignRow()
      const scheduledRow = makeCampaignRow({ status: 'scheduled', scheduled_at: FUTURE_DATE })

      mockKnexChain.first.mockResolvedValue(draftRow)
      mockKnexChain.returning.mockResolvedValue([scheduledRow])

      const result = await service.schedule('campaign-1', { scheduledAt: FUTURE_DATE }, 'user-1')

      expect(result.status).toBe('scheduled')
      expect(result.scheduledAt).toBe(FUTURE_DATE)
    })

    it('persists the correct scheduledAt date', async () => {
      const draftRow = makeCampaignRow()
      mockKnexChain.first.mockResolvedValue(draftRow)
      mockKnexChain.returning.mockResolvedValue([makeCampaignRow({ status: 'scheduled', scheduled_at: FUTURE_DATE })])

      await service.schedule('campaign-1', { scheduledAt: FUTURE_DATE }, 'user-1')

      expect(mockKnexChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ scheduled_at: FUTURE_DATE, status: 'scheduled' }),
      )
    })
  })

  // ── markOpened (Open Compain) ─────────────────────────────────────────────

  describe('markOpened', () => {
    it('silently ignores an unknown tracking token', async () => {
      mockKnexChain.first.mockResolvedValue(undefined)

      await expect(service.markOpened('unknown-token')).resolves.toBeUndefined()
      expect(mockKnexChain.update).not.toHaveBeenCalled()
    })

    it('throws BadRequestException (LINK_EXPIRED) when campaign status is not sent', async () => {
      mockKnexChain.first.mockResolvedValue({ opened_at: null, status: 'scheduled' })

      await expect(service.markOpened('valid-token')).rejects.toThrow(BadRequestException)
    })

    it('throws with LINK_EXPIRED message when campaign is not sent', async () => {
      mockKnexChain.first.mockResolvedValue({ opened_at: null, status: 'draft' })

      await expect(service.markOpened('valid-token')).rejects.toThrow(CAMPAIGN_ERRORS.LINK_EXPIRED)
    })

    it('records opened_at timestamp on first open', async () => {
      mockKnexChain.first.mockResolvedValue({ opened_at: null, status: 'sent' })
      mockKnexChain.update.mockResolvedValue(1)

      await service.markOpened('valid-token')

      expect(mockKnexChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ opened_at: expect.any(String) }),
      )
    })

    it('is a no-op when campaign was already opened (only first open is recorded)', async () => {
      mockKnexChain.first.mockResolvedValue({
        opened_at: '2026-01-01T00:00:00.000Z',
        status: 'sent',
      })

      await service.markOpened('already-opened-token')

      expect(mockKnexChain.update).not.toHaveBeenCalled()
    })

    it('resolves without error for a valid first open', async () => {
      mockKnexChain.first.mockResolvedValue({ opened_at: null, status: 'sent' })
      mockKnexChain.update.mockResolvedValue(1)

      await expect(service.markOpened('valid-token')).resolves.toBeUndefined()
    })
  })

  // ── ScheduleCampaignSchema (Zod) ──────────────────────────────────────────

  describe('ScheduleCampaignSchema validation', () => {
    // Import schema directly to test Zod-level validation (shared frontend+backend)
    const { ScheduleCampaignSchema } = require('@repo/schemas')

    it('accepts a valid future datetime', () => {
      const result = ScheduleCampaignSchema.safeParse({ scheduledAt: FUTURE_DATE })
      expect(result.success).toBe(true)
    })

    it('rejects a past datetime', () => {
      const result = ScheduleCampaignSchema.safeParse({ scheduledAt: PAST_DATE })
      expect(result.success).toBe(false)
    })

    it('rejects a non-datetime string', () => {
      const result = ScheduleCampaignSchema.safeParse({ scheduledAt: 'not-a-date' })
      expect(result.success).toBe(false)
    })

    it('rejects a missing scheduledAt', () => {
      const result = ScheduleCampaignSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })
})
