"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { navbarState, accountLinks } from "@/lib/auth-ui/navigation";
import { logoutSession } from "@/lib/auth-ui/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import UserAvatar from "@/components/auth/UserAvatar";
import Brand from "./Brand";

function NavbarContent() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, isPending } = authClient.useSession();
  const { user, loading, links, showAuthLinks } = navbarState(session, isPending);
  const pathname = usePathname();
  const router = useRouter();
  const dark = resolvedTheme === "dark";
  const active = href => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutSession(authClient);
      setOpen(false);
      toast.success("You’ve been signed out.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally { setLoggingOut(false); }
  }

  return (
    <header className="site-header page-width">
      <Brand />
      <nav aria-label="Main navigation" className="desktop-nav">
        {links.map(([label, href]) => <Link key={href} href={href} className={active(href) ? "active" : ""} aria-current={active(href) ? "page" : undefined}>{label}</Link>)}
      </nav>
      <div className="nav-actions">
        <Button variant="ghost" size="icon" className="theme-toggle" aria-label={`Switch to ${dark ? "light" : "dark"} theme`} onClick={() => setTheme(dark ? "light" : "dark")}>
          {dark ? <Moon /> : <Sun />}
        </Button>
        <span className="nav-divider" aria-hidden="true" />
        {loading && <div className="nav-session-loading" role="status" aria-label="Checking your session"><Skeleton className="h-9 w-24" /></div>}
        {showAuthLinks && <><Link className="button button-outline login-link" href="/login">Login</Link><Link className="button register-link" href="/register">Register</Link></>}
        {user && <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="account-trigger" aria-label="Open account menu" />}>
            <UserAvatar user={user} /><span className="nav-user-name">{user.name || "My account"}</span><ChevronDown aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="account-menu">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="account-menu-label"><strong>{user.name || "Reader"}</strong><span>{user.email}</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              {accountLinks.map(([label, href]) => <DropdownMenuItem key={href} render={<Link href={href} />}>{label}</DropdownMenuItem>)}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} disabled={loggingOut}>
                {loggingOut ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}{loggingOut ? "Signing out…" : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="mobile-menu-toggle" aria-label="Open navigation" />}><Menu /></SheetTrigger>
          <SheetContent className="mobile-sheet">
            <SheetHeader><SheetTitle>BookNook</SheetTitle><SheetDescription>{user ? `Welcome, ${user.name || "Reader"}.` : "Your next chapter starts here."}</SheetDescription></SheetHeader>
            <nav aria-label="Mobile navigation" className="mobile-nav">
              {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active(href) ? "page" : undefined}>{label}</Link>)}
              {showAuthLinks && <><Link href="/login" onClick={() => setOpen(false)}>Login</Link><Link href="/register" onClick={() => setOpen(false)}>Register</Link></>}
              {loading && <span role="status">Checking your session…</span>}
              {user && <><Link href="/profile" onClick={() => setOpen(false)}>My Profile</Link><Button className="mobile-logout" variant="ghost" onClick={logout} disabled={loggingOut}>{loggingOut ? "Signing out…" : "Logout"}</Button></>}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export default function Navbar() {
  return <Suspense fallback={<header className="site-header page-width"><Brand /><div role="status" aria-label="Loading navigation"><Skeleton className="h-9 w-24" /></div></header>}><NavbarContent /></Suspense>;
}
