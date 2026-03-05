import { BaseApi } from "@/shared/api/base";
import { ClientIdWithIncludeDTO } from "@/shared/bindings/dtos/ClientIdWithIncludeDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { IdWithIncludeDTO } from "@/shared/bindings/dtos/IdWithIncludeDTO";
import type { CardEntity } from "../model/types";

class CardApi extends BaseApi {
  async getCards(): Promise<CardEntity[]> {
    return this.request<CardEntity[]>("get_cards");
  }

  async getCardById(
    id: string,
    include_nested: boolean = false
  ): Promise<CardEntity> {
    const params: IdWithIncludeDTO = { id, include_nested };
    return this.request<CardEntity>("get_card_by_id", params);
  }

  async getCardsByClientId(
    client_id: string,
    include_limits: boolean = true
  ): Promise<CardEntity[]> {
    const params: ClientIdWithIncludeDTO = { client_id, include_limits };
    return this.request<CardEntity[]>("get_cards_by_client_id", params);
  }

  async saveCard(card: CardEntity): Promise<CardEntity> {
    return this.request<CardEntity>("save_card", card);
  }

  async deleteCard(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_card", idDto);
  }
}

export const cardApi = new CardApi();
