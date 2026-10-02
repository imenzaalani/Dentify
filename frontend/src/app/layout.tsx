import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Toaster } from "@/components/ui/sonner";
import { inter } from "@/lib/fonts";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dentify",
  description: "Dentify dental practice management platform",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider defaultLocale="en" storageKey="nextjs-ui-locale">
            <ThemeProvider defaultTheme="light" storageKey="nextjs-ui-theme">
              <SidebarConfigProvider>
                <Toaster />
                {children}
              </SidebarConfigProvider>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
