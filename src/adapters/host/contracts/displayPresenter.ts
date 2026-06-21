import type { DisplayCard } from "@/adapters/host/contracts/displayCard";

/** Renders structured cards (scheduled tasks, run history) for an adapter. */
export interface DisplayPresenter {
  displayCards(cards: readonly DisplayCard[]): void;
}
