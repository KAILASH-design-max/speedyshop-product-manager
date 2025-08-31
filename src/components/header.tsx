"use client";

import { Package, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { NotificationBell } from "./notification-bell";

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">Stock Watch</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
           {user && (
            <>
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2">
                 <span className="text-sm text-muted-foreground">{user.email}</span>
                 <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
               <div className="sm:hidden">
                 <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
