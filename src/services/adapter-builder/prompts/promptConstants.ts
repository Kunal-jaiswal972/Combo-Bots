// Shared constant choice lists and numeric bounds for the schedule prompts.

export const PERIOD_CHOICES = [
  { value: "AM" as const, label: "AM (morning)" },
  { value: "PM" as const, label: "PM (afternoon/evening)" },
];

export const HOUR_MIN = 1;
export const HOUR_MAX = 12;
export const MINUTE_MIN = 0;
export const MINUTE_MAX = 59;

export const MONTH_CHOICES = [
  { value: "0" as const, label: "January" },
  { value: "1" as const, label: "February" },
  { value: "2" as const, label: "March" },
  { value: "3" as const, label: "April" },
  { value: "4" as const, label: "May" },
  { value: "5" as const, label: "June" },
  { value: "6" as const, label: "July" },
  { value: "7" as const, label: "August" },
  { value: "8" as const, label: "September" },
  { value: "9" as const, label: "October" },
  { value: "10" as const, label: "November" },
  { value: "11" as const, label: "December" },
];

export const RECURRENCE_KIND_CHOICES = [
  { value: "daily" as const, label: "Every day at a set time" },
  {
    value: "weekly" as const,
    label: "On selected days every week at a set time",
  },
  { value: "once" as const, label: "Once at a specific date and time" },
  {
    value: "weeklyOnce" as const,
    label: "Every week on one day at a set time",
  },
];

export type RecurrenceKind = (typeof RECURRENCE_KIND_CHOICES)[number]["value"];
