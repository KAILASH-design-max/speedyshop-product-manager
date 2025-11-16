
"use client";

import { Package, LogOut, Moon, Sun, Truck, LayoutDashboard, User as UserIcon, Calendar, Users, ClipboardList, ShoppingBag, BarChart, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useEffect, useState } from "react";
import type { UserProfile } from "@/lib/types";
import { getUserProfile } from "@/lib/firestore";
import { NotificationBell } from "./notification-bell";


export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      }
    }
    fetchProfile();
  }, [user]);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orders", label: "Sales Orders", icon: ShoppingBag },
    { href: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
    { href: "/suppliers", label: "Suppliers", icon: Truck },
    { href: "/festivals", label: "Festivals", icon: Calendar },
    { href: "/deals", label: "Deals", icon: Ticket },
    { href: "/reports", label: "Reports", icon: BarChart },
    { href: "/users", label: "Users", icon: Users, adminOnly: true },
  ]
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Package className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-bold">Stock Watch</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => {
              if (link.adminOnly && userProfile?.role !== 'admin') {
                return null;
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    pathname === link.href ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{getInitials(userProfile?.name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userProfile?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
