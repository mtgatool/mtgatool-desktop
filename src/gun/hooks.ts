import GUN from "gun";
import Gun from "gun/gun";
import Sea from "gun/sea";
import { useMemo } from "react";

declare global {
  interface Window {
    SEA: typeof GUN.SEA;
    gun: typeof GUN.chain;
  }
}

export function useSea() {
  const sea: typeof GUN.SEA = useMemo(() => {
    return !window.SEA ? Sea : window.SEA;
  }, []);

  window.SEA = sea;

  return sea;
}

export function useGun() {
  const gun: typeof GUN.chain = useMemo(() => {
    return !window.gun ? Gun("http://api.mtgatool.com:8765/gun") : window.gun;
  }, []);

  window.gun = gun;

  return gun;
}
