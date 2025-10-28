import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const isAdminRole = (r?: string) => {
  const v = (r ?? "").toLowerCase();
  return v === "admin" || v === "system_admin" || v === "systemadmin";
};

const parentFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  // Only required in UI when admin; server also validates
  daycareId: z.number().optional(),
});

type ParentFormData = z.infer<typeof parentFormSchema>;
type Daycare = { id: number; name: string };

interface ParentFormProps {
  user?: { role?: string; activeDaycareId?: number | null };
  onSubmit: (data: ParentFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ParentForm({ user, onSubmit, onCancel, isLoading }: ParentFormProps) {
  const isAdmin = isAdminRole(user?.role);

  // Admins can see/choose any daycare (backend scopes non-admins automatically)
  const { data: daycareOptions = [], isLoading: daycaresLoading } = useQuery({
    enabled: isAdmin,
    queryKey: ["/api/daycares"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/daycares");
      if (!res.ok) throw new Error("Failed to load daycares");
      return res.json() as Promise<Daycare[]>;
    },
    staleTime: 60_000,
  });

  const form = useForm<ParentFormData>({
    resolver: zodResolver(parentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      emergencyContact: "",
      notes: "",
      daycareId: undefined, // admin must pick; owners/staff will not send this
    },
  });

  const handleSubmit = (data: ParentFormData) => {
    // Admins must choose a daycare explicitly
    if (isAdmin && !data.daycareId) {
      form.setError("daycareId", { type: "manual", message: "Please select a daycare" });
      return;
    }

    // For non-admins, rely on server-side scoping (activeDaycareId via session/membership)
    // but we also attach it explicitly to be clear (optional)
    const payload: ParentFormData = isAdmin
      ? data
      : { ...data, daycareId: user?.activeDaycareId ?? undefined };

    onSubmit(payload);
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Register New Parent</span>
          </DialogTitle>
          <DialogDescription>
            Add a new parent to your daycare. Admins must select which daycare the parent belongs to.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {isAdmin ? (
              <FormField
                control={form.control}
                name="daycareId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daycare *</FormLabel>
                    <FormControl>
                      <select
                        className="mt-1 block w-full border rounded p-2"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                        disabled={daycaresLoading}
                      >
                        <option value="" disabled>
                          {daycaresLoading ? "Loading daycares…" : "Select a daycare…"}
                        </option>
                        {daycareOptions.map((dc) => (
                          <option key={dc.id} value={dc.id}>
                            {dc.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
                <input type="hidden" value={user?.activeDaycareId ?? ""} />
                <div className="text-sm text-gray-600">
                  This parent will be created under your active daycare.
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter home address" className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter emergency contact information" className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional information about the parent" className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Parent
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
