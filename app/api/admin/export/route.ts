import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCutoffRange } from "@/lib/cutoff";
import ExcelJS from "exceljs";
import dayjs from "@/lib/dayjs";

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin)
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const year = url.searchParams.get("year")
      ? Number(url.searchParams.get("year"))
      : null;
    const month = url.searchParams.get("month")
      ? Number(url.searchParams.get("month"))
      : null;

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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Clock Report");

    sheet.columns = [
      { header: "User", key: "user", width: 24 },
      { header: "Department", key: "dept", width: 20 },
      { header: "Start Time", key: "start", width: 22 },
      { header: "End Time", key: "end", width: 22 },
      { header: "Total Hours", key: "hours", width: 12 },
      { header: "Work Detail", key: "detail", width: 40 },
    ];

    for (const r of records) {
      sheet.addRow({
        user: `${r.user.firstName} ${r.user.lastName}`,
        dept: r.department.name,
        start: dayjs(r.startWorkTime)
          .tz("Asia/Bangkok")
          .format("YYYY-MM-DD HH:mm"),
        end: r.endWorkTime
          ? dayjs(r.endWorkTime).tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm")
          : "",
        hours: r.totalHours ?? "",
        detail: r.workDetail ?? "",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="clock-report.xlsx"`,
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500 },
    );
  }
}
