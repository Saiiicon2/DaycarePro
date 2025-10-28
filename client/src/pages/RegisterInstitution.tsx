import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function RegisterInstitution() {
  const [, navigate] = useLocation();

  const [busy, setBusy] = useState(false);
  const [daycare, setDaycare] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",          // daycare’s contact email
    licenseNumber: "",
    capacity: "",
  });
  const [owner, setOwner] = useState({
    firstName: "",
    lastName: "",
    email: "",          // login email
    password: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      daycareName: daycare.name.trim(),
      address: daycare.address.trim(),
      daycareEmail: daycare.email.trim() || null,
      phone: daycare.phone.trim() || null,
      licenseNumber: daycare.licenseNumber.trim() || null,
      capacity: daycare.capacity ? Number(daycare.capacity) : null,

      firstName: owner.firstName.trim() || null,
      lastName: owner.lastName.trim() || null,
      email: owner.email.trim(),   // login email (required)
      password: owner.password,    // required
    };

    // minimal client-side checks
    if (!payload.daycareName || !payload.address || !payload.email || !payload.password) {
      alert("Please fill daycare name, address, owner email and password.");
      return;
    }

    setBusy(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register-daycare", payload);
      // success → session cookie set → go to dashboard
      navigate("/dashboard");
    } catch (e: any) {
      let msg = e?.message || "Registration failed";
      alert(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Register your institution</CardTitle>
          <CardDescription>Create a daycare and the first owner account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-8">
            {/* Daycare block */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Daycare details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Daycare name"
                  value={daycare.name}
                  onChange={(e) => setDaycare((d) => ({ ...d, name: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Address"
                  value={daycare.address}
                  onChange={(e) => setDaycare((d) => ({ ...d, address: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Daycare contact email (optional)"
                  type="email"
                  value={daycare.email}
                  onChange={(e) => setDaycare((d) => ({ ...d, email: e.target.value }))}
                />
                <Input
                  placeholder="Phone (optional)"
                  value={daycare.phone}
                  onChange={(e) => setDaycare((d) => ({ ...d, phone: e.target.value }))}
                />
                <Input
                  placeholder="License number (optional)"
                  value={daycare.licenseNumber}
                  onChange={(e) => setDaycare((d) => ({ ...d, licenseNumber: e.target.value }))}
                />
                <Input
                  placeholder="Capacity (optional)"
                  type="number"
                  value={daycare.capacity}
                  onChange={(e) => setDaycare((d) => ({ ...d, capacity: e.target.value }))}
                />
              </div>
            </section>

            {/* Owner block */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Owner account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="First name (optional)"
                  value={owner.firstName}
                  onChange={(e) => setOwner((o) => ({ ...o, firstName: e.target.value }))}
                />
                <Input
                  placeholder="Last name (optional)"
                  value={owner.lastName}
                  onChange={(e) => setOwner((o) => ({ ...o, lastName: e.target.value }))}
                />
                <Input
                  placeholder="Owner email (login)"
                  type="email"
                  value={owner.email}
                  onChange={(e) => setOwner((o) => ({ ...o, email: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={owner.password}
                  onChange={(e) => setOwner((o) => ({ ...o, password: e.target.value }))}
                  required
                />
              </div>
            </section>

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating..." : "Create daycare & account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
