import dayjs from "./dayjs";

/**
 * getCutoffRange(year, month)
 * Business month cutoff: 26 previous month -> 25 selected month
 * Returns UTC Date objects suitable for DB queries
 */
export function getCutoffRange(year: number, month: number) {
  // month is 1-12
  const mm = String(month).padStart(2, "0");
  // End at 25th of selected month, end of that day in Bangkok
  const endBangkok = dayjs.tz(`${year}-${mm}-25 23:59:59`, "Asia/Bangkok");
  const startBangkok = endBangkok
    .subtract(1, "month")
    .add(1, "day")
    .startOf("day");

  const startUtc = startBangkok.utc().toDate();
  const endUtc = endBangkok.utc().toDate();

  return { startUtc, endUtc };
}
