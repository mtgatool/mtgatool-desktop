/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialAvatars = {
  avatars: {} as Record<string, string>,
};

type Avatars = typeof initialAvatars;

const hoverSlice = createSlice({
  name: "avatars",
  initialState: initialAvatars,
  reducers: {
    setAvatar: (
      state: Avatars,
      action: PayloadAction<{ pubKey: string; avatar: string }>
    ): void => {
      state.avatars[action.payload.pubKey] = action.payload.avatar;
    },
  },
});

export const { setAvatar } = hoverSlice.actions;

export default hoverSlice;
