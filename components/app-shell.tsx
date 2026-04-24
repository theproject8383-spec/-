"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, MessageSquare, Compass, TrendingUp, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/tasks", label: "المهام", icon: CheckSquare },
  { href: "/insights", label: "الإنجازات", icon: TrendingUp },
  { href: "/chat", label: "محادثة الذكاء الاصطناعي", icon: MessageSquare },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20">
          <Compass className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-foreground">مِسبار</span>
          <span className="text-[10px] text-muted-foreground">مخططك الاستراتيجي</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 md:py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gradient-to-l from-emerald-500/10 to-cyan-500/10 text-emerald-500 border border-emerald-500/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 md:h-4 md:w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-gradient-to-l from-emerald-500/10 to-cyan-600/10 p-4 border border-emerald-500/20">
          <p className="text-xs text-muted-foreground">
            مدعوم بالذكاء الاصطناعي
          </p>
          <p className="mt-1 text-xs font-medium text-foreground">
            خطط بذكاء، نفّذ بثقة
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground">مِسبار</span>
        </div>
        
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 border-l border-border bg-card md:block">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 md:pr-64 overflow-x-hidden">
        <div className="min-h-screen p-4 pt-18 md:p-8 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
