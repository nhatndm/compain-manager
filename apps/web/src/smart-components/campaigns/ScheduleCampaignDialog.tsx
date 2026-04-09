import { forwardRef, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useDispatch, useSelector } from 'react-redux'
import { Campaign } from '@repo/schemas'
import { AppDispatch } from '../../store'
import { scheduleCampaign } from '../../store/campaigns/campaigns.actions'
import { selectCampaignMutationError } from '../../store/campaigns/campaigns.selectors'
import { Dialog } from '../../components/Dialog'
import { Button } from '../../components/Button'

const DateInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ value, onClick }, ref) => (
    <input
      ref={ref}
      value={value as string}
      onClick={onClick}
      readOnly
      placeholder="Select date and time"
      className="w-full cursor-pointer rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-400"
    />
  ),
)
DateInput.displayName = 'DateInput'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  campaign: Campaign
}

export function ScheduleCampaignDialog({ open, onClose, onSuccess, campaign }: Props): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const apiError = useSelector(selectCampaignMutationError)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setDateError(null)
      setSelectedDate(campaign.scheduledAt ? new Date(campaign.scheduledAt) : null)
    }
  }, [open, campaign.scheduledAt])

  const handleSubmit = async () => {
    if (!selectedDate) {
      setDateError('Please select a date and time')
      return
    }
    setDateError(null)
    setIsSubmitting(true)
    const ok = await dispatch(scheduleCampaign(campaign.id, selectedDate.toISOString()))
    setIsSubmitting(false)
    if (ok) onSuccess()
  }

  const isRescheduling = campaign.status === 'scheduled'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isRescheduling ? 'Reschedule Campaign' : 'Schedule Campaign'}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Date &amp; Time</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => {
              setSelectedDate(date)
              setDateError(null)
            }}
            showTimeSelect
            timeIntervals={15}
            dateFormat="MMM d, yyyy h:mm aa"
            minDate={new Date()}
            customInput={<DateInput />}
            wrapperClassName="w-full"
            popperPlacement="bottom-start"
          />
          {dateError && <p className="text-xs text-red-400">{dateError}</p>}
        </div>

        {apiError && (
          <p className="rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">{apiError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={handleSubmit} className="flex-1">
            {isRescheduling ? 'Reschedule' : 'Schedule'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
