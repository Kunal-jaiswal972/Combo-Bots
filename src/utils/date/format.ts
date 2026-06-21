export const DATE_FORMAT_RUN = "YYYY-MM-DD";

export function getTodayRunDate(): string {
  return new Date().toISOString().slice(0, DATE_FORMAT_RUN.length);
}

export function formatScheduleInstant(iso: string | null | undefined): string {
  if (!iso) {
    return "none";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export interface FormatRelativeTimeUntilOptions {
  readonly now?: Date;
}

/** Human-readable countdown, e.g. "in 3 mins", "in 2 hours", "now". */
export function formatRelativeTimeUntil(
  iso: string,
  options: FormatRelativeTimeUntilOptions = {},
): string {
  const target = new Date(iso);
  const now = options.now ?? new Date();

  if (Number.isNaN(target.getTime())) {
    return "";
  }

  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "now";
  }

  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 60) {
    return seconds === 1 ? "in 1 sec" : `in ${seconds} secs`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return minutes === 1 ? "in 1 min" : `in ${minutes} mins`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
  }

  const days = Math.floor(hours / 24);

  return days === 1 ? "in 1 day" : `in ${days} days`;
}
