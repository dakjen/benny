"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, HelpCircle, Info, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react"; // Import useSession from NextAuth.js

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession(); // Use NextAuth.js useSession hook

  const links = [];

  // Conditionally add Chat link for admins/judges
  if (session?.user?.role === "admin" || session?.user?.role === "judge") {
    links.push({ href: "/chat", label: "Chat", icon: MessageSquare });
  }

  // Add Submissions Summary link for all users
  links.push({ href: "/admin/submissions/game-summary", label: "Submissions", icon: LayoutDashboard }); // Using LayoutDashboard for now, can change later

  links.push({
    href: session?.user?.role === "admin" ? "/admin/questions" : "/questions",
    label: "Questions",
    icon: HelpCircle,
  });
  links.push({ href: "/help", label: "Help", icon: Info });

  if (session?.user?.role === "admin") {
    links.unshift({ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#155591] h-20 flex justify-around items-center border-t border-border z-50">
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
