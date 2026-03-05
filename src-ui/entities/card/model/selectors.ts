import type { CardEntity, CardFilterState } from "./types";

export const cardSelectors = {
  filterCards: (
    cards: CardEntity[],
    filters: CardFilterState
  ): CardEntity[] => {
    return cards.filter(card => {
      const matchesSearch =
        !filters.search ||
        card.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        card.comment.toLowerCase().includes(filters.search.toLowerCase());

      const matchesClient =
        !filters.client_id || card.client?.id === filters.client_id;

      const matchesState = !filters.state || card.state === filters.state;

      const matchesDateRange =
        !filters.date_range ||
        (new Date(card.d_begin) >= filters.date_range.start &&
          new Date(card.d_end) <= filters.date_range.end);

      return matchesSearch && matchesClient && matchesState && matchesDateRange;
    });
  },

  sortCards: (
    cards: CardEntity[],
    sortBy: keyof CardEntity = "name"
  ): CardEntity[] => {
    return [...cards].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal - bVal;
      }

      return 0;
    });
  },

  getCardsByState: (cards: CardEntity[], state: string): CardEntity[] => {
    return cards.filter(card => card.state === state);
  },

  getActiveCards: (cards: CardEntity[]): CardEntity[] => {
    const now = new Date();
    return cards.filter(card => {
      const begin = new Date(card.d_begin);
      const end = new Date(card.d_end);
      return begin <= now && end >= now && card.state === "Ready";
    });
  },

  getExpiredCards: (cards: CardEntity[]): CardEntity[] => {
    const now = new Date();
    return cards.filter(card => new Date(card.d_end) < now);
  },

  getCardsByClient: (cards: CardEntity[], clientId: string): CardEntity[] => {
    return cards.filter(card => card.client?.id === clientId);
  },

  getCardsWithLimits: (cards: CardEntity[]): CardEntity[] => {
    return cards.filter(card => card.limits && card.limits.length > 0);
  },
};
