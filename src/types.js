const EXCALIDRAW_ELEMENT_TYPES = {
  RECTANGLE: "rectangle",
  ELLIPSE: "ellipse",
  DIAMOND: "diamond",
  ARROW: "arrow",
  TEXT: "text",
  LABEL: "label",
  FREEDRAW: "freedraw",
  LINE: "line",
}

const elements = new Map()

function validateElement(element) {
  const requiredFields = ["type", "x", "y"]
  const hasRequiredFields = requiredFields.every((field) => field in element)

  if (!hasRequiredFields) {
    throw new Error(`Missing required fields: ${requiredFields.join(", ")}`)
  }

  if (!Object.values(EXCALIDRAW_ELEMENT_TYPES).includes(element.type)) {
    throw new Error(`Invalid element type: ${element.type}`)
  }

  return true
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Export all required named exports
module.exports = {
  generateId,
  EXCALIDRAW_ELEMENT_TYPES,
  ServerElement: undefined, // Type definition
  ExcalidrawElementType: undefined, // Type definition
  validateElement,
  elements,
  WebSocketMessage: undefined, // Type definition
  ElementCreatedMessage: undefined, // Type definition
  ElementUpdatedMessage: undefined, // Type definition
  ElementDeletedMessage: undefined, // Type definition
  BatchCreatedMessage: undefined, // Type definition
  SyncStatusMessage: undefined, // Type definition
  InitialElementsMessage: undefined, // Type definition
}
