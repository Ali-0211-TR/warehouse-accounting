import { BaseApi } from "@/shared/api/base";
import { DispenserDTO } from "@/shared/bindings/DispenserDTO";
import { DispenserStartDTO } from "@/shared/bindings/dtos/DispenserStartDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { NozzleDTO } from "@/shared/bindings/NozzleDTO";
import { NozzleSummaryData } from "@/shared/bindings/NozzleSummaryData";
import { DispenserEntity, NozzleEntity } from "../model/types";

class DispenserApi extends BaseApi {
  async getDispensers(): Promise<DispenserEntity[]> {
    return this.request<DispenserEntity[]>("get_dispensers");
  }

  async getSummaryTotalsByNozzle(
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, NozzleSummaryData>> {
    const params: { start_date: string | null; end_date: string | null } = {
      start_date: null,
      end_date: null,
    };

    // Pass the full ISO format strings to the backend
    if (startDate && startDate.trim() !== "") {
      params.start_date = startDate; // Keep full ISO format like "2025-08-05T00:00:00.000Z"
    }

    if (endDate && endDate.trim() !== "") {
      params.end_date = endDate; // Keep full ISO format like "2025-08-22T23:59:59.999Z"
    }

    // Backend expects ISO format dates like "2025-08-05T00:00:00.000Z"
    // When no dates provided, send explicit null values

    return this.request<Record<string, NozzleSummaryData>>(
      "get_summary_totals_by_nozzle",
      params
    );
  }

  async saveDispenser(dispenserDto: DispenserDTO): Promise<DispenserEntity> {
    return this.request<DispenserEntity>("save_dispenser", dispenserDto);
  }

  async deleteDispenser(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_dispenser", idDto);
  }

  // --- Nozzle Management ---

  async saveNozzle(nozzleDto: NozzleDTO): Promise<NozzleEntity> {
    return this.request<NozzleEntity>("save_nozzle", nozzleDto);
  }

  async getNozzles(dispenserId: string): Promise<NozzleEntity[]> {
    const idDto: IdDTO = { id: dispenserId };
    return this.request<NozzleEntity[]>("get_nozzles", idDto);
  }

  async deleteNozzle(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_nozzle", idDto);
  }

  // --- Dispenser Control Commands using simpleRequest ---

  async startFueling(params: DispenserStartDTO): Promise<DispenserEntity> {
    return this.simpleRequest<DispenserEntity>("start_fueling", params);
  }

  async stopFueling(address: number): Promise<void> {
    await this.simpleRequest("stop_fueling", { address });
  }

  async pauseFueling(address: number): Promise<void> {
    await this.simpleRequest("pause_fueling", { address });
  }

  async resumeFueling(address: number): Promise<void> {
    await this.simpleRequest("resume_fueling", { address });
  }

  async selectNextNozzle(dest_address: number): Promise<void> {
    await this.simpleRequest("select_next_nozzle", { dest_address });
  }

  async writePrice(address: number, price: number): Promise<boolean> {
    return this.simpleRequest<boolean>("write_price", { address, price });
  }

  async readPrice(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_price", { address });
  }

  async writeSolenoid(address: number, val: number): Promise<boolean> {
    return this.simpleRequest<boolean>("write_solenoid", { address, val });
  }

  async readSolenoid(): Promise<boolean> {
    return this.simpleRequest<boolean>("read_solenoid");
  }

  async presetAmount(val: number, price: number): Promise<boolean> {
    return this.simpleRequest<boolean>("preset_amount", { val, price });
  }

  async presetVolume(
    address: number,
    val: number,
    price: number
  ): Promise<boolean> {
    return this.simpleRequest<boolean>("preset_volume", {
      address,
      val,
      price,
    });
  }

  async readFueling(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_fueling", { address });
  }

  async readTotal(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_total", { address });
  }

  async readShiftTotal(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_shift_total", { address });
  }

  async askControl(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("ask_control", { address });
  }

  async returnControl(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("return_control", { address });
  }

  async clearShiftTotal(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("clear_shift_total", { address });
  }

  async readPreset(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_preset", { address });
  }

  async readCardId(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_card_id", { address });
  }

  async readErrorCode(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_error_code", { address });
  }

  async readId(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_id", { address });
  }

  async resetKbPresetFlag(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("reset_kb_preset_flag", { address });
  }

  async resetErrorFlag(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("reset_error_flag", { address });
  }

  async readPressure(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_pressure", { address });
  }

  async readFlow(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_flow", { address });
  }

  async readDencity(address: number): Promise<boolean> {
    return this.simpleRequest<boolean>("read_dencity", { address });
  }

  async writeDencity(dencity: number): Promise<boolean> {
    return this.simpleRequest<boolean>("write_dencity", { dencity });
  }
}

export const dispenserApi = new DispenserApi();
