import { createSlice, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/lib/types";
import { api } from "./api";

export type AuthStatus = "unknown" | "authenticated" | "anonymous";

export type AuthState = {
  user: User | null;
  status: AuthStatus;
};

const initialState: AuthState = {
  user: null,
  status: "unknown",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedOut(state) {
      state.user = null;
      state.status = "anonymous";
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        isAnyOf(
          api.endpoints.me.matchFulfilled,
          api.endpoints.login.matchFulfilled,
          api.endpoints.signup.matchFulfilled,
        ),
        (state, action: PayloadAction<User>) => {
          state.user = action.payload;
          state.status = "authenticated";
        },
      )
      .addMatcher(api.endpoints.me.matchRejected, (state, action) => {
        // A rejection caused by `skip` or a duplicate subscription is not a
        // statement about the session.
        if (action.meta.condition) return;
        state.user = null;
        state.status = "anonymous";
      })
      .addMatcher(api.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.status = "anonymous";
      });
  },
});

export const { signedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
