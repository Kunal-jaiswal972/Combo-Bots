/** Metadata-bearing payload from a scheduled job — adapters route on metadata only. */
export interface SchedulableRunPayload {
  readonly metadata?: Readonly<Record<string, string>>;
}

/** Routes a scheduler-triggered run to the adapter that created it (e.g. Telegram DM). */
export interface ScheduledRunNotifier {
  canNotify(payload: SchedulableRunPayload): boolean;
  notify(payload: SchedulableRunPayload): Promise<void>;
}
