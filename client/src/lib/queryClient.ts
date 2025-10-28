import { QueryClient, QueryFunction } from "@tanstack/react-query";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/** If url is a path, prefix BASE_URL; if it’s already absolute, leave it. */
function toAbsoluteUrl(url: string) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // try to parse JSON { message } for friendlier errors, fall back to raw text
    try {
      const text = await res.text();
      try {
        const json = text ? JSON.parse(text) : null;
        const message = json?.message ?? (typeof json === 'string' ? json : undefined);
        throw new Error(`${res.status}: ${message ?? text ?? res.statusText}`);
      } catch (e) {
        // text was not JSON
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
    } catch (e) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  const res = await fetch(toAbsoluteUrl(url), {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(extraHeaders ?? {}),
    },
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/** Default fetcher for useQuery: works with full URLs or paths. */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401 }) =>
  async ({ queryKey, signal }) => {
    const raw = String(queryKey[0] ?? "");
    const url = toAbsoluteUrl(raw);

    const res = await fetch(url, {
      credentials: "include",
      signal,
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    // Some endpoints might 204; guard just in case
    const text = await res.text();
    return (text ? JSON.parse(text) : null) as any;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
