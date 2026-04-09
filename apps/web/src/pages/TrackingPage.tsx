import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { AppDispatch } from '../store'
import { trackOpen } from '../store/campaigns/campaigns.actions'
import { selectTrackingState } from '../store/campaigns/campaigns.selectors'

export function TrackingPage(): JSX.Element {
  const { tracking_token } = useParams<{ tracking_token: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const trackingState = useSelector(selectTrackingState)

  useEffect(() => {
    if (tracking_token) dispatch(trackOpen(tracking_token))
  }, [tracking_token, dispatch])

  if (trackingState === 'loading' || trackingState === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (trackingState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <p className="text-sm text-gray-500">This link is invalid or has expired.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600">
          <svg className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Thank you for joining our campaign!</h1>
        <p className="text-sm text-gray-400">You're all set. We'll be in touch soon.</p>
      </div>
    </div>
  )
}
