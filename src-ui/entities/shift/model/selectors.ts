import type { ShiftEntity, ShiftFilterState } from "./types";

export const shiftSelectors = {
  filterShifts: (
    shifts: ShiftEntity[],
    filters: ShiftFilterState
  ): ShiftEntity[] => {
    return shifts.filter(shift => {
      const matchesSearch =
        !filters.search ||
        shift.id?.toString().includes(filters.search) ||
        shift.user_open?.full_name
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        shift.user_close?.full_name
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesUser =
        !filters.user_id ||
        shift.user_open?.id === filters.user_id ||
        shift.user_close?.id === filters.user_id;

      const matchesDateRange =
        !filters.date_range ||
        ((!filters.date_range.start ||
          shift.d_open >= filters.date_range.start) &&
          (!filters.date_range.end || shift.d_open <= filters.date_range.end));

      const matchesIsOpen =
        filters.is_open === undefined ||
        (filters.is_open ? !shift.d_close : !!shift.d_close);

      return matchesSearch && matchesUser && matchesDateRange && matchesIsOpen;
    });
  },

  sortShifts: (
    shifts: ShiftEntity[],
    sortBy: keyof ShiftEntity = "d_open"
  ): ShiftEntity[] => {
    return [...shifts].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return bVal.localeCompare(aVal); // Most recent first
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return bVal - aVal; // Highest first
      }

      return 0;
    });
  },

  getOpenShifts: (shifts: ShiftEntity[]): ShiftEntity[] => {
    return shifts.filter(shift => !shift.d_close);
  },

  getClosedShifts: (shifts: ShiftEntity[]): ShiftEntity[] => {
    return shifts.filter(shift => !!shift.d_close);
  },

  getShiftsByUser: (shifts: ShiftEntity[], userId: string): ShiftEntity[] => {
    return shifts.filter(
      shift => shift.user_open?.id === userId || shift.user_close?.id === userId
    );
  },

  getShiftsByDateRange: (
    shifts: ShiftEntity[],
    startDate: string,
    endDate: string
  ): ShiftEntity[] => {
    return shifts.filter(
      shift => shift.d_open >= startDate && shift.d_open <= endDate
    );
  },

  calculateShiftDuration: (shift: ShiftEntity): number | null => {
    if (!shift.d_close) return null;

    const openTime = new Date(shift.d_open).getTime();
    const closeTime = new Date(shift.d_close).getTime();
    return closeTime - openTime;
  },

  getCurrentOpenShift: (shifts: ShiftEntity[]): ShiftEntity | null => {
    const openShifts = shifts.filter(shift => !shift.d_close);
    return openShifts.length > 0 ? openShifts[0] : null;
  },
};
