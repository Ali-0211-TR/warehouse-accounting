import { listen } from "@tauri-apps/api/event";
import { HubEvent } from "../../shared/bindings/HubEvent";
import { OrderEntity } from "../../shared/bindings/OrderEntity";
import { ProductEntity } from "../../shared/bindings/ProductEntity";
import { useOrderStore } from "@/entities/order";
import { useProductStore } from "@/entities/product";

export const eventListener = () => {
  return listen("HubEvent", event => {
    let payload = event.payload as HubEvent;
    checkPayload(payload);
  });
};

const checkPayload = async (payload: HubEvent) => {
  if (typeof payload === "object" && "ActiveOrder" in payload) {
    const activeOrder = payload.ActiveOrder as OrderEntity;
    useOrderStore.getState().updateOrAddActiverOrder(activeOrder);
  } else if (typeof payload === "object" && "ProductUpdated" in payload) {
    const product = payload.ProductUpdated as ProductEntity;
    useProductStore.getState().setProduct(product);
  }
};
