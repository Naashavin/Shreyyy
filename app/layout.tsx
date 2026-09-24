import type { Metadata, Viewport } from "next"
import { Dancing_Script, Cormorant_Garamond } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const script = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
})

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "For Shreyyy — A Birthday Wish",
  description: "A little interactive world made just for you. Tap to begin.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#0a0710",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${script.variable} ${serif.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
