import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      // const res = await fetch("http://localhost:5000/api/auth/user", {
      //   credentials: "include", // ⬅️ VERY important
      // });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user`, {
  credentials: "include", // This is CRUCIAL for cookie/session auth
});

console.log("API URL:", import.meta.env.VITE_API_URL);

      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    retry: false,
  });

  return {
    user: data,
    isLoading,
    isAuthenticated: !!data,
    error,
  };
}
