import { Campaign, CampaignStatus } from '@repo/schemas'
import { Badge } from './Badge'

type CampaignItemProps = {
  campaign: Campaign
}

export function CampaignItem({ campaign }: CampaignItemProps): JSX.Element {
  return (
    <tr className="bg-gray-900 transition-colors hover:bg-gray-800">
      <td className="px-4 py-3 font-medium text-white">{campaign.name}</td>
      <td className="px-4 py-3 text-gray-300">{campaign.subject}</td>
      <td className="px-4 py-3">
        <Badge variant={campaign.status as keyof typeof CampaignStatus}>
          {campaign.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-gray-400">
        {campaign.scheduledAt
          ? new Date(campaign.scheduledAt).toLocaleDateString()
          : '—'}
      </td>
      <td className="px-4 py-3 text-gray-400">
        {new Date(campaign.createdAt).toLocaleDateString()}
      </td>
    </tr>
  )
}
