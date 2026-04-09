import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/index'
import './index.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { store } from './store'
import { Provider } from 'react-redux'
import { initAuth } from './store/auth/auth.actions'

// Enable dark mode globally
document.documentElement.classList.add('dark')

// Rehydrate auth state from existing cookie before rendering
store.dispatch(initAuth())

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
