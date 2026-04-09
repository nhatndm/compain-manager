import { Dialog } from './Dialog'
import { Button } from './Button'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
}: Props): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-6">
        <p className="text-sm text-gray-300">{message}</p>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
