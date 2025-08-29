"use client";

import { Package, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";

export function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">Stock Watch</span>
        </div>
        {user && (
           <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
