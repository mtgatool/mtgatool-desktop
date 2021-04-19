import { useEffect, useMemo, useRef, useState } from "react";
import { GunUserChain } from "../types/gunTypes";

export default function useGunUser(): [GunUserChain, boolean] {
  const userRef = useMemo(() => window.gun.user() as GunUserChain, []);
  const [loggedIn, setLoggedIn] = useState(!!(userRef as any).is || false);

  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!loggedIn) {
      intervalRef.current = setInterval(() => {
        if ((userRef as any).is) {
          setLoggedIn(true);
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loggedIn, intervalRef, userRef]);

  return [userRef, loggedIn];
}
