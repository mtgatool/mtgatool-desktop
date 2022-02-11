/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialUsernames = {
  usernames: {} as Record<string, string>,
};

type Usernames = typeof initialUsernames;

const hoverSlice = createSlice({
  name: "usernames",
  initialState: initialUsernames,
  reducers: {
    setUsername: (
      state: Usernames,
      action: PayloadAction<{ pubKey: string; username: string }>
    ): void => {
      state.usernames[action.payload.pubKey] = action.payload.username;
    },
  },
});

export const { setUsername } = hoverSlice.actions;

export default hoverSlice;
