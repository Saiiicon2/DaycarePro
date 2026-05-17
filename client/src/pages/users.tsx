import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Trash2, Edit2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isLoading) return null;
  if (!user) return <div className="p-6">Please log in</div>;
  if (!(user.role === "admin" || user.role === "system_admin")) return <div className="p-6">Unauthorized</div>;

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

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  async function createUser(e: any) {
    e.preventDefault();
    try {
      const res = await apiRequest("POST", "/api/users", { email: form.email, firstName: form.firstName, lastName: form.lastName, role: form.role, password: form.password });
      setForm({ id: "", email: "", firstName: "", lastName: "", role: "staff", password: "" });
      showMessage("User created successfully");
      refresh();
    } catch (err) {
      console.error("Create user failed", err);
      showMessage("Failed to create user: " + String(err), true);
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
      showMessage("User updated successfully");
      refresh();
    } catch (err) {
      console.error("Update user failed", err);
      showMessage("Failed to update user: " + String(err), true);
    }
  }

  function startEdit(u: any) {
    setError(null);
    setSuccessMessage(null);
    setEditing(u.id);
    setForm({ id: u.id, email: u.email || "", firstName: u.firstName || "", lastName: u.lastName || "", role: u.role || "staff", password: "" });
  }

  async function addMembership(e: any) {
    e.preventDefault();
    if (!editing || !membershipDaycareId) return;
    try {
      await apiRequest("POST", `/api/users/${editing}/memberships`, { daycareId: membershipDaycareId, role: membershipRole });
      showMessage("Membership added successfully");
      refresh();
      qc.invalidateQueries({ queryKey: ["/api/users", editing, "memberships"] });
    } catch (err) {
      console.error("Add membership failed", err);
      showMessage("Failed to add membership: " + String(err), true);
    }
  }

  async function removeMembership(userId: string, daycareId: number) {
    try {
      await apiRequest("DELETE", `/api/users/${userId}/memberships/${daycareId}`);
      showMessage("Membership removed successfully");
      refresh();
      qc.invalidateQueries({ queryKey: ["/api/users", editing, "memberships"] });
    } catch (err) {
      console.error("Remove membership failed", err);
      showMessage("Failed to remove membership: " + String(err), true);
    }
  }

  async function toggleMembershipActive(userId: string, daycareId: number, isActive: boolean) {
    try {
      await apiRequest("PUT", `/api/users/${userId}/memberships`, { daycareId, isActive: !isActive });
      showMessage("Membership status updated");
      refresh();
      qc.invalidateQueries({ queryKey: ["/api/users", editing, "memberships"] });
    } catch (err) {
      console.error("Toggle membership failed", err);
      showMessage("Failed to update membership: " + String(err), true);
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "system_admin":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-lg text-slate-600 dark:text-gray-400">Manage system users and their roles</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="border-red-300 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <AlertDescription className="text-green-700 dark:text-green-400">{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{editing ? "Edit User" : "Create New User"}</CardTitle>
                <CardDescription>
                  {editing ? "Update user profile and roles" : "Add a new system user"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editing ? updateUser : createUser} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Email *</label>
                    <Input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="user@example.com"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">First Name</label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                      placeholder="John"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Last Name</label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                      placeholder="Doe"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 text-sm"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="system_admin">System Admin</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      Password {editing && "(leave blank to keep)"}
                    </label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={editing ? "••••••••" : "Enter password"}
                      className="h-10"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1">
                      {editing ? "Update User" : "Create User"}
                    </Button>
                    {editing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(null);
                          setForm({ id: "", email: "", firstName: "", lastName: "", role: "staff", password: "" });
                          setError(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Users List Section */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {users ? `${users.length} user${users.length !== 1 ? "s" : ""} in the system` : "Loading..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!users || users.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-gray-400">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-gray-100">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-gray-100">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-gray-100">Role</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-gray-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u: any) => (
                          <tr
                            key={u.id}
                            className="border-b border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="py-3 px-4 text-slate-900 dark:text-gray-100">{u.email}</td>
                            <td className="py-3 px-4 text-slate-900 dark:text-gray-100">
                              {u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : "—"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={getRoleBadgeVariant(u.role)} className="capitalize">
                                {u.role.replace(/_/g, " ")}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(u)}
                                className="hover:bg-blue-50 dark:hover:bg-blue-950/20"
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Memberships Section */}
        {editing && (
          <Card>
            <CardHeader>
              <CardTitle>Daycare Memberships</CardTitle>
              <CardDescription>
                Manage which daycares this user has access to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Membership Form */}
              <form onSubmit={addMembership} className="space-y-4 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Add New Membership</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Daycare</label>
                    <select
                      value={membershipDaycareId || ""}
                      onChange={(e) => setMembershipDaycareId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 text-sm"
                    >
                      <option value="">Select a daycare...</option>
                      {daycares?.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Role</label>
                    <select
                      value={membershipRole}
                      onChange={(e) => setMembershipRole(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 text-sm"
                    >
                      <option value="daycare">Daycare Admin</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Membership
                </Button>
              </form>

              {/* Current Memberships */}
              {membershipsFilter && membershipsFilter.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Current Memberships</h3>
                  {membershipsFilter.map((m: any) => (
                    <div
                      key={m.daycareId}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{m.name || `Daycare #${m.daycareId}`}</p>
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          Role: <Badge variant="secondary" className="ml-2 capitalize inline">{m.role}</Badge>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMembershipActive(form.id, m.daycareId, m.isActive)}
                          className={m.isActive ? "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/20" : "border-slate-300 text-slate-600"}
                        >
                          {m.isActive ? "Active" : "Inactive"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMembership(form.id, m.daycareId)}
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-gray-400">
                  No memberships yet
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
