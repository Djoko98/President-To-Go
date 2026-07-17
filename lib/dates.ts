import { addMinutes, format, isAfter, isBefore, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const BELGRADE_TIMEZONE = "Europe/Belgrade";

export interface BusinessDay {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  breakStartsAt?: string | null;
  breakEndsAt?: string | null;
  isClosed: boolean;
}

function withTime(day: Date, value: string): Date {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  const result = startOfDay(day);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function generatePickupSlots({
  day,
  hours,
  now = new Date(),
  intervalMinutes,
  minimumPreparationMinutes,
  blocked = [],
}: {
  day: Date;
  hours: BusinessDay;
  now?: Date;
  intervalMinutes: number;
  minimumPreparationMinutes: number;
  blocked?: Array<{ startsAt: Date; endsAt: Date }>;
}): Date[] {
  if (hours.isClosed || !hours.opensAt || !hours.closesAt) return [];
  const zonedDay = toZonedTime(day, BELGRADE_TIMEZONE);
  const zonedNow = toZonedTime(now, BELGRADE_TIMEZONE);
  const earliest = addMinutes(zonedNow, minimumPreparationMinutes);
  const opens = withTime(zonedDay, hours.opensAt);
  const closes = withTime(zonedDay, hours.closesAt);
  const breakStart = hours.breakStartsAt ? withTime(zonedDay, hours.breakStartsAt) : null;
  const breakEnd = hours.breakEndsAt ? withTime(zonedDay, hours.breakEndsAt) : null;
  const slots: Date[] = [];

  for (let cursor = opens; isBefore(cursor, closes); cursor = addMinutes(cursor, intervalMinutes)) {
    if (isBefore(cursor, earliest)) continue;
    if (breakStart && breakEnd && !isBefore(cursor, breakStart) && isBefore(cursor, breakEnd)) continue;
    const utc = fromZonedTime(cursor, BELGRADE_TIMEZONE);
    if (blocked.some((range) => !isBefore(utc, range.startsAt) && isBefore(utc, range.endsAt))) continue;
    slots.push(utc);
  }
  return slots;
}

export function formatBelgradeTime(value: string | Date): string {
  return format(toZonedTime(new Date(value), BELGRADE_TIMEZONE), "HH:mm");
}

export function isPickupInPast(value: string | Date, now = new Date()): boolean {
  return isBefore(new Date(value), now) || !isAfter(new Date(value), now);
}
