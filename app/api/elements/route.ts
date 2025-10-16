import { NextRequest, NextResponse } from "next/server"
import {
  elements,
  generateId,
  type ServerElement,
} from "@/src/types"

// GET /api/elements - Get all elements
export async function GET(request: NextRequest) {
  try {
    const elementsArray = Array.from(elements.values())
    return NextResponse.json({
      success: true,
      elements: elementsArray,
      count: elementsArray.length,
    })
  } catch (error) {
    console.error("Error fetching elements:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

// POST /api/elements - Create new element
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Creating element via API", { type: body.type })

    // Prioritize passed ID (for MCP sync), otherwise generate new ID
    const id = body.id || generateId()
    const element: ServerElement = {
      id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }

    elements.set(id, element)

    return NextResponse.json({
      success: true,
      element: element,
    })
  } catch (error) {
    console.error("Error creating element:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 400 }
    )
  }
}

