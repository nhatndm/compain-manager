import { createBrowserRouter } from 'react-router-dom'
import { App } from '../app/App'
import { LoginPage } from '../pages/auth/LoginPage'
import { SignUpPage } from '../pages/auth/SignUpPage'
import { ProtectedRoute } from '../components/ProtectedRoute'

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <App />,
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
