import { updateClockSchema } from "@/lib/validation/clock";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import dayjs from "@/lib/dayjs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateClockSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
      });
    }

    const user = await getCurrentUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const record = await prisma.clockRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
      });
    }

    // RBAC: Only owner or admin can update
    if (user.role !== "admin" && record.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const updateData: any = {};
    if (parsed.data.departmentId) updateData.departmentId = parsed.data.departmentId;
    if (parsed.data.workDetail !== undefined) updateData.workDetail = parsed.data.workDetail;
    
    let startWorkTime = record.startWorkTime;
    let endWorkTime = record.endWorkTime;

    if (parsed.data.startWorkTime) {
      startWorkTime = dayjs(parsed.data.startWorkTime).utc().toDate();
      updateData.startWorkTime = startWorkTime;
    }
    
    if (parsed.data.endWorkTime !== undefined) {
      endWorkTime = parsed.data.endWorkTime ? dayjs(parsed.data.endWorkTime).utc().toDate() : null;
      updateData.endWorkTime = endWorkTime;
    }

    // Recalculate hours if times changed
    if (endWorkTime) {
      const start = dayjs(startWorkTime);
      const end = dayjs(endWorkTime);
      if (end.isBefore(start)) {
        return new Response(
          JSON.stringify({ error: "End time cannot be before start time" }),
          { status: 400 }
        );
      }
      const minutes = end.diff(start, "minute");
      updateData.totalHours = Math.round((minutes / 60) * 100) / 100;
    } else {
      updateData.totalHours = null;
    }

    const updated = await prisma.clockRecord.update({
      where: { id },
      data: updateData,
    });

    return new Response(JSON.stringify({ data: updated }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const record = await prisma.clockRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
      });
    }

    // RBAC: Only owner or admin can delete
    if (user.role !== "admin" && record.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    await prisma.clockRecord.delete({
      where: { id },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500 }
    );
  }
}
