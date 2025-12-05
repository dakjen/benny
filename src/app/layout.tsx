import type { Metadata } from "next";
import { Manrope, Permanent_Marker } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider"; // Import AuthProvider

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-permanent-marker",
});

export const metadata: Metadata = {
  title: "Ben's 25th",
  description: "A webapp for Ben's 25th birthday.",
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Ben's 25th",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <link rel="apple-touch-icon" href="/assets/oldben.png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/assets/oldben.png" sizes="152x152" />
        <link rel="apple-touch-icon" href="/assets/oldben.png" sizes="120x120" />
        <link rel="apple-touch-icon" href="/assets/oldben.png" sizes="76x76" />
        <link rel="apple-touch-icon" href="/assets/oldben.png" />
      </head>
      <body
        className={`${manrope.variable} ${permanentMarker.variable} font-permanent-marker min-h-screen`}
      >
        <AuthProvider> {/* Wrap children with AuthProvider */}
          <div className="flex flex-col flex-1">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
