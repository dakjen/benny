"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, HelpCircle, Info, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react"; // Import useSession from NextAuth.js

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession(); // Use NextAuth.js useSession hook

  const links = [
    { href: "/chat", label: "Chat", icon: MessageSquare },
    {
      href: session?.user?.role === "admin" ? "/admin/questions" : "/questions",
      label: "Questions",
      icon: HelpCircle,
    },
    { href: "/help", label: "Help", icon: Info },
  ];

  if (session?.user?.role === "admin") {
    links.unshift({ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 flex justify-around items-center border-t border-border z-50" style={{ backgroundColor: "var(--background)" }}> {/* Changed bg-[#1a202c] to bg-card */}
      {links.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="flex flex-col items-center justify-center text-foreground">
          <Icon
            className={`h-6 w-6 mb-1 ${
              pathname.startsWith(href) ? "text-primary" : ""
            }`}
          />
          <span
            className={`text-xs font-medium ${
              pathname.startsWith(href) ? "text-primary" : ""
            }`}
          >
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
