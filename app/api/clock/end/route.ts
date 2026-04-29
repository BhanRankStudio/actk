import { endClockSchema } from "@/lib/validation/clock";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import dayjs from "@/lib/dayjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = endClockSchema.safeParse(body);
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
        JSON.stringify({ error: "Admins cannot end clock records" }),
        { status: 403 },
      );
    }

    const record = await prisma.clockRecord.findUnique({
      where: { id: parsed.data.clockRecordId },
    });
    if (!record)
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    if (record.userId !== user.id)
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    if (record.endWorkTime)
      return new Response(JSON.stringify({ error: "Record already ended" }), {
        status: 409,
      });

    const endUtc = dayjs(parsed.data.endWorkTime).utc();
    const startUtc = dayjs(record.startWorkTime).utc();
    const minutes = endUtc.diff(startUtc, "minute");
    const hours = Math.round((minutes / 60) * 100) / 100;

    const updated = await prisma.clockRecord.update({
      where: { id: record.id },
      data: { endWorkTime: endUtc.toDate(), totalHours: hours },
    });

    return new Response(JSON.stringify({ data: updated }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500 },
    );
  }
}
