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
import "@excalidraw/excalidraw/index.css"
import MermaidConverter from "./components/MermaidConverter"
import "./App.css"
import { WebSocket } from "ws" // Declare WebSocket here

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

interface WebSocketMessage {
  type: string
  element?: ServerElement
  elements?: ServerElement[]
  elementId?: string
  count?: number
  timestamp?: string
  source?: string
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
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const websocketRef = useRef<WebSocket | null>(null)

  // Sync state management
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [showMermaidPanel, setShowMermaidPanel] = useState<boolean>(true)

  // WebSocket connection
  useEffect(() => {
    connectWebSocket()
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }
  }, [])

  // Load existing elements when Excalidraw API becomes available
  useEffect(() => {
    if (excalidrawAPI) {
      loadExistingElements()

      // Ensure WebSocket is connected for real-time updates
      if (!isConnected) {
        connectWebSocket()
      }
    }
  }, [excalidrawAPI, isConnected])

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

  const connectWebSocket = (): void => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}`

    websocketRef.current = new WebSocket(wsUrl)

    websocketRef.current.onopen = () => {
      setIsConnected(true)

      if (excalidrawAPI) {
        setTimeout(loadExistingElements, 100)
      }
    }

    websocketRef.current.onmessage = (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error("Error parsing WebSocket message:", error, event.data)
      }
    }

    websocketRef.current.onclose = (event: CloseEvent) => {
      setIsConnected(false)

      // Reconnect after 3 seconds if not a clean close
      if (event.code !== 1000) {
        setTimeout(connectWebSocket, 3000)
      }
    }

    websocketRef.current.onerror = (error: Event) => {
      console.error("WebSocket error:", error)
      setIsConnected(false)
    }
  }

  const handleWebSocketMessage = (data: WebSocketMessage): void => {
    if (!excalidrawAPI) {
      return
    }

    try {
      const currentElements = excalidrawAPI.getSceneElements()
      console.log("Current elements:", currentElements)

      switch (data.type) {
        case "initial_elements":
          if (data.elements && data.elements.length > 0) {
            const cleanedElements = data.elements.map(cleanElementForExcalidraw)
            const validatedElements = validateAndFixBindings(cleanedElements)
            const convertedElements = convertToExcalidrawElements(validatedElements)
            excalidrawAPI.updateScene({
              elements: convertedElements,
              captureUpdate: CaptureUpdateAction.NEVER,
            })
          }
          break

        case "element_created":
          if (data.element) {
            const cleanedNewElement = cleanElementForExcalidraw(data.element)
            const newElement = convertToExcalidrawElements([cleanedNewElement])
            const updatedElementsAfterCreate = [...currentElements, ...newElement]
            excalidrawAPI.updateScene({
              elements: updatedElementsAfterCreate,
              captureUpdate: CaptureUpdateAction.NEVER,
            })
          }
          break

        case "element_updated":
          if (data.element) {
            const cleanedUpdatedElement = cleanElementForExcalidraw(data.element)
            const convertedUpdatedElement = convertToExcalidrawElements([cleanedUpdatedElement])[0]
            const updatedElements = currentElements.map((el) =>
              el.id === data.element!.id ? convertedUpdatedElement : el,
            )
            excalidrawAPI.updateScene({
              elements: updatedElements,
              captureUpdate: CaptureUpdateAction.NEVER,
            })
          }
          break

        case "element_deleted":
          if (data.elementId) {
            const filteredElements = currentElements.filter((el) => el.id !== data.elementId)
            excalidrawAPI.updateScene({
              elements: filteredElements,
              captureUpdate: CaptureUpdateAction.NEVER,
            })
          }
          break

        case "elements_batch_created":
          if (data.elements) {
            const cleanedBatchElements = data.elements.map(cleanElementForExcalidraw)
            const batchElements = convertToExcalidrawElements(cleanedBatchElements)
            const updatedElementsAfterBatch = [...currentElements, ...batchElements]
            excalidrawAPI.updateScene({
              elements: updatedElementsAfterBatch,
              captureUpdate: CaptureUpdateAction.NEVER,
            })
          }
          break

        case "elements_synced":
          console.log(`Sync confirmed by server: ${data.count} elements`)
          // Sync confirmation already handled by HTTP response
          break

        case "sync_status":
          console.log(`Server sync status: ${data.count} elements`)
          break

        default:
          console.log("Unknown WebSocket message type:", data.type)
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error, data)
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

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <h1>Mermaid to Excalidraw Converter</h1>
        <div className="controls">
          <div className="status">
            <div className={`status-dot ${isConnected ? "status-connected" : "status-disconnected"}`}></div>
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>

          {/* Sync Controls */}
          <div className="sync-controls">
            <button
              className={`btn-primary ${syncStatus === "syncing" ? "btn-loading" : ""}`}
              onClick={syncToBackend}
              disabled={syncStatus === "syncing" || !excalidrawAPI}
            >
              {syncStatus === "syncing" && <span className="spinner"></span>}
              {syncStatus === "syncing" ? "Syncing..." : "Sync to Backend"}
            </button>

            {/* Sync Status */}
            <div className="sync-status">
              {syncStatus === "success" && <span className="sync-success">✅ Synced</span>}
              {syncStatus === "error" && <span className="sync-error">❌ Sync Failed</span>}
              {lastSyncTime && syncStatus === "idle" && (
                <span className="sync-time">Last sync: {formatSyncTime(lastSyncTime)}</span>
              )}
            </div>
          </div>

          <button className="btn-secondary" onClick={() => setShowMermaidPanel(!showMermaidPanel)}>
            {showMermaidPanel ? "Hide" : "Show"} Mermaid
          </button>

          <button className="btn-secondary" onClick={clearCanvas}>
            Clear Canvas
          </button>
        </div>
      </div>

      <div className="main-container">
        {showMermaidPanel && <MermaidConverter excalidrawAPI={excalidrawAPI} />}

        {/* Canvas Container */}
        <div className={`canvas-container ${showMermaidPanel ? "with-panel" : "full-width"}`}>
          <Excalidraw
            excalidrawAPI={(api: ExcalidrawAPIRefValue) => setExcalidrawAPI(api)}
            initialData={{
              elements: [],
              appState: {
                theme: "light",
                viewBackgroundColor: "#ffffff",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default App
