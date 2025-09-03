import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://recruitment.mlsasrm.in'),
  title: "MSA SRM Task Submission Portal",
  description: "Official task submission platform for Microsoft Student Ambassadors SRM",
  keywords: "MSA, Microsoft Student Ambassador, SRM, Task Submission, Technology, Programming",
  authors: [{ name: "MSA SRM Team" }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', type: 'image/svg+xml', sizes: '32x32' },
    ],
    apple: [
      { url: '/logo.svg', type: 'image/svg+xml', sizes: '180x180' },
    ],
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',

  openGraph: {
    title: "MSA SRM Task Submission Portal",
    description: "Submit tasks and showcase your skills to Microsoft Student Ambassadors SRM",
    type: "website",
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Microsoft Student Ambassador SRM Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MSA SRM Task Submission Portal',
    description: 'Submit tasks and showcase your skills to Microsoft Student Ambassadors SRM',
    images: ['/logo.svg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#00FFFF',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
