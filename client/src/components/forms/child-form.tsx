import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Baby, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DaycareSelect from "@/components/DaycareSelect";

const childFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Invalid date format",
  }),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContacts: z.string().optional(),
  // Admin-only select (validated in submit)
  currentDaycareId: z.coerce.number().int().positive().optional(),
});

type FormValues = z.infer<typeof childFormSchema>& {
  currentDaycareId?: number;
};


type Daycare = { id: number; name: string };

interface ChildFormProps {
  parent: any; // should have { id, firstName, lastName, daycareId? }
  onSubmit: (data: any) => void; // will receive API payload (with parentId, timestamps, etc.)
  onCancel: () => void;
  isLoading: boolean;
}

export default function ChildForm({ parent, onSubmit, onCancel, isLoading }: ChildFormProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [daycares, setDaycares] = useState<Daycare[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const uRes = await apiRequest("GET", "/api/auth/user");
        const u = await uRes.json();
        const admin = u?.role === "admin" || u?.role === "system_admin";
        setIsAdmin(admin);
        if (admin) {
          const dRes = await apiRequest("GET", "/api/daycares");
          const d = await dRes.json();
          setDaycares(d || []);
        }
      } catch {
        // ignore auth failures here; form will show limited UI for non-admins
      }
    })();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      firstName: "",
      lastName: parent?.lastName ?? "",
      dateOfBirth: undefined,
      allergies: "",
      medicalNotes: "",
      emergencyContacts: "",
      currentDaycareId: parent?.daycareId ?? undefined, // default to parent's daycare if known
    },
  });

  const handleSubmit = (values: FormValues) => {
    // Admin must choose a daycare explicitly
    if (isAdmin && !values.currentDaycareId) {
      form.setError("currentDaycareId", { type: "manual", message: "Please select a daycare" });
      return;
    }

    const payload = {
      // core fields
      firstName: values.firstName,
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth.toISOString(), // API expects string
      allergies: values.allergies ?? "",
      medicalNotes: values.medicalNotes ?? "",
      emergencyContacts: values.emergencyContacts ?? "",
      // relations & timestamps
      parentId: Number(parent.id),
      createdAt: Date.now(), // number (ms) → matches server Number(createdAt)
      updatedAt: Date.now(),
      // tenancy (only include when admin picked one; tenants are pinned server-side)
      ...(isAdmin ? { currentDaycareId: values.currentDaycareId } : {}),
    };

    onSubmit(payload);
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Baby className="h-5 w-5" />
            <span>Add Child Profile</span>
          </DialogTitle>
          <DialogDescription>
            Add a new child for <strong>{parent.firstName} {parent.lastName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

            {/* Admin-only daycare select */}
            {isAdmin ? (
              <FormField
                control={form.control}
                name="currentDaycareId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daycare *</FormLabel>
                    <FormControl>
                      <select
                        className="mt-1 block w-full border rounded p-2"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      >
                        <option value="" disabled>Select a daycare…</option>
                        {daycares.map(dc => (
                          <option key={dc.id} value={dc.id}>{dc.name}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="text-sm text-gray-600">
                This child will be created under your active daycare.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter child's first name" {...field} />
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
                      <Input placeholder="Enter child's last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth *</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any known allergies (food, environmental, etc.)"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any medical conditions, medications, or special care instructions"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContacts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contacts</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional emergency contacts besides the parent"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
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
                Add Child
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
