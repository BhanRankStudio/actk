import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCutoffRange } from "@/lib/cutoff";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });

    const url = new URL(req.url);
    let userId = url.searchParams.get("userId");
    const year = url.searchParams.get("year")
      ? Number(url.searchParams.get("year"))
      : null;
    const month = url.searchParams.get("month")
      ? Number(url.searchParams.get("month"))
      : null;

    // RBAC: If not admin, you can only fetch your own data
    if (user.role !== "admin") {
      userId = user.id;
    }

    let where: any = {};

    if (userId) where.userId = userId;

    if (year && month) {
      const { startUtc, endUtc } = getCutoffRange(year, month);
      where.startWorkTime = { gte: startUtc, lte: endUtc };
    }

    const records = await prisma.clockRecord.findMany({
      where,
      include: { user: true, department: true },
      orderBy: { startWorkTime: "desc" },
    });

    const summary = url.searchParams.get("summary") === "true";

    if (summary && user.role === "admin" && !userId) {
      const userSummaryMap = new Map<string, any>();

      records.forEach((r: (typeof records)[number]) => {
        if (!userSummaryMap.has(r.userId)) {
          userSummaryMap.set(r.userId, {
            user: r.user,
            totalHours: 0,
            recordCount: 0,
          });
        }
        const s = userSummaryMap.get(r.userId);
        s.totalHours += r.totalHours ?? 0;
        s.recordCount += 1;
      });

      return new Response(
        JSON.stringify({ data: Array.from(userSummaryMap.values()) }),
        {
          status: 200,
        },
      );
    }

    const totalHours = records.reduce((sum: number, r: typeof records[number]) => sum + (r.totalHours ?? 0), 0);

    return new Response(JSON.stringify({ data: records, totalHours }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500 },
    );
  }
}
