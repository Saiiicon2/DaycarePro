import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function UsersPage() {
  const { user, isLoading } = useAuth();
  const qc = useQueryClient();
  const { data: users } = useQuery<any[]>({ queryKey: ["/api/users"], queryFn: getQueryFn({ on401: "throw" }) });
  const { data: daycares } = useQuery<any[]>({ queryKey: ["/api/daycares"], queryFn: getQueryFn({ on401: "throw" }) });

  const [form, setForm] = useState({ id: "", email: "", firstName: "", lastName: "", role: "staff", password: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [membershipsFilter, setMembershipsFilter] = useState<any[]>([]);
  const [membershipDaycareId, setMembershipDaycareId] = useState<number | null>(null);
  const [membershipRole, setMembershipRole] = useState<string>("daycare");

  if (isLoading) return null;
  if (!user) return <div>Please log in</div>;
  if (!(user.role === "admin" || user.role === "system_admin")) return <div>Unauthorized</div>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["/api/users"] });

  const { data: currentMemberships } = useQuery<any[]>({
    queryKey: ["/api/users", editing, "memberships"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!editing,
  });

  // keep local copy for quicker UI updates
  if (currentMemberships && JSON.stringify(currentMemberships) !== JSON.stringify(membershipsFilter)) {
    setMembershipsFilter(currentMemberships);
  }

  async function createUser(e: any) {
    e.preventDefault();
    try {
        const res = await apiRequest("POST", "/api/users", { email: form.email, firstName: form.firstName, lastName: form.lastName, role: form.role, password: form.password });
        // apiRequest throws for non-2xx, so if we get here it's ok
      setForm({ id: "", email: "", firstName: "", lastName: "", role: "staff", password: "" });
      refresh();
    } catch (err) {
      console.error("Create user failed", err);
      alert("Create user failed: " + String(err));
    }
  }

  async function updateUser(e: any) {
    e.preventDefault();
    try {
      if (!editing) return;
  const payload: any = { email: form.email, firstName: form.firstName, lastName: form.lastName, role: form.role };
  if (form.password) payload.password = form.password;
  await apiRequest("PUT", `/api/users/${editing}`, payload);
      setEditing(null);
      setForm({ id: "", email: "", firstName: "", lastName: "", role: "staff", password: "" });
      refresh();
    } catch (err) {
      console.error("Update user failed", err);
      alert("Update user failed: " + String(err));
    }
  }

  function startEdit(u: any) {
    setEditing(u.id);
    setForm({ id: u.id, email: u.email || "", firstName: u.firstName || "", lastName: u.lastName || "", role: u.role || "staff", password: "" });
  }

  async function addMembership(e: any) {
    e.preventDefault();
    if (!editing || !membershipDaycareId) return;
    try {
  await apiRequest("POST", `/api/users/${editing}/memberships`, { daycareId: membershipDaycareId, role: membershipRole });
      refresh();
      qc.invalidateQueries({ queryKey: ["/api/users", editing, "memberships"] });
    } catch (err) {
      console.error("Add membership failed", err);
      alert("Add membership failed: " + String(err));
    }
  }

  async function removeMembership(userId: string, daycareId: number) {
    try {
  await apiRequest("DELETE", `/api/users/${userId}/memberships/${daycareId}`);
      refresh();
      qc.invalidateQueries({ queryKey: ["/api/users", editing, "memberships"] });
    } catch (err) {
      console.error("Remove membership failed", err);
      alert("Remove membership failed: " + String(err));
    }
  }

  async function toggleMembershipActive(userId: string, daycareId: number, isActive: boolean) {
    try {
  await apiRequest("PUT", `/api/users/${userId}/memberships`, { daycareId, isActive: !isActive });
      refresh();
      qc.invalidateQueries({ queryKey: ["/api/users", editing, "memberships"] });
    } catch (err) {
      console.error("Toggle membership failed", err);
      alert("Toggle membership failed: " + String(err));
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 dark:text-white">Users</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 shadow rounded p-4">
          <h2 className="font-medium mb-2">Create / Edit</h2>
          <form onSubmit={editing ? updateUser : createUser} className="space-y-2">
            <div>
              <label className="block text-sm">Email</label>
              <input required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-700 rounded px-2 py-1 text-slate-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm">First name</label>
              <input value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-700 rounded px-2 py-1 text-slate-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm">Last name</label>
              <input value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} className="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-700 rounded px-2 py-1 text-slate-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm">Role</label>
              <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} className="w-full border rounded px-2 py-1">
                <option value="staff">staff</option>
                <option value="admin">admin</option>
                <option value="system_admin">system_admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Password (leave blank to keep)</label>
              <input value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">{editing ? "Update user" : "Create user"}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm({ id: "", email: "", firstName: "", lastName: "", role: "staff", password: "" }); }} className="btn">Cancel</button>}
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 shadow rounded p-4">
          <h2 className="font-medium mb-2">All users</h2>
          {!users || users.length === 0 ? (
            <div>No users found</div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr>
                  <th className="text-left">ID</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Name</th>
                  <th className="text-left">Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-t border-slate-200 dark:border-gray-700">
                    <td className="py-2">{u.id}</td>
                    <td className="dark:text-gray-100">{u.email}</td>
                    <td className="dark:text-gray-100">{u.firstName} {u.lastName}</td>
                    <td className="dark:text-gray-100">{u.role}</td>
                    <td className="py-2 text-right"><button onClick={() => startEdit(u)} className="text-sm text-blue-600 dark:text-blue-400">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
