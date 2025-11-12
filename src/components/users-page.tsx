
"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Edit, Users, ShieldCheck } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { adminUpdateUserAction, getAllUsersAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { EditUserDialog, type EditUserFormValues } from "./edit-user-dialog";

export function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await getAllUsersAction();
      if (result.users) {
        setUsers(result.users);
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have permission to view this page.",
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, toast, router]);
  
  const handleUpdateUser = async (values: EditUserFormValues) => {
    if (!editingUser) return;
    setIsSaving(true);
    const result = await adminUpdateUserAction(editingUser.uid, values);
    if (result.success) {
      toast({
        title: "User Updated",
        description: "The user's role and status have been updated.",
      });
      await fetchUsers();
      setEditingUser(null);
    } else {
       toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.error || "An unexpected error occurred.",
      });
    }
    setIsSaving(false);
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <>
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
        </div>

        {loading ? (
          <div className="border rounded-lg p-4">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.photoURL ?? undefined} alt={u.name} />
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                        {u.uid === user?.uid && <Badge variant="outline">You</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'active' ? 'secondary' : 'destructive'}>
                         {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={u.uid === user?.uid}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(u)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Role/Status</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
    {editingUser && (
        <EditUserDialog
            user={editingUser}
            onUpdateUser={handleUpdateUser}
            open={!!editingUser}
            onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}
            isSaving={isSaving}
        />
    )}
    </>
  );
}
