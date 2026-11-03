"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Brand from "./Brand";

const links = [["Home", "/"], ["All Books", "/books"], ["Add Book", "/add-book"], ["My Books", "/my-books"], ["My Borrows", "/my-borrows"]];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <header className="site-header page-width">
      <Brand />
      <nav aria-label="Main navigation" className="desktop-nav">{links.map(([label, href]) => <Link key={href} href={href} className={href === "/" ? "active" : ""} aria-current={href === "/" ? "page" : undefined}>{label}</Link>)}</nav>
      <div className="nav-actions">
        <Button variant="ghost" size="icon" className="theme-toggle" aria-label={`Switch to ${dark ? "light" : "dark"} theme`} onClick={() => setTheme(dark ? "light" : "dark")}>{dark ? <Moon /> : <Sun />}</Button>
        <span className="nav-divider" aria-hidden="true" />
        <Link className="button button-outline login-link" href="/login">Login</Link><Link className="button register-link" href="/register">Register</Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="mobile-menu-toggle" aria-label="Open navigation" />}><Menu /></SheetTrigger>
          <SheetContent className="mobile-sheet"><SheetHeader><SheetTitle>BookNook</SheetTitle><SheetDescription>Your next chapter starts here.</SheetDescription></SheetHeader><nav aria-label="Mobile navigation" className="mobile-nav">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={href === "/" ? "page" : undefined}>{label}</Link>)}<Link href="/login" onClick={() => setOpen(false)}>Login</Link><Link href="/register" onClick={() => setOpen(false)}>Register</Link></nav></SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
