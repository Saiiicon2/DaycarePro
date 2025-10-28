import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type Daycare = { id: number; name: string };
export default function DaycareSelect({
  value,
  onChange,
  label = "Daycare *",
}: {
  value?: number | null;
  onChange: (id: number) => void;
  label?: string;
}) {
  const [items, setItems] = useState<Daycare[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", "/api/daycares");
        const data = await res.json();
        setItems(data || []);
      } catch {
        // ignore
      }
    })();
  }, []);
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="mt-1 block w-full border rounded p-2"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value="" disabled>Select a daycare…</option>
        {items.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
    </label>
  );
}
