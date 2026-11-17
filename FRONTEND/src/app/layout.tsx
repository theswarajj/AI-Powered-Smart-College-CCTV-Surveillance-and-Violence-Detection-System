import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { PageWrapper } from "@/components/page-wrapper";
import { TransitionOverlay } from "@/components/transition-overlay";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "sentinelX AI",
  description: "Surveillance & Violece Detection System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="h-full relative bg-background">
            <SidebarWrapper />
            <PageWrapper>
              {children}
            </PageWrapper>
            <TransitionOverlay />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
