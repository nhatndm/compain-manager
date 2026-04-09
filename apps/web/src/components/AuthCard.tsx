type AuthCardProps = {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AuthCard({ title, subtitle, children }: AuthCardProps): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Campaign Manager
          </h1>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
