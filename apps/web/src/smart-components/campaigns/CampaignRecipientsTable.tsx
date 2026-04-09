import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '../../store'
import { fetchCampaignRecipients } from '../../store/campaigns/campaigns.actions'
import { clearRecipients } from '../../store/campaigns/campaigns.slice'
import {
  selectCampaignRecipients,
  selectCampaignRecipientsLoading,
  selectCampaignRecipientsError,
  selectCampaignRecipientsPagination,
} from '../../store/campaigns/campaigns.selectors'
import { Pagination } from '../../components/Pagination'

type Props = {
  campaignId: string
}

export function CampaignRecipientsTable({ campaignId }: Props): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const recipients = useSelector(selectCampaignRecipients)
  const loading = useSelector(selectCampaignRecipientsLoading)
  const error = useSelector(selectCampaignRecipientsError)
  const pagination = useSelector(selectCampaignRecipientsPagination)

  useEffect(() => {
    dispatch(fetchCampaignRecipients(campaignId))
    return () => { dispatch(clearRecipients()) }
  }, [campaignId, dispatch])

  const handlePageChange = (page: number): void => {
    dispatch(fetchCampaignRecipients(campaignId, page, pagination.limit))
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-gray-400">
        Recipients
        {pagination.total > 0 && (
          <span className="ml-2 text-gray-600">({pagination.total})</span>
        )}
      </h2>

      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="px-4 py-3 text-left font-medium text-gray-400">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Sent At</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Opened At</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  </div>
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-red-400">{error}</td>
              </tr>
            )}
            {!loading && !error && recipients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No recipients</td>
              </tr>
            )}
            {!loading && recipients.map((r) => (
              <tr key={r.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-900/50">
                <td className="px-4 py-3 text-white">{r.name}</td>
                <td className="px-4 py-3 text-gray-300">{r.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === 'sent' ? 'bg-green-950 text-green-400' :
                    r.status === 'failed' ? 'bg-red-950 text-red-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {r.sentAt ? new Date(r.sentAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {r.openedAt ? new Date(r.openedAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          label="recipients"
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
