import { NextRequest, NextResponse } from "next/server"
import { elements, type ServerElement } from "@/src/types"

// GET /api/elements/:id - Get element by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Element ID is required",
        },
        { status: 400 }
      )
    }

    const element = elements.get(id)

    if (!element) {
      return NextResponse.json(
        {
          success: false,
          error: `Element with ID ${id} not found`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      element: element,
    })
  } catch (error) {
    console.error("Error fetching element:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

// PUT /api/elements/:id - Update element
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const updates = await request.json()

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Element ID is required",
        },
        { status: 400 }
      )
    }

    const existingElement = elements.get(id)
    if (!existingElement) {
      return NextResponse.json(
        {
          success: false,
          error: `Element with ID ${id} not found`,
        },
        { status: 404 }
      )
    }

    const updatedElement: ServerElement = {
      ...existingElement,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (existingElement.version || 0) + 1,
    }

    elements.set(id, updatedElement)

    return NextResponse.json({
      success: true,
      element: updatedElement,
    })
  } catch (error) {
    console.error("Error updating element:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 400 }
    )
  }
}

// DELETE /api/elements/:id - Delete element
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Element ID is required",
        },
        { status: 400 }
      )
    }

    if (!elements.has(id)) {
      return NextResponse.json(
        {
          success: false,
          error: `Element with ID ${id} not found`,
        },
        { status: 404 }
      )
    }

    elements.delete(id)

    return NextResponse.json({
      success: true,
      message: `Element ${id} deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting element:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

