import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '../../store'
import { fetchCampaigns } from '../../store/campaigns/campaigns.actions'
import {
  selectAllCampaigns,
  selectCampaignsLoading,
  selectCampaignsError,
  selectCampaignsPagination,
} from '../../store/campaigns/campaigns.selectors'
import { CampaignItem } from '../../components/CampaignItem'
import { Pagination } from '../../components/Pagination'

export function CampaignList(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const campaigns = useSelector(selectAllCampaigns)
  const loading = useSelector(selectCampaignsLoading)
  const error = useSelector(selectCampaignsError)
  const pagination = useSelector(selectCampaignsPagination)

  useEffect(() => {
    dispatch(fetchCampaigns())
  }, [dispatch])

  const handlePageChange = (page: number): void => {
    dispatch(fetchCampaigns(page, pagination.limit))
  }

  const campaignRows = useMemo(
    () => campaigns.map((campaign) => <CampaignItem key={campaign.id} campaign={campaign} />),
    [campaigns],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 py-20 text-center">
        <p className="text-gray-400">No campaigns yet</p>
        <p className="mt-1 text-sm text-gray-600">Create your first campaign to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="px-4 py-3 text-left font-medium text-gray-400">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Subject</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Scheduled At</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {campaignRows}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        label="campaigns"
        onPageChange={handlePageChange}
      />
    </div>
  )
}
