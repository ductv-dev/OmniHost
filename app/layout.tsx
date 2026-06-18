import "./globals.css"
import type { Metadata, Viewport } from "next"
import { QueryProvider } from "@/components/query-provider"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  applicationName: "OmniHost",
  title: {
    default: "OmniHost",
    template: "%s | OmniHost",
  },
  description: "Mobile workspace for host messages, rooms, and templates.",
  appleWebApp: {
    capable: true,
    title: "OmniHost",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="font-sans antialiased"
    >
      <body>
        <ThemeProvider>
          <QueryProvider>
            <ServiceWorkerRegister />
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
