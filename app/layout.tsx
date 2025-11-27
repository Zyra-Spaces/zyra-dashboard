import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { CleanupOnMount } from "@/components/cleanup-on-mount";
import { ClearCookiesOnMount } from "@/components/clear-cookies-on-mount";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Zyra-Spaces",
  description: "Zyra-Spaces, All in one Project Management Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <CleanupOnMount />
            <ClearCookiesOnMount />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
