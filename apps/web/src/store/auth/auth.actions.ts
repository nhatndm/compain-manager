import { queryClient } from '../../lib/queryClient'
import { apiClient } from '../../lib/api'
import { AppDispatch } from '../index'
import { setLoading, setUser, setError, clearAuth } from './auth.slice'
import { LoginDto, MeResponse, SignupDto } from '@repo/schemas'

export const signup = (dto: SignupDto) => async (dispatch: AppDispatch): Promise<boolean> => {
  dispatch(setLoading(true))
  try {
    await queryClient.fetchQuery({
      queryKey: ['auth', 'signup', dto.email],
      queryFn: () => apiClient.post('/auth/signup', dto),
    })
    return true
  } catch (err) {
    dispatch(setError(err instanceof Error ? err.message : 'Signup failed'))
    return false
  } finally {
    dispatch(setLoading(false))
  }
}

export const login = (dto: LoginDto) => async (dispatch: AppDispatch): Promise<boolean> => {
  dispatch(setLoading(true))
  try {
    await queryClient.fetchQuery({
      queryKey: ['auth', 'login', dto.email],
      queryFn: () => apiClient.post('/auth/login', dto),
    })
    const user = await apiClient.get<MeResponse>('/auth/me')
    dispatch(setUser(user))
    return true
  } catch (err) {
    dispatch(setError(err instanceof Error ? err.message : 'Login failed'))
    return false
  } finally {
    dispatch(setLoading(false))
  }
}

export const logout = () => async (dispatch: AppDispatch): Promise<void> => {
  await apiClient.post('/auth/logout')
  queryClient.clear()
  dispatch(clearAuth())
}

export const initAuth = () => async (dispatch: AppDispatch): Promise<void> => {
  dispatch(setLoading(true))
  try {
    const user = await apiClient.get<MeResponse>('/auth/me')
    dispatch(setUser(user))
  } catch {
    // No valid session — stay logged out, clear loading
    dispatch(setUser(null))
  }
}
