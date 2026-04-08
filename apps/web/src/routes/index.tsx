import { createBrowserRouter } from 'react-router-dom'
import { App } from '../app/App'

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
])
