import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Campaign, CampaignStats, CampaignStatus } from '@repo/schemas'
import { apiClient } from '../../lib/api'
import { AppLayout } from '../../components/AppLayout'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Tooltip } from '../../components/Tooltip'
import { EditCampaignDialog } from '../../smart-components/campaigns/EditCampaignDialog'
import { ScheduleCampaignDialog } from '../../smart-components/campaigns/ScheduleCampaignDialog'
import { ConfirmDialog } from '../../components/ConfirmDialog'

type CampaignDetail = Campaign & { stats: CampaignStats }

export function CampaignDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<CampaignDetail>({
    queryKey: ['campaign', id],
    queryFn: () => apiClient.get<CampaignDetail>(`/campaigns/${id}`),
    enabled: !!id,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['campaign', id] })
  }

  const handleSendConfirm = async () => {
    setSendError(null)
    setIsSending(true)
    try {
      await apiClient.post(`/campaigns/${id}/send`)
      setSendConfirmOpen(false)
      refresh()
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send campaign')
    } finally {
      setIsSending(false)
    }
  }

  const isSent = data?.status === 'sent'
  const isDraft = data?.status === 'draft'

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <Link to="/" className="w-fit text-sm text-gray-400 transition-colors hover:text-white">
          ← Campaigns
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">
            {error instanceof Error ? error.message : 'Failed to load campaign'}
          </div>
        )}

        {data && (
          <>
            {/* Title row */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{data.name}</h1>
                  <Badge variant={data.status as keyof typeof CampaignStatus}>
                    {data.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">{data.subject}</p>
              </div>

              {/* Action group */}
              <div className="flex shrink-0 items-center gap-2">
                {isDraft ? (
                  <Button
                    variant="secondary"
                    className="w-fit whitespace-nowrap px-4"
                    onClick={() => setEditOpen(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <Tooltip text="Only draft campaigns can be edited">
                    <Button variant="secondary" className="w-fit whitespace-nowrap px-4" disabled>
                      Edit
                    </Button>
                  </Tooltip>
                )}

                {isSent ? (
                  <Tooltip text="This campaign has been sent">
                    <Button variant="secondary" className="w-fit whitespace-nowrap px-4" disabled>
                      Schedule
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-fit whitespace-nowrap px-4"
                    onClick={() => setScheduleOpen(true)}
                  >
                    {data.status === 'scheduled' ? 'Reschedule' : 'Schedule'}
                  </Button>
                )}

                {isSent ? (
                  <Tooltip text="This campaign has been sent">
                    <Button className="w-fit whitespace-nowrap px-4" disabled>
                      Send Now
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    className="w-fit whitespace-nowrap px-4"
                    onClick={() => setSendConfirmOpen(true)}
                  >
                    Send Now
                  </Button>
                )}
              </div>
            </div>

            {sendError && (
              <div className="rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">
                {sendError}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Recipients" value={data.stats.total} />
              <StatCard label="Sent" value={data.stats.sent} />
              <StatCard label="Failed" value={data.stats.failed} />
              <StatCard label="Open Rate" value={`${data.stats.openRate.toFixed(1)}%`} />
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-sm font-medium text-gray-400">Email Body</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                {data.body}
              </p>
            </div>

            {/* Metadata */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-gray-400">Created At</dt>
                  <dd className="mt-1 text-white">{new Date(data.createdAt).toLocaleString()}</dd>
                </div>
                {data.scheduledAt && (
                  <div>
                    <dt className="text-gray-400">Scheduled At</dt>
                    <dd className="mt-1 text-white">
                      {new Date(data.scheduledAt).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </>
        )}
      </div>

      {data && (
        <>
          <EditCampaignDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSuccess={() => { setEditOpen(false); refresh() }}
            campaign={data}
          />
          <ScheduleCampaignDialog
            open={scheduleOpen}
            onClose={() => setScheduleOpen(false)}
            onSuccess={() => { setScheduleOpen(false); refresh() }}
            campaign={data}
          />
          <ConfirmDialog
            open={sendConfirmOpen}
            onClose={() => setSendConfirmOpen(false)}
            onConfirm={handleSendConfirm}
            title="Send Campaign"
            message={`Are you sure you want to send "${data.name}" now? This action cannot be undone.`}
            confirmLabel="Send Now"
            loading={isSending}
          />
        </>
      )}
    </AppLayout>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }): JSX.Element {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  )
}
