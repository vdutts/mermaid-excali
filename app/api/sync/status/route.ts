import { NextRequest, NextResponse } from "next/server"
import { elements } from "@/src/types"

// GET /api/sync/status - Sync status endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    elementCount: elements.size,
    timestamp: new Date().toISOString(),
  })
}

