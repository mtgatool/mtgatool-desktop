import { useEffect, useMemo, useRef, useState } from "react";
import { ToolDb } from "mtgatool-db";

export default function useDbUser(): [ToolDb["user"], boolean] {
  const userRef = useMemo(() => window.toolDb.user, []);
  const [loggedIn, setLoggedIn] = useState(!!window.toolDb.user);

  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!loggedIn) {
      intervalRef.current = setInterval(() => {
        if (window.toolDb.user) {
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
