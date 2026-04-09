import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch } from 'react-redux'
import { CreateCampaignDto, CreateCampaignSchema } from '@repo/schemas'
import { AppDispatch } from '../../store'
import { createCampaign } from '../../store/campaigns/campaigns.actions'
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
}

export function CreateCampaignDialog({ open, onClose, onSuccess }: Props): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  })

  const handleClose = () => {
    reset()
    setApiError(null)
    onClose()
  }

  const onSubmit = async (data: FormValues) => {
    setApiError(null)
    try {
      await dispatch(createCampaign(data))
      reset()
      onSuccess()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to create campaign')
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Create Campaign">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Campaign Name"
          placeholder="e.g. Summer Sale Newsletter"
          error={errors.name?.message || ''}
          {...register('name')}
        />
        <Input
          label="Email Subject"
          placeholder="e.g. Don't miss our summer deals!"
          error={errors.subject?.message || ''}
          {...register('subject')}
        />
        <Textarea
          label="Email Body"
          placeholder="Write your email content here..."
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
            Create Campaign
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
