import { BaseApi } from "@/shared/api/base";
import { ClientDTO } from "@/shared/bindings/ClientDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { PaginatorDTO } from "@/shared/bindings/dtos/PaginatorDTO";
import {
  ClientEntity,
  ClientLazyFilters,
  ClientSortField,
} from "../model/types";

class ClientApi extends BaseApi {
  async getClients(
    params: LazyTableStateDTO<ClientLazyFilters, ClientSortField>
  ): Promise<PaginatorDTO<ClientEntity>> {
    return this.request<PaginatorDTO<ClientEntity>>("get_clients", params);
  }

  async saveClient(clientDto: ClientDTO): Promise<ClientEntity> {
    return this.request<ClientEntity>("save_client", clientDto);
  }

  async getClientById(id: string): Promise<ClientEntity> {
    return this.request<ClientEntity>("get_client_by_id", { id });
  }

  async deleteClient(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_client", idDto);
  }
}

export const clientApi = new ClientApi();
