import { forwardRef, TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={5}
          className={[
            'w-full resize-none rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors',
            'bg-white text-gray-900 placeholder-gray-400',
            'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
            error
              ? 'border-red-500 focus:border-red-500 dark:border-red-500'
              : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600 dark:focus:border-indigo-400',
          ].join(' ')}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
