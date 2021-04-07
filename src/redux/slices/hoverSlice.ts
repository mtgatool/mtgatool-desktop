/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialHover = {
  grpId: 0,
  opacity: 0,
};

type Hover = typeof initialHover;

const hoverSlice = createSlice({
  name: "hover",
  initialState: {
    grpId: 0,
    opacity: 0,
  },
  reducers: {
    setHoverIn: (
      state: Hover,
      action: PayloadAction<{ grpId: number }>
    ): void => {
      const { grpId } = action.payload;
      Object.assign(state, {
        grpId: grpId,
        opacity: 1,
      });
    },
    setHoverOut: (
      state: Hover,
      _action: PayloadAction<{ grpId?: number }>
    ): void => {
      state.opacity = 0;
    },
  },
});

export const { setHoverIn, setHoverOut } = hoverSlice.actions;

export default hoverSlice;
