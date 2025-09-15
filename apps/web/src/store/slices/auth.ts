import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppSelector, RootState } from "..";
import {
  AuthRole,
  AuthStorage,
  getAuthFromStorage,
  setAuthToStorage,
  clearAuthStorage,
} from "../authStorage";

interface AuthState {
  username: string | null;
  role: AuthRole | null;
}

const initialStorage = getAuthFromStorage();
const initialState: AuthState = {
  username: initialStorage?.username ?? null,
  role: initialStorage?.role ?? null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state: AuthState,
      action: PayloadAction<{
        token: string;
        username: string;
        role: AuthRole;
      }>
    ) {
      state.username = action.payload.username;
      state.role = action.payload.role;
      setAuthToStorage({
        token: action.payload.token,
        username: state.username!,
        role: state.role!,
      });
    },
    logout(state: AuthState) {
      state.username = null;
      state.role = null;
      clearAuthStorage();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

// Custom selector hooks with explicit names
export const useAuthToken = () => getAuthFromStorage()?.token ?? null;
export const useAuthUsername = () =>
  useAppSelector((state: RootState) => state.auth.username);
export const useAuthRole = () =>
  useAppSelector((state: RootState) => state.auth.role);
