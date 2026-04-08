import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../index'

export const selectAuthState = (state: RootState) => state.auth

export const selectCurrentUser = createSelector(
  selectAuthState,
  (auth) => auth.user,
)

export const selectAuthLoading = createSelector(
  selectAuthState,
  (auth) => auth.loading,
)

export const selectAuthError = createSelector(
  selectAuthState,
  (auth) => auth.error,
)

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (auth) => auth.user !== null,
)
