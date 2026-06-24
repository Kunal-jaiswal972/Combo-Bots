// Structured display contract: the data shape (DisplayCard) plus the surface
// that renders it (DisplayPresenter). Split into separate files if this grows.

export interface DisplayCardRow {
  readonly label: string;
  readonly value: string;
}

export interface DisplayCard {
  readonly title: string;
  readonly rows: readonly DisplayCardRow[];
  readonly footer?: string;
}

/** Renders structured cards (scheduled tasks, run history) for an adapter. */
export interface DisplayPresenter {
  displayCards(cards: readonly DisplayCard[]): void;
}
