import { NextRequest } from "next/server"
import { loginHandler } from "@/lib/server/auth-route-handlers"

export async function POST(req: NextRequest) {
  return loginHandler(req)
}
