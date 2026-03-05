import { DispenserEntity } from "../bindings/DispenserEntity";
import { NozzleEntity } from "../bindings/NozzleEntity";
import { SortOrder } from "../bindings/SortOrder";

export const formatStrDate = (value: string | null) => {
  if (value) {
    const currentDate = new Date(value);
    const year = currentDate.getFullYear();
    const month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    const day = ("0" + currentDate.getDate()).slice(-2);

    return `${year}/${month}/${day}`;
  } else {
    return "";
  }
};

export const formatStrDateTime = (value: string | null): string => {
  if (value) {
    const currentDate = new Date(value);
    const year = currentDate.getFullYear();
    const month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    const day = ("0" + currentDate.getDate()).slice(-2);
    const hours = ("0" + currentDate.getHours()).slice(-2);
    const minutes = ("0" + currentDate.getMinutes()).slice(-2);
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  } else {
    return "";
  }
};

export const getStrId = (id: string | number): string => {
  if (typeof id === "string") {
    // For UUID strings, show last 8 characters
    return "#" + id.slice(-8).toUpperCase();
  }
  return "#" + id.toString().padStart(7, "0");
};
export const getShortStrId = (id: string | number | null): string => {
  if (id == null) return "#0000";
  if (typeof id === "string") {
    // For UUID strings, show last 4 characters
    return "#" + id.slice(-4).toUpperCase();
  }
  return `#${id.toString().padStart(4, "0")}`;
};

export function padTo2Digits(num: number) {
  return num.toString().padStart(2, "0");
}

export const formatDate = (value: Date) => {
  return value.toLocaleDateString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatStringDate = (value: string) => {
  let dateTime = new Date(value);
  return dateTime.toLocaleDateString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const dateToISOString = (date: Date): string => {
  // Set time to start of day and return ISO string
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay.toISOString();
};

export function formatDateTime(date: Date): string {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("-") +
    " " +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(":")
  );
}

export function getCurrentTimeFormatted(): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
  const day = ("0" + currentDate.getDate()).slice(-2);
  const hours = ("0" + currentDate.getHours()).slice(-2);
  const minutes = ("0" + currentDate.getMinutes()).slice(-2);
  const seconds = ("0" + currentDate.getSeconds()).slice(-2);
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

export function deepEqual<T>(obj1: T, obj2: T): boolean {
  // Check if the objects are the same instance
  if (obj1 === obj2) return true;

  // Check if both are objects
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  )
    return false;

  // Check if they have the same number of keys
  const keys1 = Object.keys(obj1) as (keyof T)[];
  const keys2 = Object.keys(obj2) as (keyof T)[];
  if (keys1.length !== keys2.length) return false;

  // Check if all keys and their values are equal recursively
  for (let key of keys1) {
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

// export function checkFilter(filter: DataTableFilterMeta): boolean {
//     for (const f of Object.values(filter)) {
//         if (isDataTableFilter(f) && f.value != null) {
//             return false;
//         }
//     }
//     return true;
// }

// function isDataTableFilter(filter: any): filter is DataTableFilterMetaData {
//     return filter && typeof filter === 'object' && 'value' in filter;
// }

export function getSelectedNozzle(
  dispenser: DispenserEntity
): NozzleEntity | null {
  if (dispenser.selected_nozzle_id) {
    return (
      dispenser.nozzles.find(
        nozzle => nozzle.id === dispenser.selected_nozzle_id
      ) ?? null
    );
  }
  return null;
}

export function updateOrInsertImmutable<
  T extends { id: string | number | null }
>(array: T[], item: T): T[] {
  // Find the index of the object based on the predicate
  const index = array.findIndex(data => data.id === item.id);

  if (index !== -1) {
    return array.map((obj, i) => (i === index ? { ...obj, ...item } : obj));
  } else {
    return [item, ...array];
  }
}

export function deleteImmutable<T extends { id: string | number | null }>(
  array: T[],
  id: string | number
): T[] {
  return array.filter(item => item.id !== id);
}

// New function to update or insert an item in the paginator
// export function updateOrInsertPaginatorItem<T extends { id: number | null }>(
//     paginator: PaginatorDTO<T>,
//     item: T
// ): { page: number; per_page: number; total: number; items: Array<T> } {
//     const updatedItems = updateOrInsertImmutable(paginator.items, item);
//     return {
//         ...paginator,
//         items: updatedItems,

//     };
// }

// export function deletePaginatorItem<T extends { id: number | null }>(
//   paginator: PaginatorDTO<T>,
//   id: number,
// ): { page: number; per_page: number; total: number; items: Array<T> } {
//   const updatedItems = deleteImmutable(paginator.items, id);
//   return {
//     ...paginator,
//     items: updatedItems,
//     total: paginator.total - 1,
//   };
// }

export const convertToSnakeCase = (str: string) => {
  let res = str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  if (res.startsWith("_")) {
    res = res.slice(1);
  }
  return res;
};

export const convertToCamelCase = (str: string) => {
  return str.replace(/([-_][a-z])/gi, $1 => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
};

export const convertToPascaleCase = (str: string) => {
  let result = str.replace(/([-_][a-z])/gi, group => {
    return group.toUpperCase().replace("-", "").replace("_", "");
  });
  return result.charAt(0).toUpperCase() + result.slice(1);
};

export const getTableSortOrder = (sortOrder: SortOrder) => {
  return sortOrder === "Asc" ? 1 : -1;
};
export const tableSortOrderToData = (
  sortOrder: 0 | 1 | -1 | null | undefined
) => {
  return sortOrder === 1 ? "Asc" : "Desc";
};
