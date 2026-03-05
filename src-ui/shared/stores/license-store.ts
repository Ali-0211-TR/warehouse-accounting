import { create } from "zustand";

interface LicenseExpiryWarning {
  daysRemaining: number;
  expiryDate: string;
  licenseType: string;
  message: string;
}

interface LicenseState {
  expiryWarning: LicenseExpiryWarning | null;
  dismissed: boolean;
  setExpiryWarning: (warning: LicenseExpiryWarning) => void;
  dismiss: () => void;
  reset: () => void;
}

export const useLicenseStore = create<LicenseState>((set) => ({
  expiryWarning: null,
  dismissed: false,
  setExpiryWarning: (warning) => set({ expiryWarning: warning, dismissed: false }),
  dismiss: () => set({ dismissed: true }),
  reset: () => set({ expiryWarning: null, dismissed: false }),
}));
