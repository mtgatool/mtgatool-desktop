import { ToolDb } from "mtgatool-db";
import { useEffect, useMemo, useRef, useState } from "react";

export default function useDbUser(): [ToolDb["user"], boolean] {
  const userRef = useMemo(() => window.toolDb.user, []);
  const [loggedIn, setLoggedIn] = useState(!!window.toolDb.user);

  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!loggedIn) {
      intervalRef.current = setInterval(() => {
        if (window.toolDb.user) {
          setLoggedIn(true);
          clearInterval(intervalRef.current as any);
          intervalRef.current = undefined;
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loggedIn, intervalRef, userRef]);

  return [userRef, loggedIn];
}
