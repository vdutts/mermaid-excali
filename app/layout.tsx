import type { Metadata } from 'next'
import './globals.css'
import './app.css'
import '@excalidraw/excalidraw/index.css'
import '../frontend/src/App.css'
import '../frontend/src/styles/MermaidConverter.css'

export const metadata: Metadata = {
  title: 'Mermaid to Excali',
  description: 'Convert Mermaid diagrams to Excalidraw',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
