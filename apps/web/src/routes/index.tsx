import { createBrowserRouter } from 'react-router-dom'
import { App } from '../app/App'
import { LoginPage } from '../pages/auth/LoginPage'
import { SignUpPage } from '../pages/auth/SignUpPage'
import { CampaignDetailPage } from '../pages/campaigns/CampaignDetailPage'
import { ProtectedRoute } from '../components/ProtectedRoute'

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <App />,
      },
      {
        path: '/campaigns/:id',
        element: <CampaignDetailPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
])
