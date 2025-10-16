"use client"

import dynamic from "next/dynamic"

// Dynamically import the App component with no SSR since it uses browser APIs
const App = dynamic(() => import("../frontend/src/App"), { ssr: false })

export default function HomePage() {
  return <App />
}