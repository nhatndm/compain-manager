import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from '../store/index'
import { queryClient } from '../lib/queryClient'
import { App } from './App'

describe('App', () => {
  it('renders the heading', () => {
    render(
      <MemoryRouter>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </Provider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Compain Manager')).toBeDefined()
  })
})
