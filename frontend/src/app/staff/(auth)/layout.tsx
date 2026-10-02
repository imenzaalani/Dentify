import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff sign in - Dentify",
  description: "Sign in to the Dentify staff dashboard",
};

export default function StaffAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
