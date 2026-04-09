import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '../store'
import { logout } from '../store/auth/auth.actions'
import { selectCurrentUser } from '../store/auth/auth.selectors'

type AppLayoutProps = {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector(selectCurrentUser)

  const handleLogout = (): void => {
    dispatch(logout())
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Topbar */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <span className="text-lg font-bold text-white">Compain Manager</span>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}
