
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserProfile } from "@/lib/types";

const formSchema = z.object({
  role: z.enum(["admin", "viewer", "inventory-manager"]),
  status: z.enum(["active", "inactive"]),
});

export type EditUserFormValues = z.infer<typeof formSchema>;

interface EditUserDialogProps {
  user: UserProfile;
  onUpdateUser: (values: EditUserFormValues) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
}

export function EditUserDialog({ user, onUpdateUser, open, onOpenChange, isSaving }: EditUserDialogProps) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user.role,
      status: user.status || "active",
    },
  });

  const handleSubmit = (values: EditUserFormValues) => {
    onUpdateUser(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
          <DialogDescription>
            Update the role and status for {user.email}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="inventory-manager">Inventory Manager</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
