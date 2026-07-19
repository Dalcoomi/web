export type TransactionTypeFilter = "ALL" | "EXPENSE" | "INCOME";

export interface CreatorFilterOption {
  nickname: string;
  profileImageUrl?: string | null;
}

export interface TransactionFilterState {
  type: TransactionTypeFilter;
  categoryNames: string[];
  creatorNicknames: string[];
}

export interface TransactionCategoriesByType {
  ALL: string[];
  EXPENSE: string[];
  INCOME: string[];
}

export const createEmptyTransactionFilter = (): TransactionFilterState => ({
  type: "ALL",
  categoryNames: [],
  creatorNicknames: [],
});

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isTransactionTypeFilter = (
  value: unknown,
): value is TransactionTypeFilter =>
  value === "ALL" || value === "EXPENSE" || value === "INCOME";

export const areSameStringSets = (selected: string[], all: string[]) =>
  selected.length === all.length && all.every((item) => selected.includes(item));

export const areTransactionFiltersEqual = (
  first: TransactionFilterState,
  second: TransactionFilterState,
) =>
  first.type === second.type &&
  first.categoryNames.length === second.categoryNames.length &&
  first.creatorNicknames.length === second.creatorNicknames.length &&
  first.categoryNames.every((item) => second.categoryNames.includes(item)) &&
  first.creatorNicknames.every((item) =>
    second.creatorNicknames.includes(item),
  );

export const readStoredTransactionFilter = (
  storageKey: string,
): TransactionFilterState | null => {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Partial<TransactionFilterState>;
    if (
      !isTransactionTypeFilter(candidate.type) ||
      !isStringArray(candidate.categoryNames) ||
      !isStringArray(candidate.creatorNicknames)
    ) {
      return null;
    }

    return {
      type: candidate.type,
      categoryNames: candidate.categoryNames,
      creatorNicknames: candidate.creatorNicknames,
    };
  } catch {
    return null;
  }
};

export const normalizeTransactionFilter = (
  filter: TransactionFilterState,
  allCategories: string[],
  allCreators: string[] = [],
): TransactionFilterState => ({
  ...filter,
  categoryNames: filter.categoryNames.filter((name) =>
    allCategories.includes(name),
  ),
  creatorNicknames:
    allCreators.length === 0
      ? filter.creatorNicknames
      : filter.creatorNicknames.filter((nickname) =>
          allCreators.includes(nickname),
        ),
});
