import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  AppModeType,
  LangType,
  PrinterWidthType,
  SettingsEntity,
  ThemeType,
} from "./settings.types.ts";

export interface SettingsStoreState {
  data: SettingsEntity;
  setSettings: (settings: SettingsEntity) => void;
  setLanguage: (lang: LangType) => void;
  setTheme: (theme: ThemeType) => void;
  /** @deprecated use setOrderPrinterWidth / setLabelPrinterWidth */
  setPrinterWidth: (width: PrinterWidthType) => void;
  setOrderPrinterWidth: (width: PrinterWidthType) => void;
  setLabelPrinterWidth: (width: PrinterWidthType) => void;
  setAppMode: (mode: AppModeType) => void;
  /** @deprecated use setOrderPrinterName */
  setPrinterName: (name: string) => void;
  setOrderPrinterName: (name: string) => void;
  setLabelPrinterName: (name: string) => void;
  setPrintOnCloseOrder: (enabled: boolean) => void;
  isInitialized: boolean;
  setInitialized: (initialized: boolean) => void;
}

export const useSettingsState = create<SettingsStoreState>()(
  persist(
    set => ({
      data: {
        lang: "ru",
        theme: "dark",
  printerWidth: "80mm",
  orderPrinterWidth: "80mm",
  labelPrinterWidth: "58mm",
        printOnCloseOrder: false,
  appMode: "fuel",
  orderPrinterName: "",
  labelPrinterName: "",
      },
      isInitialized: false,
      setSettings: settings => {
        set({ data: settings });
      },
      setLanguage: lang => {
        set(state => ({
          data: { ...state.data, lang },
        }));
      },
      setTheme: (theme: ThemeType) => {
        set(state => ({
          data: { ...state.data, theme },
        }));
      },
      setPrinterWidth: (printerWidth: PrinterWidthType) => {
        set(state => ({
          data: {
            ...state.data,
            printerWidth,
            orderPrinterWidth: state.data.orderPrinterWidth ?? printerWidth,
            labelPrinterWidth: state.data.labelPrinterWidth ?? printerWidth,
          },
        }));
      },
      setOrderPrinterWidth: (orderPrinterWidth: PrinterWidthType) => {
        set(state => ({
          data: {
            ...state.data,
            orderPrinterWidth,
            // keep deprecated field in sync for old code paths
            printerWidth: orderPrinterWidth,
          },
        }));
      },
      setLabelPrinterWidth: (labelPrinterWidth: PrinterWidthType) => {
        set(state => ({
          data: {
            ...state.data,
            labelPrinterWidth,
          },
        }));
      },
      setAppMode: (appMode: AppModeType) => {
        set(state => ({
          data: { ...state.data, appMode },
        }));
      },
      setPrinterName: (printerName: string) => {
        set(state => ({
          data: { ...state.data, printerName, orderPrinterName: printerName },
        }));
      },
      setOrderPrinterName: (orderPrinterName: string) => {
        set(state => ({
          data: { ...state.data, orderPrinterName },
        }));
      },
      setLabelPrinterName: (labelPrinterName: string) => {
        set(state => ({
          data: { ...state.data, labelPrinterName },
        }));
      },
      setPrintOnCloseOrder: (printOnCloseOrder: boolean) => {
        set(state => ({
          data: { ...state.data, printOnCloseOrder },
        }));
      },
      setInitialized: initialized => set({ isInitialized: initialized }),
    }),
    {
      name: "settings-storage", // name of item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default the 'localStorage' is used
  version: 3,
      migrate: (persistedState: any, version) => {
        // Migrate older settings where order printer was stored in 'printerName'
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState;
        }

        if (version < 2) {
          const data = persistedState.data ?? {};
          const printerName = data.printerName;
          const orderPrinterName = data.orderPrinterName ?? printerName ?? "";
          return {
            ...persistedState,
            data: {
              ...data,
              orderPrinterName,
            },
          };
        }

        // v3: split printerWidth into orderPrinterWidth and labelPrinterWidth
        if (version < 3) {
          const data = persistedState.data ?? {};
          const legacyWidth: PrinterWidthType = data.orderPrinterWidth ?? data.printerWidth ?? "80mm";
          return {
            ...persistedState,
            data: {
              ...data,
              orderPrinterWidth: data.orderPrinterWidth ?? legacyWidth,
              labelPrinterWidth: data.labelPrinterWidth ?? "58mm",
              // keep deprecated property so older code doesn't break
              printerWidth: data.printerWidth ?? legacyWidth,
            },
          };
        }

        return persistedState;
      },
    }
  )
);
