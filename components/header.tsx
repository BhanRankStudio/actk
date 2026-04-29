"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, LayoutDashboard, FileText, FileDown, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setUser(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function onLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Logged out successfully");
        window.location.href = "/";
      } else {
        throw new Error("Logout failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Logout failed");
    }
  }

  const isAdmin = user?.role === "admin";
  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "";

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background sticky top-0 z-50">
      <Link className="flex items-center justify-center" href="/dashboard">
        <Clock className="h-6 w-6 text-primary" />
        <span className="ml-2 text-xl font-bold tracking-tight text-foreground">Actk</span>
      </Link>
      <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
        {!loading && user && (
          <>
            <div className="flex items-center gap-2 mr-2 border-r pr-4 hidden md:flex">
              <Avatar size="sm" className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm">
                <span className="font-medium leading-none text-foreground">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {user.role}
                </span>
              </div>
            </div>

            {!isAdmin && (
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link href="/admin/monthly-report">
                <FileText className="mr-2 h-4 w-4" />
                Report
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                <Link href="/admin/export">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </>
        )}
        {!loading && !user && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
