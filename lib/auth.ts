import { NextRequest } from "next/server";

export const adminPassword = () => process.env.ADMIN_PASSWORD || "lussekatt";

export function isAdmin(req: NextRequest): boolean {
  return req.headers.get("x-admin-password") === adminPassword();
}
