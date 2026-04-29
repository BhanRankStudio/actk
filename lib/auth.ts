import prisma from "./prisma";
import { verifyToken } from "./jwt";
import { cookies } from "next/headers";

/**
 * Minimal server-side user resolution.
 * This helper supports:
 * - Development mode: If request contains `x-supabase-user-id` header
 * - Production/Standard mode: JWT token in cookies
 */
export async function getCurrentUser(req?: Request) {
  // 1. Check for development header (if req is provided)
  if (req) {
    const supabaseIdHeader = req.headers.get("x-supabase-user-id");
    if (supabaseIdHeader) {
      return await prisma.user.findUnique({
        where: { supabaseId: supabaseIdHeader },
      });
    }

    // Also check for Authorization Bearer token (useful for curl/external tools)
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        return await prisma.user.findUnique({
          where: { id: decoded.userId },
        });
      }
    }
  }

  // 2. Check for JWT token in cookies
  const token = (await cookies()).get("token")?.value;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      return await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
    }
  }

  return null;
}

export async function requireAdmin(req: Request) {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}
