import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Campaign, CreateCampaignSchema, CreateCampaignDto } from '@repo/schemas'
import { apiClient } from '../../lib/api'
import { Dialog } from '../../components/Dialog'
import { Input } from '../../components/Input'
import { Textarea } from '../../components/Textarea'
import { Button } from '../../components/Button'

const FormSchema = CreateCampaignSchema.pick({ name: true, subject: true, body: true })

type FormValues = Pick<CreateCampaignDto, 'name' | 'subject' | 'body'>

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  campaign: Campaign
}

export function EditCampaignDialog({ open, onClose, onSuccess, campaign }: Props): JSX.Element {
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  })

  useEffect(() => {
    if (open) {
      reset({ name: campaign.name, subject: campaign.subject, body: campaign.body })
      setApiError(null)
    }
  }, [open, campaign, reset])

  const handleClose = () => {
    reset()
    setApiError(null)
    onClose()
  }

  const onSubmit = async (data: FormValues) => {
    setApiError(null)
    try {
      await apiClient.patch(`/campaigns/${campaign.id}`, data)
      onSuccess()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to update campaign')
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Edit Campaign">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Campaign Name"
          error={errors.name?.message || ''}
          {...register('name')}
        />
        <Input
          label="Email Subject"
          error={errors.subject?.message || ''}
          {...register('subject')}
        />
        <Textarea
          label="Email Body"
          error={errors.body?.message || ''}
          {...register('body')}
        />

        {apiError && (
          <p className="rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">{apiError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
