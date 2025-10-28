import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const r = await apiRequest("GET", "/api/auth/user");
        setUser(await r.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return { user, loading };
}