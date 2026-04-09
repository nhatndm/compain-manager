---
name: web-architecture
description: Folder structure and component conventions for apps/web (React + Tailwind). Use this whenever creating any React component, page, or UI element in the web app. Apply when someone asks where to put a component, how to structure a new page, whether something should be reusable, or how to style something. Always use this before writing any new .tsx file in the web app.
---

# Web Architecture

The web app lives at `apps/web/src/`. Components are split into three distinct layers — knowing which layer a component belongs to determines exactly where it lives.

## Folder Structure

```
apps/web/src/
├── main.tsx                          # Entry point
├── index.css                         # Global styles (Tailwind base)
├── routes/
│   └── index.tsx                     # React Router route definitions
├── app/
│   └── App.tsx                       # Root app shell (providers)
├── pages/                            # Page components (one per route)
│   └── campaigns/
│       └── CampaignsPage.tsx
├── smart-components/                 # Complex, stateful components (feature-specific)
│   └── campaigns/
│       └── CampaignTable.tsx
├── components/                       # Base reusable components (stateless/generic)
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Badge.tsx
├── store/                            # Redux store (one folder per model)
├── lib/
│   └── queryClient.ts                # React Query client
└── hooks/                            # Shared custom hooks
```

## The Three Component Layers

### 1. `components/` — Base components (reusable)

Generic, stateless, purely presentational. No business logic, no API calls, no Redux. Could theoretically be dropped into any project.

- Styled with **Tailwind CSS only** — no separate CSS files, no inline style objects
- Accept data and callbacks via props
- Named simply: `Button`, `Input`, `Badge`, `Modal`, `Table`

```tsx
// components/Button.tsx
type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  onClick?: () => void
  disabled?: boolean
}

export function Button({ children, variant = 'primary', onClick, disabled }: ButtonProps) {
  const base = 'px-4 py-2 rounded font-medium transition-colors'
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
```

### 2. `smart-components/` — Smart components (feature-specific, complex)

Components that are too complex or stateful for `components/` but not a full page. They may read from Redux, call hooks, or coordinate multiple base components. They are still **not pages** — they don't own routing.

- Organised in sub-folders by domain: `smart-components/campaigns/`, `smart-components/recipients/`
- Styled with **Tailwind CSS only**
- Can use Redux selectors and dispatch actions
- Can use React Query hooks via actions (see `web-api-integration` skill)

```tsx
// smart-components/campaigns/CampaignTable.tsx
import { useSelector } from 'react-redux'
import { selectAllCampaigns } from '../../store/campaigns/campaigns.selectors'
import { Badge } from '../../components/Badge'

export function CampaignTable() {
  const campaigns = useSelector(selectAllCampaigns)
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left">
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map(c => (
          <tr key={c.id} className="border-t">
            <td className="px-4 py-2">{c.name}</td>
            <td className="px-4 py-2"><Badge>{c.status}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### 3. `pages/` — Page components

One component per route. Their only job is to compose smart components and base components into a full layout. No business logic lives here.

- Always suffixed with `Page`: `CampaignsPage`, `CampaignDetailPage`
- Registered in `routes/index.tsx`
- Styled with **Tailwind CSS only**

```tsx
// pages/campaigns/CampaignsPage.tsx
import { CampaignTable } from '../../smart-components/campaigns/CampaignTable'
import { Button } from '../../components/Button'

export function CampaignsPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button>New Campaign</Button>
      </div>
      <CampaignTable />
    </div>
  )
}
```

Register the page in `routes/index.tsx`:
```tsx
{ path: '/campaigns', element: <CampaignsPage /> }
```

## Styling Rules

- **Tailwind CSS only** — never create separate `.css` files for components
- **No inline `style` objects** — use Tailwind classes instead
- The only CSS file is `src/index.css` (global Tailwind base/utilities)
- Use `clsx` or template literals to conditionally combine classes

## Quick Decision Guide

| Question | Answer |
|---|---|
| Could this component be reused in a different feature? | `components/` |
| Is it feature-specific and has state/data logic? | `smart-components/<domain>/` |
| Is it a full route/screen? | `pages/<domain>/` |
| Does it need a `.css` file? | No — use Tailwind |
