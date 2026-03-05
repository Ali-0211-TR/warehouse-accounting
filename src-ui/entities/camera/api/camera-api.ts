import { BaseApi } from "@/shared/api/base";
import { CameraDTO } from "@/shared/bindings/CameraDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { CameraEntity } from "../model/types";

class CameraApi extends BaseApi {
  async getCameras(): Promise<CameraEntity[]> {
    return this.request<CameraEntity[]>("get_cameras");
  }

  async saveCamera(cameraDto: CameraDTO): Promise<CameraEntity> {
    return this.request<CameraEntity>("save_camera", cameraDto);
  }

  async deleteCamera(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_camera", idDto);
  }
}

export const cameraApi = new CameraApi();
