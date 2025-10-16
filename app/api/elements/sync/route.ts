import { NextRequest, NextResponse } from "next/server"
import { elements, generateId, type ServerElement } from "@/src/types"

// POST /api/elements/sync - Sync elements from frontend (overwrite sync)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { elements: frontendElements, timestamp } = body

    console.log(`Sync request received: ${frontendElements.length} elements`, {
      timestamp,
      elementCount: frontendElements.length,
    })

    // Validate input data
    if (!Array.isArray(frontendElements)) {
      return NextResponse.json(
        {
          success: false,
          error: "Expected elements to be an array",
        },
        { status: 400 }
      )
    }

    // Record element count before sync
    const beforeCount = elements.size

    // 1. Clear existing memory storage
    elements.clear()
    console.log(`Cleared existing elements: ${beforeCount} elements removed`)

    // 2. Batch write new data
    let successCount = 0
    const processedElements: ServerElement[] = []

    frontendElements.forEach((element: any, index: number) => {
      try {
        // Ensure element has ID, generate one if missing
        const elementId = element.id || generateId()

        // Add server metadata
        const processedElement: ServerElement = {
          ...element,
          id: elementId,
          syncedAt: new Date().toISOString(),
          source: "frontend_sync",
          syncTimestamp: timestamp,
          version: 1,
        }

        // Store to memory
        elements.set(elementId, processedElement)
        processedElements.push(processedElement)
        successCount++
      } catch (elementError) {
        console.warn(`Failed to process element ${index}:`, elementError)
      }
    })

    console.log(`Sync completed: ${successCount}/${frontendElements.length} elements synced`)

    // 4. Return sync results
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${successCount} elements`,
      count: successCount,
      syncedAt: new Date().toISOString(),
      beforeCount,
      afterCount: elements.size,
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        details: "Internal server error during sync operation",
      },
      { status: 500 }
    )
  }
}

