import { ClientType } from "../bindings/ClientType";
import { DiscountBoundType } from "../bindings/DiscountBoundType";
import { DiscountType } from "../bindings/DiscountType";
import { DiscountUnitType } from "../bindings/DiscountUnitType";
import { DispenserState } from "../bindings/DispenserState";
import { OrderType } from "../bindings/OrderType";
import { ProductType } from "../bindings/ProductType";
import { RoleType } from "../bindings/RoleType";

export type UnexpectedErrorDto = {
  errors: {
    body: string[];
  };
};
export const allRoles: RoleType[] = [
  "Administrator",
  "Manager",
  "Seller",
  "Operator",
  "Remote",
];

export const allOrderTypes: OrderType[] = [
  "Income",
  "Outcome",
  "Sale",
  "Returns",
];

export const allClientTypes: ClientType[] = [
  "Juridical",
  "Physical",
  "Postpayment",
  "Prepayment",
  "Seller",
];

export const allProductTypes: ProductType[] = [
  "Service",
  "Product",
];

export const allDiscountUnitTypes: DiscountUnitType[] = [
  "Percent",
  "MoneySum",
  "MoneyPrice",
  "Count",
];

export const allDiscountBoundTypes: DiscountBoundType[] = ["Money", "Volume"];

export const allDiscountTypes: DiscountType[] = ["Price", "Card"];

export const allDispenserStates: DispenserState[] = [
  "Active",
  "Blocked",
  "Inactive",
];

export interface PaginationInfo {
  page: number;
  count: number;
  limit: number;
  pageCount: number;
}

export const defaultPagination: PaginationInfo = {
  page: 0,
  count: 0,
  limit: 0,
  pageCount: 0,
};
