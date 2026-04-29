import { manualClockSchema } from "@/lib/validation/clock";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import dayjs from "@/lib/dayjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = manualClockSchema.safeParse(body);
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

    const startUtc = dayjs(parsed.data.startWorkTime).utc();
    const endUtc = dayjs(parsed.data.endWorkTime).utc();

    if (endUtc.isBefore(startUtc)) {
      return new Response(
        JSON.stringify({ error: "End time cannot be before start time" }),
        { status: 400 },
      );
    }

    const minutes = endUtc.diff(startUtc, "minute");
    const hours = Math.round((minutes / 60) * 100) / 100;

    const created = await prisma.clockRecord.create({
      data: {
        userId: user.id,
        departmentId: parsed.data.departmentId,
        startWorkTime: startUtc.toDate(),
        endWorkTime: endUtc.toDate(),
        totalHours: hours,
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
