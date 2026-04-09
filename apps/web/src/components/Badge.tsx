type BadgeVariant = 'draft' | 'scheduled' | 'sent'

const variantStyles: Record<BadgeVariant, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  sent: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

type BadgeProps = {
  variant: BadgeVariant
  children: React.ReactNode
}

export function Badge({ variant, children }: BadgeProps): JSX.Element {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${variantStyles[variant]}`}>
      {children}
    </span>
  )
}
