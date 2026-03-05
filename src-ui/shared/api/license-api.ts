import { BaseApi } from "./base";

export interface LicenseInfo {
  machine_id: string;
  offline_run_count?: number;
  max_offline_runs?: number;
  /** Days remaining until license expiry. Null for perpetual. */
  days_remaining?: number | null;
  /** License type name (e.g. "Demo", "Standard") */
  license_type?: string | null;
  /** License expiry date as ISO 8601 string */
  expiry_date?: string | null;
  /** Whom the license is issued to */
  issued_to?: string | null;
}

class LicenseApiClass extends BaseApi {
  async checkLicenseStatus(): Promise<boolean> {
    return await this.request<boolean>("check_license_status");
  }

  async getMachineId(): Promise<string> {
    return await this.request<string>("get_machine_id");
  }

  async getLicenseInfo(): Promise<LicenseInfo> {
    return await this.request<LicenseInfo>("get_license_info");
  }
}

export const LicenseApi = new LicenseApiClass();
