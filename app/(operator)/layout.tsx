"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  BarChart3,
  FilePlus,
  FileText,
  LayoutDashboard,
  Menu,
  PiggyBank,
  CreditCard,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-2", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
            pathname === item.href
              ? "bg-primary/10 font-semibold text-primary"
              : "text-muted-foreground hover:bg-primary/5"
          )}
        >
          {item.icon}
          <span>{item.title}</span>
          {pathname === item.href && (
            <ArrowRight className="ml-auto h-4 w-4 text-primary" />
          )}
        </Link>
      ))}
    </nav>
  );
}

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigationItems = [
    {
      href: "/operator/dashboard",
      title: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/operator/anggaran",
      title: "Anggaran",
      icon: <PiggyBank className="h-4 w-4" />,
    },
    {
      href: "/operator/pengeluaran",
      title: "Pengeluaran",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      href: "/operator/anggaran-tambahan",
      title: "Anggaran Tambahan",
      icon: <FilePlus className="h-4 w-4" />,
    },
    {
      href: "/operator/entri-jurnal",
      title: "Entri Jurnal",
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-16 lg:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="lg:hidden">
            <nav className="grid gap-2 text-lg font-medium">
              <Link
                href="/operator"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-display">SiKePro UNISMUH</span>
              </Link>
              <ScrollArea className="h-[calc(100vh-8rem)] pb-10 pl-6">
                <SidebarNav items={navigationItems} />
              </ScrollArea>
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/operator" className="flex items-center gap-2 font-semibold">
          <BarChart3 className="h-5 w-5" />
          <span className="font-display hidden md:inline">SiKePro UNISMUH</span>
        </Link>
        <div className="flex items-center ml-auto gap-4">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-background lg:block">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="flex h-full flex-col gap-4 p-6">
              <Link
                href="/operator"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-display">SiKePro UNISMUH</span>
              </Link>
              <SidebarNav className="mt-8" items={navigationItems} />
            </div>
          </ScrollArea>
        </aside>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
} 
