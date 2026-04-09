import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppLayout } from '../components/AppLayout'
import { Button } from '../components/Button'
import { CampaignList } from '../smart-components/campaigns/CampaignList'
import { CreateCampaignDialog } from '../smart-components/campaigns/CreateCampaignDialog'
import { AppDispatch } from '../store'
import { fetchCampaigns } from '../store/campaigns/campaigns.actions'

export function App(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSuccess = () => {
    setDialogOpen(false)
    dispatch(fetchCampaigns())
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Manage and track your email campaigns</p>
          <Button
            variant="primary"
            className="w-fit whitespace-nowrap px-4"
            onClick={() => setDialogOpen(true)}
          >
            + Create Campaign
          </Button>
        </div>

        <CampaignList />
      </div>

      <CreateCampaignDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </AppLayout>
  )
}
