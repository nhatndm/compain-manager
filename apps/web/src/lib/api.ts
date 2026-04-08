type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type ApiOptions = {
  method?: HttpMethod
  body?: unknown
  credentials?: RequestCredentials
}

type ApiResponse<T> = Promise<T>

async function api<T>(path: string, options: ApiOptions = {}): ApiResponse<T> {
  const { method = 'GET', body, credentials = 'include' } = options

  const res = await fetch(`/api${path}`, {
    method,
    credentials,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(err.message ?? `Request failed with status ${res.status}`)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) =>
    api<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'POST', body }),

  patch: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string) =>
    api<T>(path, { method: 'DELETE' }),
}
