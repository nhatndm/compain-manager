import { queryClient } from '../../lib/queryClient'
import { apiClient } from '../../lib/api'
import { AppDispatch } from '../index'
import { setLoading, setUser, setError, clearAuth } from './auth.slice'
import { AuthUser, LoginDto, SignupDto } from '@repo/schemas'

export const signup = (dto: SignupDto) => async (dispatch: AppDispatch): Promise<boolean> => {
  dispatch(setLoading(true))
  try {
    const user = await queryClient.fetchQuery({
      queryKey: ['auth', 'signup', dto.email],
      queryFn: () => apiClient.post<AuthUser>('/auth/signup', dto),
    })
    dispatch(setUser(user))
    return true
  } catch (err) {
    dispatch(setError(err instanceof Error ? err.message : 'Signup failed'))
    return false
  }
}

export const login = (dto: LoginDto) => async (dispatch: AppDispatch): Promise<boolean> => {
  dispatch(setLoading(true))
  try {
    const data = await queryClient.fetchQuery({
      queryKey: ['auth', 'login', dto.email],
      queryFn: () => apiClient.post<{ user: AuthUser }>('/auth/login', dto),
    })
    dispatch(setUser(data.user))
    return true
  } catch (err) {
    dispatch(setError(err instanceof Error ? err.message : 'Login failed'))
    return false
  }
}

export const logout = () => async (dispatch: AppDispatch): Promise<void> => {
  await apiClient.post('/auth/logout')
  queryClient.clear()
  dispatch(clearAuth())
}
