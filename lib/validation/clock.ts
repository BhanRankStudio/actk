import { z } from "zod";

export const startClockSchema = z.object({
  departmentId: z.string().uuid(),
  startWorkTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "Invalid ISO datetime",
  }),
  workDetail: z.string().max(1000).optional(),
});

export const endClockSchema = z.object({
  clockRecordId: z.string().uuid(),
  endWorkTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "Invalid ISO datetime",
  }),
});

export const manualClockSchema = z.object({
  departmentId: z.string().uuid(),
  startWorkTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "Invalid ISO datetime",
  }),
  endWorkTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "Invalid ISO datetime",
  }),
  workDetail: z.string().max(1000).optional(),
});

export const updateClockSchema = z.object({
  departmentId: z.string().uuid().optional(),
  startWorkTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "Invalid ISO datetime",
  }).optional(),
  endWorkTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "Invalid ISO datetime",
  }).nullable().optional(),
  workDetail: z.string().max(1000).nullable().optional(),
});
