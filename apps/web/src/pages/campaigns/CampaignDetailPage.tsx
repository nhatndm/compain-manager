import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CampaignStatus } from '@repo/schemas'
import { AppDispatch } from '../../store'
import {
  fetchCampaignDetail,
  sendCampaign,
  deleteCampaign,
} from '../../store/campaigns/campaigns.actions'
import {
  selectCampaignDetail,
  selectCampaignDetailLoading,
  selectCampaignDetailError,
  selectCampaignMutationError,
} from '../../store/campaigns/campaigns.selectors'
import { clearDetail, setMutationError } from '../../store/campaigns/campaigns.slice'
import { AppLayout } from '../../components/AppLayout'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { DonutChart } from '../../components/DonutChart'
import { StatCard } from '../../components/StatCard'
import { Tooltip } from '../../components/Tooltip'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EditCampaignDialog } from '../../smart-components/campaigns/EditCampaignDialog'
import { ScheduleCampaignDialog } from '../../smart-components/campaigns/ScheduleCampaignDialog'

export function CampaignDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const data = useSelector(selectCampaignDetail)
  const isLoading = useSelector(selectCampaignDetailLoading)
  const error = useSelector(selectCampaignDetailError)
  const mutationError = useSelector(selectCampaignMutationError)

  const [editOpen, setEditOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) dispatch(fetchCampaignDetail(id))
    return () => { dispatch(clearDetail()) }
  }, [id, dispatch])

  const handleSendConfirm = async () => {
    if (!id) return
    setIsSending(true)
    const ok = await dispatch(sendCampaign(id))
    setIsSending(false)
    if (ok) {
      toast.success('Campaign sent successfully')
      setSendConfirmOpen(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!id) return
    setIsDeleting(true)
    const ok = await dispatch(deleteCampaign(id))
    setIsDeleting(false)
    if (ok) {
      toast.success('Campaign deleted')
      navigate('/')
    }
  }

  const handleDialogClose = () => {
    dispatch(setMutationError(null))
  }

  const isSent = data?.status === 'sent'
  const isDraft = data?.status === 'draft'
  const canDelete = data?.status === 'draft' || data?.status === 'scheduled'

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
          <div className="rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">{error}</div>
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

                {canDelete ? (
                  <Button
                    variant="danger"
                    className="w-fit whitespace-nowrap px-4"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    Delete
                  </Button>
                ) : (
                  <Tooltip text="Sent campaigns cannot be deleted">
                    <Button variant="danger" className="w-fit whitespace-nowrap px-4" disabled>
                      Delete
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>

            {mutationError && !sendConfirmOpen && (
              <div className="rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">
                {mutationError}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <StatCard label="Total Recipients" value={data.stats.total} />
              <StatCard label="Sent" value={data.stats.sent} />
              <StatCard label="Failed" value={data.stats.failed} />
              <StatCard label="Open Rate" value={`${data.stats.openRate.toFixed(1)}%`} />
              <StatCard label="Failed Rate" value={`${data.stats.failedRate.toFixed(1)}%`} />
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-sm font-medium text-gray-400">Email Body</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">{data.body}</p>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              <DonutChart label="Open Rate" value={data.stats.openRate} color="#6366f1" />
              <DonutChart label="Failed Rate" value={data.stats.failedRate} color="#ef4444" />
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
                    <dd className="mt-1 text-white">{new Date(data.scheduledAt).toLocaleString()}</dd>
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
            onClose={() => { setEditOpen(false); handleDialogClose() }}
            onSuccess={() => setEditOpen(false)}
            campaign={data}
          />
          <ScheduleCampaignDialog
            open={scheduleOpen}
            onClose={() => { setScheduleOpen(false); handleDialogClose() }}
            onSuccess={() => setScheduleOpen(false)}
            campaign={data}
          />
          <ConfirmDialog
            open={sendConfirmOpen}
            onClose={() => { setSendConfirmOpen(false); handleDialogClose() }}
            onConfirm={handleSendConfirm}
            title="Send Campaign"
            message={`Are you sure you want to send "${data.name}" now? This action cannot be undone.`}
            confirmLabel="Send Now"
            loading={isSending}
          />
          <ConfirmDialog
            open={deleteConfirmOpen}
            onClose={() => { setDeleteConfirmOpen(false); handleDialogClose() }}
            onConfirm={handleDeleteConfirm}
            title="Delete Campaign"
            message={`Are you sure you want to delete "${data.name}"? This action cannot be undone.`}
            confirmLabel="Delete"
            loading={isDeleting}
          />
        </>
      )}
    </AppLayout>
  )
}

