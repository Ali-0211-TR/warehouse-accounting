// Utility functions for date conversion

export const convertDateRangeToISO = (
  dateRange: { from?: string; to?: string } | null | undefined
) => {
  if (!dateRange?.from) return null;
  return [
    `${new Date(dateRange.from).toISOString()}`,
    `${new Date(dateRange.to ? dateRange.to : Date.now()).toISOString()}`,
  ] as [string, string];
};

export const convertISOToDateRange = (isoRange: [string, string] | null) => {
  if (!isoRange) return undefined;
  return {
    from: new Date(isoRange[0]).toISOString(),
    to: new Date(isoRange[1]).toISOString(),
  };
};

export const formatDateForAPI = (date: string): string => {
  // Return empty string as-is (caller should handle this)
  if (!date || date.trim() === "") {
    return "";
  }

  // Ensure date is in YYYY-MM-DD format for API
  if (date.includes("T")) {
    return date.split("T")[0];
  }
  return date;
};

export const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

export const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
};
