import { BaseApi } from "@/shared/api/base";
import { MarkDTO } from "@/shared/bindings/MarkDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { MarkEntity } from "../model/types";

class MarkApi extends BaseApi {
  async getMarks(): Promise<MarkEntity[]> {
    return this.request<MarkEntity[]>("get_marks");
  }

  async saveMark(markDto: MarkDTO): Promise<MarkEntity> {
    return this.request<MarkEntity>("save_mark", markDto);
  }

  async deleteMark(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_mark", idDto);
  }
}

export const markApi = new MarkApi();
