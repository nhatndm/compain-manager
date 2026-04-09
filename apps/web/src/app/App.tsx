import { AppLayout } from '../components/AppLayout'
import { Button } from '../components/Button'
import { CampaignList } from '../smart-components/campaigns/CampaignList'

export function App(): JSX.Element {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Manage and track your email campaigns</p>
          <Button variant="primary" className="w-auto max-w-[250px] px-4">
            + Create Campaign
          </Button>
        </div>

        <CampaignList />
      </div>
    </AppLayout>
  )
}
