"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAnimatedModal } from "@/hooks/useAnimatedModal";
import {
  areSameStringSets,
  areTransactionFiltersEqual,
  createEmptyTransactionFilter,
  normalizeTransactionFilter,
  readStoredTransactionFilter,
  type TransactionCategoriesByType,
  type TransactionFilterState,
} from "@/features/transaction/model/transactionFilter";

interface UseTransactionFiltersOptions {
  storageKey: string;
  categoriesByType: TransactionCategoriesByType;
  creatorNicknames?: string[];
  enabled?: boolean;
}

const EMPTY_CREATOR_NICKNAMES: string[] = [];

export function useTransactionFilters({
  storageKey,
  categoriesByType,
  creatorNicknames = EMPTY_CREATOR_NICKNAMES,
  enabled = true,
}: UseTransactionFiltersOptions) {
  const [appliedFilter, setAppliedFilter] = useState<TransactionFilterState>(
    createEmptyTransactionFilter,
  );
  const [draftFilter, setDraftFilter] = useState<TransactionFilterState>(
    createEmptyTransactionFilter,
  );
  const hydratedStorageKeyRef = useRef<string | null>(null);
  const skipNextPersistRef = useRef(false);
  const {
    isMounted: isFilterModalMounted,
    isOpen: showFilterModal,
    open: openModal,
    close: closeModal,
  } = useAnimatedModal();

  useEffect(() => {
    const allCategories = categoriesByType.ALL;
    if (!enabled || allCategories.length === 0) return;

    if (hydratedStorageKeyRef.current !== storageKey) {
      const defaultFilter: TransactionFilterState = {
        ...createEmptyTransactionFilter(),
        categoryNames: allCategories,
        creatorNicknames,
      };
      const stored = readStoredTransactionFilter(storageKey);
      const next = normalizeTransactionFilter(
        stored ?? defaultFilter,
        allCategories,
        creatorNicknames,
      );

      setAppliedFilter(next);
      setDraftFilter(next);
      hydratedStorageKeyRef.current = storageKey;
      skipNextPersistRef.current = true;
      return;
    }

    setAppliedFilter((previous) => {
      const next = normalizeTransactionFilter(
        previous,
        allCategories,
        creatorNicknames,
      );
      return areTransactionFiltersEqual(previous, next) ? previous : next;
    });
    setDraftFilter((previous) => {
      const next = normalizeTransactionFilter(
        previous,
        allCategories,
        creatorNicknames,
      );
      return areTransactionFiltersEqual(previous, next) ? previous : next;
    });
  }, [categoriesByType.ALL, creatorNicknames, enabled, storageKey]);

  useEffect(() => {
    if (!enabled || hydratedStorageKeyRef.current !== storageKey) return;
    if (typeof window === "undefined") return;

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    sessionStorage.setItem(storageKey, JSON.stringify(appliedFilter));
  }, [appliedFilter, enabled, storageKey]);

  const openFilter = useCallback(() => {
    setDraftFilter(appliedFilter);
    openModal();
  }, [appliedFilter, openModal]);

  const resetFilter = useCallback(() => {
    setDraftFilter({
      type: "ALL",
      categoryNames: categoriesByType.ALL,
      creatorNicknames,
    });
  }, [categoriesByType.ALL, creatorNicknames]);

  const applyFilter = useCallback(() => {
    setAppliedFilter(draftFilter);
    closeModal();
  }, [closeModal, draftFilter]);

  const isFilterApplied = useMemo(() => {
    const isCategoryFilterApplied =
      categoriesByType.ALL.length > 0 &&
      appliedFilter.categoryNames.length > 0 &&
      !areSameStringSets(
        appliedFilter.categoryNames,
        categoriesByType.ALL,
      );
    const isCreatorFilterApplied =
      creatorNicknames.length > 0 &&
      appliedFilter.creatorNicknames.length > 0 &&
      !areSameStringSets(
        appliedFilter.creatorNicknames,
        creatorNicknames,
      );

    return (
      appliedFilter.type !== "ALL" ||
      isCategoryFilterApplied ||
      isCreatorFilterApplied
    );
  }, [appliedFilter, categoriesByType.ALL, creatorNicknames]);

  return {
    appliedFilter,
    draftFilter,
    setDraftFilter,
    filterButtonLabel: isFilterApplied ? "필터 적용 중" : "필터",
    isFilterModalMounted,
    showFilterModal,
    openFilter,
    closeFilter: closeModal,
    resetFilter,
    applyFilter,
  };
}
