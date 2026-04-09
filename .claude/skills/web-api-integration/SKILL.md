---
name: web-api-integration
description: API integration pattern for apps/web using React Query + Redux. Use this whenever calling a backend API endpoint from the web app, fetching or mutating data, or wiring up a React Query call to the Redux store. Always apply when writing anything in a store actions file, or when someone asks how to call an API, fetch a list, submit a form, or sync server data into Redux.
---

# API Integration

All API calls use **React Query** (`@tanstack/react-query`). They live exclusively in the **actions file** of the relevant Redux store folder — not in components, not in hooks, not in services. After the data arrives, the action dispatches to update the Redux store.

## The Pattern

```
Component dispatches action
  → Action calls React Query (queryClient)
    → React Query fetches from API
      → Action dispatches result to Redux slice
        → Component reads from Redux via selector
```

Components never call React Query directly. They dispatch actions and read from selectors.

## Setup

The shared `queryClient` lives at `apps/web/src/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      retry: 1,
    },
  },
})
```

## Fetching Data (GET)

Use `queryClient.fetchQuery` inside the thunk action:

```ts
// store/campaigns/campaigns.actions.ts
import { queryClient } from '../../lib/queryClient'
import { AppDispatch } from '../index'
import { setLoading, setCampaigns, setError } from './campaigns.slice'
import { Campaign } from '@repo/schemas'

export const fetchCampaigns = (page = 1, limit = 20) => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true))
  try {
    const data = await queryClient.fetchQuery({
      queryKey: ['campaigns', page, limit],
      queryFn: async () => {
        const res = await fetch(`/api/campaigns?page=${page}&limit=${limit}`)
        if (!res.ok) throw new Error('Failed to fetch campaigns')
        return res.json() as Promise<{ data: Campaign[]; total: number }>
      },
    })
    dispatch(setCampaigns(data.data))
  } catch (err) {
    dispatch(setError(err instanceof Error ? err.message : 'Unknown error'))
  }
}
```

## Mutating Data (POST / PATCH / DELETE)

Use `queryClient.getMutationCache` or simply `fetch` directly inside the thunk, then invalidate the relevant query cache and update the store:

```ts
// store/campaigns/campaigns.actions.ts
import { CreateCampaignDto, Campaign } from '@repo/schemas'
import { addCampaign, setError } from './campaigns.slice'

export const createCampaign = (dto: CreateCampaignDto) => async (dispatch: AppDispatch) => {
  try {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    if (!res.ok) throw new Error('Failed to create campaign')

    const campaign = await res.json() as Campaign

    // Update Redux store
    dispatch(addCampaign(campaign))

    // Invalidate cached list so next fetch is fresh
    await queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  } catch (err) {
    dispatch(setError(err instanceof Error ? err.message : 'Unknown error'))
  }
}
```

## Query Keys Convention

Use consistent, hierarchical query keys so invalidation is predictable:

```ts
['campaigns']                      // all campaigns
['campaigns', page, limit]         // paginated list
['campaigns', id]                  // single campaign
['recipients']                     // all recipients
['recipients', campaignId]         // recipients for a campaign
```

## Using in Components

Components dispatch the action and read the result from the selector — they never touch `queryClient` directly:

```tsx
// smart-components/campaigns/CampaignTable.tsx
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCampaigns } from '../../store/campaigns'
import { selectAllCampaigns, selectCampaignsLoading } from '../../store/campaigns'
import { AppDispatch } from '../../store'

export function CampaignTable() {
  const dispatch = useDispatch<AppDispatch>()
  const campaigns = useSelector(selectAllCampaigns)
  const loading = useSelector(selectCampaignsLoading)

  useEffect(() => {
    dispatch(fetchCampaigns())
  }, [dispatch])

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    // render campaigns from Redux store
  )
}
```

## Where Each Piece Lives

| Concern | Location |
|---|---|
| `queryClient` instance | `lib/queryClient.ts` |
| API fetch / mutation logic | `store/<model>/<model>.actions.ts` |
| Dispatching results to store | `store/<model>/<model>.actions.ts` |
| State shape & reducers | `store/<model>/<model>.slice.ts` |
| Reading state in components | via selectors from `store/<model>/<model>.selectors.ts` |
| Calling API from components | ❌ Never — dispatch an action instead |
| Using `useQuery`/`useMutation` in components | ❌ Never — keep React Query inside actions |
