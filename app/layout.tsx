import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { StreamProvider } from '@/contexts/stream-context'
import { Toaster } from '@/components/ui/toaster'
import { PALETTE_BOOT_SCRIPT } from '@/lib/palette'
import './globals.css'

const fontUi = Instrument_Sans({ subsets: ['latin'], variable: '--font-ui', display: 'swap' })
const fontHeading = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-heading', display: 'swap' })
const fontData = JetBrains_Mono({ subsets: ['latin'], variable: '--font-data', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'CodeOrbit', template: '%s · CodeOrbit' },
  description: 'Your LeetCode, Codeforces, CodeChef, GeeksforGeeks and GitHub activity in one place, with AI insights, mock interviews and live collaboration.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/brand/CodeOrbit_Icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f4ef' },
    { media: '(prefers-color-scheme: dark)', color: '#14130f' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontUi.variable} ${fontHeading.variable} ${fontData.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PALETTE_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <StreamProvider>
              {children}
              <Toaster />
            </StreamProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
