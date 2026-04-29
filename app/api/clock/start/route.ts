import { NextRequest } from "next/server";
import { startClockSchema } from "@/lib/validation/clock";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import dayjs from "@/lib/dayjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = startClockSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
      });
    }

    const user = await getCurrentUser(req);
    if (!user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });

    if (user.role === "admin") {
      return new Response(
        JSON.stringify({ error: "Admins cannot create clock records" }),
        { status: 403 },
      );
    }

    // Prevent overlapping active clock
    const active = await prisma.clockRecord.findFirst({
      where: { userId: user.id, endWorkTime: null },
    });
    if (active) {
      return new Response(
        JSON.stringify({ error: "Active session already exists" }),
        { status: 409 },
      );
    }

    // Ensure startWorkTime is normalized to UTC before storing
    const startUtc = dayjs(parsed.data.startWorkTime).utc().toDate();

    const created = await prisma.clockRecord.create({
      data: {
        userId: user.id,
        departmentId: parsed.data.departmentId,
        startWorkTime: startUtc,
        workDetail: parsed.data.workDetail || null,
      },
    });

    return new Response(JSON.stringify({ data: created }), { status: 201 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500 },
    );
  }
}
