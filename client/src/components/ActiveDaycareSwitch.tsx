import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Daycare = { id: number; name: string };

const isAdminRole = (r?: string) => {
  const v = (r ?? "").toLowerCase();
  return v === "admin" || v === "system_admin" || v === "systemadmin";
};

export default function ActiveDaycareSwitch() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // who am I?
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => (await apiRequest("GET", "/api/auth/user")).json(),
    staleTime: 60_000,
  });

  // daycares I can access (scoped on server for non-admins)
  const { data: daycares } = useQuery<Daycare[]>({
    queryKey: ["/api/daycares"],
    queryFn: async () => (await apiRequest("GET", "/api/daycares")).json(),
    staleTime: 60_000,
    enabled: !!user, // wait until we know who we are
  });

  // hide for admins (they see all anyway) or when user has 0/1 daycare
  if (!user || isAdminRole(user.role) || !daycares || daycares.length <= 1) return null;

  const mutation = useMutation({
    mutationFn: async (daycareId: number) => {
      const res = await apiRequest("POST", "/api/auth/active-daycare", { daycareId });
      if (!res.ok) throw new Error("Failed to switch daycare");
    },
    onSuccess: async () => {
      // refresh user + any tenant-scoped data
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["/api/auth/user"] }),
        qc.invalidateQueries({ queryKey: ["/api/parents"] }),
        qc.invalidateQueries({ queryKey: ["/api/children"] }),
        qc.invalidateQueries({ queryKey: ["/api/payments"] }),
        qc.invalidateQueries({ queryKey: ["/api/alerts"] }),
      ]);
      toast({ title: "Switched daycare context" });
    },
  });

  const current = String(user.activeDaycareId ?? "");

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Daycare:</span>
      <Select
        value={current}
        onValueChange={(val) => mutation.mutate(Number(val))}
        disabled={mutation.isPending}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Select daycare" />
        </SelectTrigger>
        <SelectContent>
          {daycares.map((dc) => (
            <SelectItem key={dc.id} value={String(dc.id)}>
              {dc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
