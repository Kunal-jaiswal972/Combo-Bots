import type { DisplayCard } from "@/shared/adapters/host/contracts/displayCard.js";

/** Renders structured cards (scheduled tasks, run history) for an adapter. */
export interface DisplayPresenter {
  displayCards(cards: readonly DisplayCard[]): void;
}
