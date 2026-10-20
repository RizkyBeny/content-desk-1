"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar, Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, MOBILE_NAV, type NavItem } from "./nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ChevronRightIcon, LogoutIcon, MenuIcon, SparkIcon } from "@/components/ui/icons";

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function isActive(pathname: string, href: string) {
  if (href === "/pengaturan") return pathname.startsWith("/pengaturan");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Halaman editor canvas (`/studio/[id]`, `/desain/[id]`) dirender full-bleed:
 * tanpa max-width, padding, maupun scroll bawaan shell — hanya rute detail,
 * bukan rute list `/studio` atau `/desain`.
 */
function isEditorRoute(pathname: string) {
  return /^\/(studio|desain)\/[^/]+/.test(pathname);
}

function Brand() {
  return (
    <Link href="/insight" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
        <SparkIcon width={18} height={18} />
      </span>
      <span className="text-sm font-semibold leading-tight">
        Content
        <br />
        Studio AI
      </span>
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ "Ai Studio": true });

  function groupActive(item: NavItem) {
    return item.children?.some((c) => c.href && isActive(pathname, c.href)) ?? false;
  }

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        if (item.children?.length) {
          const active = groupActive(item);
          const expanded = open[item.label] ?? active;
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [item.label]: !expanded }))}
                aria-expanded={expanded}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10",
                )}
              >
                <Icon width={18} height={18} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRightIcon
                  width={16}
                  height={16}
                  className={cn("transition-transform duration-200", expanded && "rotate-90")}
                />
              </button>
              {expanded && (
                <div className="mt-1 space-y-1 pl-4">
                  {item.children.map((child) => {
                    const childActive = child.href ? isActive(pathname, child.href) : false;
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.label}
                        href={child.href ?? "#"}
                        onClick={onNavigate}
                        aria-current={childActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          childActive
                            ? "bg-zinc-900/10 text-zinc-900 dark:bg-white/10 dark:text-white"
                            : "text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10",
                        )}
                      >
                        <ChildIcon width={16} height={16} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const active = item.href ? isActive(pathname, item.href) : false;
        return (
          <Link
            key={item.label}
            href={item.href ?? "#"}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10",
            )}
          >
            <Icon width={18} height={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({ user }: { user: ShellUser }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 p-2.5 dark:border-white/10">
      <Avatar>
        <Avatar.Fallback>{user.name.slice(0, 1).toUpperCase()}</Avatar.Fallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {user.role === "admin" ? "Admin" : "Creator"}
        </p>
      </div>
      <Button variant="ghost" isIconOnly size="sm" aria-label="Keluar" onPress={logout}>
        <LogoutIcon width={16} height={16} />
      </Button>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  pathname,
  user,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  user: ShellUser;
}) {
  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "glass-strong absolute inset-y-0 left-0 flex w-72 flex-col gap-6 p-4 transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex justify-between">
          <Brand />
          <ThemeToggle />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks pathname={pathname} onNavigate={onClose} />
        </div>
        <UserCard user={user} />
      </div>
    </div>
  );
}

function TabletRail({ pathname }: { pathname: string }) {
  const flat = NAV_ITEMS.flatMap((item) => (item.children?.length ? item.children : [item]));
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col gap-3 p-2 md:flex lg:hidden">
      <div className="frosted-glass flex h-full flex-col items-center gap-2 rounded-2xl p-2 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-white/10">
        <Link
          href="/ai-studio/image"
          aria-label="Content Studio AI"
          className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
        >
          <SparkIcon width={18} height={18} />
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto">
          {flat.map((item) => {
            const active = item.href ? isActive(pathname, item.href) : false;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10",
                )}
              >
                <Icon width={18} height={18} />
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 p-4 lg:flex">
        <div className="frosted-glass flex h-full flex-col gap-6 rounded-2xl p-4 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-white/10">
          <div className="flex items-center justify-between">
            <Brand />
            <ThemeToggle />
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavLinks pathname={pathname} />
          </div>
          <UserCard user={user} />
        </div>
      </aside>

      <TabletRail pathname={pathname} />

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 p-3 md:hidden">
        <div className="glass-panel flex w-full items-center justify-between p-2.5 pl-4">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              isIconOnly
              aria-label="Buka menu"
              onPress={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </Button>
          </div>
        </div>
      </header>

      <main
        className={
          isEditorRoute(pathname)
            ? "px-3 pb-6 pt-4 md:pl-20 lg:pl-64 lg:pr-4 lg:pb-4"
            : "px-3 pt-10 pb-28 md:pl-20 lg:pl-64 lg:pr-6"
        }
      >
        <div className={isEditorRoute(pathname) ? "mx-auto w-full" : "mx-auto w-full max-w-6xl"}>{children}</div>
      </main>

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 p-3 md:hidden",
          isEditorRoute(pathname) && "hidden",
        )}
      >
        <div className="glass-strong mx-auto flex max-w-md items-center justify-around rounded-xl p-1.5">
          {MOBILE_NAV.map((item) => {
            const active = item.href ? isActive(pathname, item.href) : false;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors",
                  active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400",
                )}
              >
                <Icon width={20} height={20} />
                {item.label.replace(/^Create /, "")}
              </Link>
            );
          })}
        </div>
      </nav>

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        pathname={pathname}
        user={user}
      />
    </div>
  );
}
