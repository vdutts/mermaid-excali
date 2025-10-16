"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Excalidraw,
  convertToExcalidrawElements,
  CaptureUpdateAction,
  type ExcalidrawAPIRefValue,
  type ExcalidrawElement,
} from "@excalidraw/excalidraw"
import MermaidConverter from "./components/MermaidConverter"
import "./App.css"

// Type definitions
interface ServerElement {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  backgroundColor?: string
  strokeColor?: string
  strokeWidth?: number
  roughness?: number
  opacity?: number
  text?: string
  fontSize?: number
  fontFamily?: string | number
  label?: {
    text: string
  }
  createdAt?: string
  updatedAt?: string
  version?: number
  syncedAt?: string
  source?: string
  syncTimestamp?: string
  boundElements?: any[] | null
  containerId?: string | null
  locked?: boolean
}


interface ApiResponse {
  success: boolean
  elements?: ServerElement[]
  element?: ServerElement
  count?: number
  error?: string
  message?: string
}

interface ElementBinding {
  id: string
  type: "text" | "arrow"
}

type SyncStatus = "idle" | "syncing" | "success" | "error"

// Helper function to clean elements for Excalidraw
const cleanElementForExcalidraw = (element: ServerElement): Partial<ExcalidrawElement> => {
  const { createdAt, updatedAt, version, syncedAt, source, syncTimestamp, ...cleanElement } = element
  return cleanElement
}

// Helper function to validate and fix element binding data
const validateAndFixBindings = (elements: Partial<ExcalidrawElement>[]): Partial<ExcalidrawElement>[] => {
  const elementMap = new Map(elements.map((el) => [el.id!, el]))

  return elements.map((element) => {
    const fixedElement = { ...element }

    // Validate and fix boundElements
    if (fixedElement.boundElements) {
      if (Array.isArray(fixedElement.boundElements)) {
        fixedElement.boundElements = fixedElement.boundElements.filter((binding: any) => {
          // Ensure binding has required properties
          if (!binding || typeof binding !== "object") return false
          if (!binding.id || !binding.type) return false

          // Ensure the referenced element exists
          const referencedElement = elementMap.get(binding.id)
          if (!referencedElement) return false

          // Validate binding type
          if (!["text", "arrow"].includes(binding.type)) return false

          return true
        })

        // Remove boundElements if empty
        if (fixedElement.boundElements.length === 0) {
          fixedElement.boundElements = null
        }
      } else {
        // Invalid boundElements format, set to null
        fixedElement.boundElements = null
      }
    }

    // Validate and fix containerId
    if (fixedElement.containerId) {
      const containerElement = elementMap.get(fixedElement.containerId)
      if (!containerElement) {
        // Container doesn't exist, remove containerId
        fixedElement.containerId = null
      }
    }

    return fixedElement
  })
}

function App(): React.JSX.Element {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawAPIRefValue | null>(null)

  // Sync state management
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [showMermaidPanel, setShowMermaidPanel] = useState<boolean>(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(50)
  const isDragging = useRef(false)

  // Load existing elements when Excalidraw API becomes available
  useEffect(() => {
    if (excalidrawAPI) {
      loadExistingElements()
    }
  }, [excalidrawAPI])

  const loadExistingElements = async (): Promise<void> => {
    try {
      const response = await fetch("/api/elements")
      const result: ApiResponse = await response.json()

      if (result.success && result.elements && result.elements.length > 0) {
        const cleanedElements = result.elements.map(cleanElementForExcalidraw)
        const convertedElements = convertToExcalidrawElements(cleanedElements, { regenerateIds: false })
        excalidrawAPI?.updateScene({ elements: convertedElements })
      }
    } catch (error) {
      console.error("Error loading existing elements:", error)
    }
  }

  // Data format conversion for backend
  const convertToBackendFormat = (element: ExcalidrawElement): ServerElement => {
    return {
      ...element,
    } as ServerElement
  }

  // Format sync time display
  const formatSyncTime = (time: Date | null): string => {
    if (!time) return ""
    return time.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Main sync function
  const syncToBackend = async (): Promise<void> => {
    if (!excalidrawAPI) {
      console.warn("Excalidraw API not available")
      return
    }

    setSyncStatus("syncing")

    try {
      // 1. Get current elements
      const currentElements = excalidrawAPI.getSceneElements()
      console.log(`Syncing ${currentElements.length} elements to backend`)

      // 2. Filter out deleted elements
      const activeElements = currentElements.filter((el) => !el.isDeleted)

      // 3. Convert to backend format
      const backendElements = activeElements.map(convertToBackendFormat)

      // 4. Send to backend
      const response = await fetch("/api/elements/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          elements: backendElements,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const result: ApiResponse = await response.json()
        setSyncStatus("success")
        setLastSyncTime(new Date())
        console.log(`Sync successful: ${result.count} elements synced`)

        // Reset status after 2 seconds
        setTimeout(() => setSyncStatus("idle"), 2000)
      } else {
        const error: ApiResponse = await response.json()
        setSyncStatus("error")
        console.error("Sync failed:", error.error)
      }
    } catch (error) {
      setSyncStatus("error")
      console.error("Sync error:", error)
    }
  }

  const clearCanvas = async (): Promise<void> => {
    if (excalidrawAPI) {
      try {
        // Get all current elements and delete them from backend
        const response = await fetch("/api/elements")
        const result: ApiResponse = await response.json()

        if (result.success && result.elements) {
          const deletePromises = result.elements.map((element) =>
            fetch(`/api/elements/${element.id}`, { method: "DELETE" }),
          )
          await Promise.all(deletePromises)
        }

        // Clear the frontend canvas
        excalidrawAPI.updateScene({
          elements: [],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        })
      } catch (error) {
        console.error("Error clearing canvas:", error)
        // Still clear frontend even if backend fails
        excalidrawAPI.updateScene({
          elements: [],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        })
      }
    }
  }

  const handleMouseDown = () => {
    isDragging.current = true
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return
    const newWidth = (e.clientX / window.innerWidth) * 100
    if (newWidth > 20 && newWidth < 80) {
      setLeftPanelWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return (
    <div className="app">
      <div className="social-island">
        <a href="https://github.com/vdutts7/" target="_blank" rel="noopener noreferrer" className="social-island-link" title="GitHub">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
        <a href="https://x.com/vdutts7" target="_blank" rel="noopener noreferrer" className="social-island-link" title="X (Twitter)">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      </div>

      <div className="main-container">
        <div className="mermaid-converter" style={{ width: `${leftPanelWidth}%` }}>
          <MermaidConverter excalidrawAPI={excalidrawAPI} />
        </div>

        <div 
          className="resize-handle" 
          style={{ left: `${leftPanelWidth}%` }}
          onMouseDown={handleMouseDown}
        >
          <div className="resize-handle-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8L22 12L18 16M6 8L2 12L6 16" />
            </svg>
          </div>
        </div>

        <div className="canvas-container with-panel" style={{ width: `${100 - leftPanelWidth}%` }}>
          <Excalidraw
            excalidrawAPI={(api: ExcalidrawAPIRefValue) => setExcalidrawAPI(api)}
            initialData={{
              elements: [],
              appState: {
                theme: "light",
                viewBackgroundColor: "#fafafa",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default App
