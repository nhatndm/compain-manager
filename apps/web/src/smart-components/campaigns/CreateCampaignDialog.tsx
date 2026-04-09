import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch } from 'react-redux'
import { CreateCampaignDto, CreateCampaignSchema } from '@repo/schemas'
import { AppDispatch } from '../../store'
import { createCampaign } from '../../store/campaigns/campaigns.actions'
import { Dialog } from '../../components/Dialog'
import { Input } from '../../components/Input'
import { Textarea } from '../../components/Textarea'
import { Button } from '../../components/Button'

const FormSchema = CreateCampaignSchema.pick({
  name: true,
  subject: true,
  body: true,
  recipients: true,
})

type FormValues = Pick<CreateCampaignDto, 'name' | 'subject' | 'body' | 'recipients'>

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
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: 'onTouched',
    defaultValues: { recipients: [{ name: '', email: '' }] },
  })

  // RHF's union type for field arrays doesn't narrow with optional chaining
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recipientError = (index: number, field: 'name' | 'email'): string =>
    (errors.recipients as any)?.[index]?.[field]?.message || ''

  const { fields, append, remove } = useFieldArray({ control, name: 'recipients' })

  const handleClose = () => {
    reset({ recipients: [{ name: '', email: '' }] })
    setApiError(null)
    onClose()
  }

  const onSubmit = async (data: FormValues) => {
    setApiError(null)
    try {
      await dispatch(createCampaign(data))
      reset({ recipients: [{ name: '', email: '' }] })
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

        {/* Recipients */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              Recipients
            </label>
            <button
              type="button"
              onClick={() => append({ name: '', email: '' })}
              className="text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              + Add recipient
            </button>
          </div>

          {errors.recipients?.root?.message && (
            <p className="text-xs text-red-400">{errors.recipients.root.message}</p>
          )}
          {typeof errors.recipients?.message === 'string' && (
            <p className="text-xs text-red-400">{errors.recipients.message}</p>
          )}

          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    label={index === 0 ? 'Name' : ''}
                    placeholder="Full name"
                    error={recipientError(index, 'name')}
                    {...register(`recipients.${index}.name`)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label={index === 0 ? 'Email' : ''}
                    placeholder="email@example.com"
                    type="email"
                    error={recipientError(index, 'email')}
                    {...register(`recipients.${index}.email`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="mt-[1.625rem] shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Remove recipient"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

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
