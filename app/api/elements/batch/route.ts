import { NextRequest, NextResponse } from "next/server"
import { elements, generateId, type ServerElement } from "@/src/types"

// POST /api/elements/batch - Batch create elements
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { elements: elementsToCreate } = body

    if (!Array.isArray(elementsToCreate)) {
      return NextResponse.json(
        {
          success: false,
          error: "Expected an array of elements",
        },
        { status: 400 }
      )
    }

    const createdElements: ServerElement[] = []

    elementsToCreate.forEach((elementData: any) => {
      const id = generateId()
      const element: ServerElement = {
        id,
        ...elementData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }

      elements.set(id, element)
      createdElements.push(element)
    })

    return NextResponse.json({
      success: true,
      elements: createdElements,
      count: createdElements.length,
    })
  } catch (error) {
    console.error("Error batch creating elements:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 400 }
    )
  }
}

