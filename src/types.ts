export const EXCALIDRAW_ELEMENT_TYPES = {
  RECTANGLE: "rectangle",
  ELLIPSE: "ellipse",
  DIAMOND: "diamond",
  ARROW: "arrow",
  TEXT: "text",
  LABEL: "label",
  FREEDRAW: "freedraw",
  LINE: "line",
} as const

export type ExcalidrawElementType = typeof EXCALIDRAW_ELEMENT_TYPES[keyof typeof EXCALIDRAW_ELEMENT_TYPES]

export interface ServerElement {
  id: string
  type: ExcalidrawElementType
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

export interface WebSocketMessage {
  type: string
  element?: ServerElement
  elements?: ServerElement[]
  elementId?: string
  count?: number
  timestamp?: string
  source?: string
}

export interface ElementCreatedMessage extends WebSocketMessage {
  type: "element_created"
  element: ServerElement
}

export interface ElementUpdatedMessage extends WebSocketMessage {
  type: "element_updated"
  element: ServerElement
}

export interface ElementDeletedMessage extends WebSocketMessage {
  type: "element_deleted"
  elementId: string
}

export interface BatchCreatedMessage extends WebSocketMessage {
  type: "elements_batch_created"
  elements: ServerElement[]
}

export interface SyncStatusMessage extends WebSocketMessage {
  type: "sync_status"
  elementCount: number
  timestamp: string
}

export interface InitialElementsMessage extends WebSocketMessage {
  type: "initial_elements"
  elements: ServerElement[]
}

// In-memory storage for elements
export const elements = new Map<string, ServerElement>()

export function validateElement(element: Partial<ServerElement>): boolean {
  const requiredFields: (keyof ServerElement)[] = ["type", "x", "y"]
  const hasRequiredFields = requiredFields.every((field) => field in element)

  if (!hasRequiredFields) {
    throw new Error(`Missing required fields: ${requiredFields.join(", ")}`)
  }

  if (!Object.values(EXCALIDRAW_ELEMENT_TYPES).includes(element.type as ExcalidrawElementType)) {
    throw new Error(`Invalid element type: ${element.type}`)
  }

  return true
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

