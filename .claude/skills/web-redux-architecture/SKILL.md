---
name: web-redux-architecture
description: Redux store structure for apps/web. Use this whenever adding a new model to the Redux store, creating selectors, slices, reducers, or actions for any domain in the web app. Apply when someone asks how to manage state for a new feature, where to put Redux logic, or how to structure the store for a new schema from @repo/schemas. Always use this before writing any Redux-related file.
---

# Redux Architecture

The store lives at `apps/web/src/store/`. Each model from `@repo/schemas` gets its own folder inside `store/`, containing exactly four files: slice, actions, selectors, and an index barrel.

## Folder Structure

```
apps/web/src/store/
├── index.ts                          # Root store — combines all reducers
└── campaigns/                        # One folder per model
    ├── campaigns.slice.ts            # RTK slice (state shape + reducers)
    ├── campaigns.actions.ts          # Thunks + React Query calls
    ├── campaigns.selectors.ts        # Memoized selectors
    └── index.ts                      # Barrel export
```

## The Four Files

### 1. `<model>.slice.ts` — State shape + reducers

Define the state shape and synchronous reducers using Redux Toolkit's `createSlice`. The slice owns the shape of its state — nothing else should mutate it.

```ts
// store/campaigns/campaigns.slice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Campaign } from '@repo/schemas'

type CampaignsState = {
  items: Campaign[]
  selectedId: string | null
  loading: boolean
  error: string | null
}

const initialState: CampaignsState = {
  items: [],
  selectedId: null,
  loading: false,
  error: null,
}

export const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setCampaigns(state, action: PayloadAction<Campaign[]>) {
      state.items = action.payload
      state.loading = false
      state.error = null
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload
      state.loading = false
    },
    selectCampaign(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload
    },
  },
})

export const { setLoading, setCampaigns, setError, selectCampaign } = campaignsSlice.actions
export default campaignsSlice.reducer
```

### 2. `<model>.actions.ts` — Thunks + API calls

All React Query calls happen here (see `web-api-integration` skill). Actions are thunks that call the API via React Query, then dispatch to update the store.

```ts
// store/campaigns/campaigns.actions.ts
import type { AppDispatch } from '../index'
import { setLoading, setCampaigns, setError } from './campaigns.slice'

export const fetchCampaigns = () => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true))
  try {
    // React Query fetch lives here — see web-api-integration skill
  } catch (err) {
    dispatch(setError(err instanceof Error ? err.message : 'Unknown error'))
  }
}
```

### 3. `<model>.selectors.ts` — Selectors

All state access from components goes through selectors — never access `state.campaigns.items` directly in a component. Use `createSelector` for derived/computed values.

```ts
// store/campaigns/campaigns.selectors.ts
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../index'

export const selectCampaignsState = (state: RootState) => state.campaigns

export const selectAllCampaigns = createSelector(
  selectCampaignsState,
  (campaigns) => campaigns.items,
)

export const selectCampaignsLoading = createSelector(
  selectCampaignsState,
  (campaigns) => campaigns.loading,
)

export const selectCampaignsError = createSelector(
  selectCampaignsState,
  (campaigns) => campaigns.error,
)

export const selectSelectedCampaign = createSelector(
  selectCampaignsState,
  (campaigns) => campaigns.items.find(c => c.id === campaigns.selectedId) ?? null,
)
```

### 4. `index.ts` — Barrel export

```ts
// store/campaigns/index.ts
export * from './campaigns.slice'
export * from './campaigns.actions'
export * from './campaigns.selectors'
```

## Registering in the Root Store

After creating a new slice, add its reducer to `store/index.ts`:

```ts
// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import campaignsReducer from './campaigns/campaigns.slice'

export const store = configureStore({
  reducer: {
    campaigns: campaignsReducer,
    // add new reducers here
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

## Using in Components

```tsx
import { useSelector, useDispatch } from 'react-redux'
import { selectAllCampaigns, selectCampaignsLoading } from '../../store/campaigns'
import { fetchCampaigns } from '../../store/campaigns'
import type { AppDispatch } from '../../store'

export function CampaignTable() {
  const dispatch = useDispatch<AppDispatch>()
  const campaigns = useSelector(selectAllCampaigns)
  const loading = useSelector(selectCampaignsLoading)

  useEffect(() => {
    dispatch(fetchCampaigns())
  }, [dispatch])

  if (loading) return <p>Loading...</p>
  // ...
}
```

## One Folder Per Schema Model

Every model in `@repo/schemas` that needs client-side state gets its own store folder:

| Schema model | Store folder |
|---|---|
| `User` | `store/users/` |
| `Campaign` | `store/campaigns/` |
| `Recipient` | `store/recipients/` |
