import { SlugPageParams } from "./react-router.types.ts";

export const pathKeys = {
  root: "/",
  login() {
    return pathKeys.root.concat("login/");
  },
  register() {
    return pathKeys.root.concat("register/");
  },

  //=======Home========
  home() {
    return pathKeys.root;
  },
  shift() {
    return pathKeys.root.concat("shift/");
  },
  orders() {
    return pathKeys.root.concat("orders/");
  },
  contracts() {
    return pathKeys.root.concat("contracts/");
  },
  clients() {
    return pathKeys.root.concat("clients/");
  },

  //=======Operations========
  sales() {
    return pathKeys.root.concat("sales/");
  },
  income() {
    return pathKeys.root.concat("income/");
  },
  outcome() {
    return pathKeys.root.concat("outcome/");
  },
  returns() {
    return pathKeys.root.concat("returns/");
  },

  //=======Reports========
  summary() {
    return pathKeys.root.concat("summary/");
  },
  shift_report() {
    return pathKeys.root.concat("shift_report/");
  },
  product_report() {
    return pathKeys.root.concat("product_report/");
  },
  movements_report() {
    return pathKeys.root.concat("movements_report/");
  },
  comparison() {
    return pathKeys.root.concat("comparison/");
  },

  //=======Dictionary========
  users() {
    return pathKeys.root.concat("user/");
  },
  discounts() {
    return pathKeys.root.concat("discounts/");
  },
  groups() {
    return pathKeys.root.concat("groups/");
  },
  units() {
    return pathKeys.root.concat("units/");
  },
  marks() {
    return pathKeys.root.concat("marks/");
  },
  products() {
    return pathKeys.root.concat("products/");
  },
  taxes() {
    return pathKeys.root.concat("taxes/");
  },

  //=======Warehouse========
  warehouse() {
    return pathKeys.root.concat("warehouse/");
  },

  //=======Settings========
  settings() {
    return pathKeys.root.concat("settings/");
  },
  profile() {
    return pathKeys.root.concat("profile/");
  },

  //======Service pages=======
  page404() {
    return pathKeys.root.concat("404/");
  },
  accessDenied() {
    return pathKeys.root.concat("access-denied/");
  },

  editor: {
    root() {
      return pathKeys.root.concat("editor/");
    },
    bySlug({ slug }: SlugPageParams) {
      return pathKeys.editor.root().concat(slug, "/");
    },
  },
};
