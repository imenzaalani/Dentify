import { NextRequest } from "next/server"
import { logoutHandler } from "@/lib/server/auth-route-handlers"

export async function POST(req: NextRequest) {
  return logoutHandler(req)
}
