import GUN from "gun";
import Gun from "gun/gun";
import Sea from "gun/sea";
import "gun/lib/then";
import "gun/lib/open";
// eslint-disable-next-line import/no-unresolved
import { IGunChainReference } from "gun/types/chain";
// eslint-disable-next-line import/no-unresolved
import { IGunStaticSEA } from "gun/types/static/sea";
import { useMemo } from "react";
import { GunState } from "../types/gunTypes";

declare global {
  interface Window {
    SEA: IGunStaticSEA;
    gun: IGunChainReference<GunState>;
  }
}

export function useSea() {
  const sea: typeof GUN.SEA = useMemo(() => {
    return window.SEA ?? Sea;
  }, []);

  window.SEA = sea;

  return sea;
}

export function useGun() {
  const gun: IGunChainReference<GunState> = useMemo(() => {
    return (
      window.gun ??
      Gun<GunState>([
        "http://api.mtgatool.com:8765/gun",
        "mtgatool-gun-eqszq.ondigitalocean.app:8765/gun",
      ])
    );
  }, []);

  window.gun = gun;

  return gun;
}
