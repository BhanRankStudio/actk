import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Default timezone for display
dayjs.tz.setDefault("Asia/Bangkok");

export default dayjs;

export const formatDisplay = (date: string | Date) =>
  dayjs(date).tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm");

export const toUtcIsoFromBangkok = (localInput: string) =>
  dayjs.tz(localInput, "Asia/Bangkok").utc().toISOString();
