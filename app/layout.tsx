import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { CleanupOnMount } from "@/components/cleanup-on-mount";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover
          theme="light"
          limit={3}
          icon={false}
        />
        <QueryProvider>
          <AuthProvider>
            <CleanupOnMount />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
