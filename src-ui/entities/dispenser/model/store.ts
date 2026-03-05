import type { FuelingOrderEntity } from "@/shared/bindings/FuelingOrderEntity";
import type { NozzleDTO } from "@/shared/bindings/NozzleDTO";
import type { NozzleSummaryData } from "@/shared/bindings/NozzleSummaryData";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { dispenserApi } from "../api/dispenser-api";
import type {
  DispenserDTO,
  DispenserEntity,
  DispenserFuelingState,
  NozzleEntity,
} from "./types";

// Type for raw summary data input (with string values)
interface RawNozzleSummaryData {
  nozzle_id: string;
  fo_volume: string;
  fo_amount: string;
  oi_volume: string;
  oi_amount: string;
}

interface DispenserTotalData {
  dispenserId: string;
  nozzleAddress: number;
  // calculatedVolume: number;
  // calculatedAmount: number;
  totalVolume: number;
  totalAmount: number;
  shiftVolume: number;
  shiftAmount: number;
  lastUpdated: string;
}

interface DispenserStore {
  // State
  dispensers: DispenserEntity[];
  loading: boolean;
  error: string | null;
  presets: Record<string, FuelingOrderEntity | null>;
  nozzlePresets: Record<
    number,
    { presetType: string; presetValue: number; timestamp: number } | null
  >; // nozzleAddress -> backend preset data
  communicationStatus: Record<string, boolean>; // dispenserId -> isOnline (true/false)
  totals: Map<number, DispenserTotalData>; // nozzleAddress -> totals data
  summaryTotals: Map<string, NozzleSummaryData>; // nozzleId -> summary data from database

  // Track user selections to prevent automatic override
  userNozzleSelections: Record<
    string,
    { nozzleId: string | null; timestamp: number }
  >; // dispenserId -> selection

  // Add ordering functionality
  dispenserOrder: string[]; // Array of dispenser IDs in order

  // Actions
  loadDispensers: () => Promise<void>;
  saveDispenser: (dispenser: DispenserDTO) => Promise<DispenserEntity>;
  deleteDispenser: (id: string) => Promise<void>;
  clearError: () => void;
  updateDispenser: (dispenser: DispenserEntity) => void;

  // Nozzle management
  saveNozzle: (nozzle: NozzleDTO) => Promise<NozzleEntity>;
  getNozzles: (dispenserId: string) => Promise<NozzleEntity[]>;
  deleteNozzle: (id: string) => Promise<void>;

  // Preset management
  setDispenserPreset: (
    dispenserId: string,
    preset: FuelingOrderEntity | null
  ) => void;
  getDispenserPreset: (dispenserId: string) => FuelingOrderEntity | null;
  clearDispenserPreset: (dispenserId: string) => void;

  // Nozzle-address-based preset management (for backend presets)
  setNozzlePreset: (
    nozzleAddress: number,
    presetType: string,
    presetValue: number
  ) => void;
  getNozzlePreset: (
    nozzleAddress: number
  ) => { presetType: string; presetValue: number; timestamp: number } | null;
  clearNozzlePreset: (nozzleAddress: number) => void;
  clearAllNozzlePresets: () => void;

  // Communication status (simplified)
  updateDispenserCommStatusByById: (
    dispenserId: string,
    isOnline: boolean
  ) => void;
  isDispenserOnline: (dispenserId: string) => boolean;
  getDispenserCommStatus: (dispenserId: string) => "online" | "offline";

  // Debug helper
  getDispenserActivityInfo: (dispenserId: string) => {
    dispenserId: string;
    isOnline: boolean;
    error: string | null;
  };

  // Optimized state updates - separated fueling state from nozzle selection
  setDispenserFuelingStateByAddress: (
    address: number,
    state: DispenserFuelingState
  ) => void;
  updateFuelingStateByNozzleAddress: (
    nozzleAddress: number,
    state: DispenserFuelingState
  ) => void;
  setSelectedNozzleByAddress: (nozzleAddress: number) => void;
  setSelectedNozzleByUser: (
    dispenserId: string,
    nozzleId: string | null
  ) => void;
  setFuelingByNozzleAddress: (
    nozzleAddress: number,
    volume: number,
    amount: number
  ) => void;

  // Helper getters
  getDispenserByAddress: (address: number) => DispenserEntity | null;
  getDispenserByNozzleAddress: (
    nozzleAddress: number
  ) => DispenserEntity | null;

  // Totals management
  setTotalData: (
    address: number,
    totalVolume: number,
    totalAmount: number
  ) => void;
  setShiftData: (
    address: number,
    shiftVolume: number,
    shiftAmount: number
  ) => void;
  getTotalByAddress: (address: number) => DispenserTotalData | null;
  getAllTotals: () => DispenserTotalData[];
  clearTotals: () => void;

  // Summary totals management
  loadSummaryTotals: (
    startDate?: string,
    endDate?: string
  ) => Promise<Record<string, NozzleSummaryData>>;
  loadSummaryTotalsByDateRange: (
    dateRange: { from?: string; to?: string } | null
  ) => Promise<Record<string, NozzleSummaryData>>;
  setSummaryTotals: (
    summaryData: Record<string, NozzleSummaryData>
  ) => void;
  getSummaryTotalByNozzleId: (nozzleId: string) => NozzleSummaryData | null;
  getAllSummaryTotals: () => NozzleSummaryData[];
  clearSummaryTotals: () => void;

  // Ordering actions
  setDispenserOrder: (order: string[]) => void;
  getOrderedDispensers: () => DispenserEntity[];
  moveDispenser: (dispenserId: string, newPosition: number) => void;
}

export const useDispenserStore = create<DispenserStore>()(
  devtools(
    (set, get) => {
      // Private maps for O(1) access - these are not part of the store state
      let dispenserByIdMap = new Map<string, DispenserEntity>();
      let dispenserByBaseAddressMap = new Map<number, DispenserEntity>();
      let dispenserByNozzleAddressMap = new Map<number, DispenserEntity>();

      // Storage key for dispenser order
      const DISPENSER_ORDER_STORAGE_KEY = "dispenser-order";

      // Helper function to load order from localStorage
      const loadOrderFromLocalStorage = (): string[] => {
        try {
          const stored = localStorage.getItem(DISPENSER_ORDER_STORAGE_KEY);
          return stored ? JSON.parse(stored) : [];
        } catch (error) {
          console.error("Failed to load dispenser order from storage:", error);
          return [];
        }
      };

      // Helper function to save order to localStorage
      const saveOrderToLocalStorage = (order: string[]) => {
        try {
          localStorage.setItem(
            DISPENSER_ORDER_STORAGE_KEY,
            JSON.stringify(order)
          );
        } catch (error) {
          console.error("Failed to save dispenser order to storage:", error);
        }
      };

      // Helper function to rebuild maps
      const rebuildMaps = (dispensers: DispenserEntity[]) => {
        dispenserByIdMap.clear();
        dispenserByBaseAddressMap.clear();
        dispenserByNozzleAddressMap.clear();

        dispensers.forEach(dispenser => {
          if (dispenser.id) {
            dispenserByIdMap.set(dispenser.id, dispenser);
          }
          dispenserByBaseAddressMap.set(dispenser.base_address, dispenser);

          // Map each nozzle address to its dispenser
          dispenser.nozzles.forEach(nozzle => {
            dispenserByNozzleAddressMap.set(nozzle.address, dispenser);
          });
        });
      };

      // Helper function to update a single dispenser in maps
      const updateDispenserInMaps = (updatedDispenser: DispenserEntity) => {
        if (updatedDispenser.id) {
          dispenserByIdMap.set(updatedDispenser.id, updatedDispenser);
        }
        dispenserByBaseAddressMap.set(
          updatedDispenser.base_address,
          updatedDispenser
        );

        updatedDispenser.nozzles.forEach(nozzle => {
          dispenserByNozzleAddressMap.set(nozzle.address, updatedDispenser);
        });
      };

      return {
        // Initial state
        dispensers: [],
        loading: false,
        error: null,
        presets: {},
        nozzlePresets: {}, // nozzleAddress -> backend preset data
        communicationStatus: {}, // dispenserId -> isOnline (boolean)
        userNozzleSelections: {}, // Track user manual selections
        totals: new Map(), // nozzleAddress -> totals data
        summaryTotals: new Map(), // nozzleId -> summary data from database
        dispenserOrder: loadOrderFromLocalStorage(),

        // Actions
        loadDispensers: async () => {
          set({ loading: true, error: null });
          try {
            const dispensers = await dispenserApi.getDispensers();

            const savedOrder = get().dispenserOrder;

            // Sort dispensers by saved order
            const sortedDispensers = [...dispensers].sort((a, b) => {
              const aIndex = savedOrder.indexOf(a.id || "");
              const bIndex = savedOrder.indexOf(b.id || "");

              if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
              }
              if (aIndex !== -1) return -1;
              if (bIndex !== -1) return 1;
              return a.base_address - b.base_address;
            });

            // Update order with current dispensers
            const currentOrder = sortedDispensers
              .map(d => d.id)
              .filter((id): id is string => id !== null && id !== undefined);

            rebuildMaps(sortedDispensers);
            set({
              dispensers: sortedDispensers,
              dispenserOrder: currentOrder,
              loading: false,
            });

            saveOrderToLocalStorage(currentOrder);
          } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        saveDispenser: async (dispenserDto: DispenserDTO) => {
          set({ loading: true, error: null });
          try {
            const savedDispenser = await dispenserApi.saveDispenser(
              dispenserDto
            );
            const currentDispensers = get().dispensers;

            // Update if exists, otherwise insert
            let updatedDispensers: DispenserEntity[];
            const exists = currentDispensers.some(
              d => d.id === savedDispenser.id
            );
            if (exists) {
              updatedDispensers = currentDispensers.map(d =>
                d.id === savedDispenser.id ? savedDispenser : d
              );
            } else {
              updatedDispensers = [...currentDispensers, savedDispenser];
            }

            rebuildMaps(updatedDispensers); // Rebuild maps after change
            set({ dispensers: updatedDispensers, loading: false });
            return savedDispenser;
          } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        deleteDispenser: async (id: string) => {
          set({ loading: true, error: null });
          try {
            await dispenserApi.deleteDispenser(id);
            const currentDispensers = get().dispensers;
            const updatedDispensers = currentDispensers.filter(
              d => d.id !== id
            );
            rebuildMaps(updatedDispensers); // Rebuild maps after deletion
            set({ dispensers: updatedDispensers, loading: false });
          } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        // Nozzle management
        saveNozzle: async (nozzleDto: NozzleDTO) => {
          set({ loading: true, error: null });
          try {
            const savedNozzle = await dispenserApi.saveNozzle(nozzleDto);

            // Find the dispenser that owns this nozzle and update it
            if (savedNozzle.dispenser_id) {
              const currentDispensers = get().dispensers;
              const updatedDispensers = currentDispensers.map(dispenser => {
                if (dispenser.id === savedNozzle.dispenser_id) {
                  // Update or add the nozzle to the dispenser
                  const updatedNozzles = dispenser.nozzles.some(
                    n => n.id === savedNozzle.id
                  )
                    ? dispenser.nozzles.map(n =>
                        n.id === savedNozzle.id ? savedNozzle : n
                      )
                    : [...dispenser.nozzles, savedNozzle];

                  return { ...dispenser, nozzles: updatedNozzles };
                }
                return dispenser;
              });

              rebuildMaps(updatedDispensers);
              set({ dispensers: updatedDispensers, loading: false });
            } else {
              set({ loading: false });
            }

            return savedNozzle;
          } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        getNozzles: async (dispenserId: string) => {
          try {
            return await dispenserApi.getNozzles(dispenserId);
          } catch (error: any) {
            set({ error: error.message });
            throw error;
          }
        },

        deleteNozzle: async (id: string) => {
          set({ loading: true, error: null });
          try {
            await dispenserApi.deleteNozzle(id);

            // Remove the nozzle from the dispenser in state
            const currentDispensers = get().dispensers;
            const updatedDispensers = currentDispensers.map(dispenser => ({
              ...dispenser,
              nozzles: dispenser.nozzles.filter(n => n.id !== id),
            }));

            rebuildMaps(updatedDispensers);
            set({ dispensers: updatedDispensers, loading: false });
          } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        clearError: () => set({ error: null }),

        updateDispenser: updatedDispenser => {
          set(state => {
            const updatedDispensers = state.dispensers.map(d =>
              d.id === updatedDispenser.id ? updatedDispenser : d
            );
            rebuildMaps(updatedDispensers); // Rebuild maps after update
            return { dispensers: updatedDispensers };
          });
        },

        // Preset management
        setDispenserPreset: (dispenserId, preset) => {
          set(state => ({
            presets: {
              ...state.presets,
              [dispenserId]: preset,
            },
          }));
        },

        getDispenserPreset: dispenserId => {
          return get().presets[dispenserId] || null;
        },

        clearDispenserPreset: dispenserId => {
          set(state => {
            const newPresets = { ...state.presets };
            delete newPresets[dispenserId];
            return { presets: newPresets };
          });
        },

        // Nozzle-address-based preset management (for backend presets)
        setNozzlePreset: (nozzleAddress, presetType, presetValue) => {
          set(state => ({
            nozzlePresets: {
              ...state.nozzlePresets,
              [nozzleAddress]: {
                presetType,
                presetValue,
                timestamp: Date.now(),
              },
            },
          }));
        },

        getNozzlePreset: nozzleAddress => {
          return get().nozzlePresets[nozzleAddress] || null;
        },

        clearNozzlePreset: nozzleAddress => {
          set(state => {
            const newPresets = { ...state.nozzlePresets };
            delete newPresets[nozzleAddress];
            return { nozzlePresets: newPresets };
          });
        },

        clearAllNozzlePresets: () => {
          set({ nozzlePresets: {} });
        },

        // Communication status management (optimized to prevent unnecessary re-renders)
        updateDispenserCommStatusByById: (dispenserId, isOnline) => {
          const currentStatus = get().communicationStatus[dispenserId];

          // Only update if status actually changed
          if (currentStatus === isOnline) {
            return; // No change, skip update to prevent re-renders
          }


          set(state => ({
            communicationStatus: {
              ...state.communicationStatus,
              [dispenserId]: isOnline,
            },
          }));
        },

        isDispenserOnline: dispenserId => {
          const { communicationStatus } = get();
          // Default to false if no communication status is set
          return communicationStatus[dispenserId] === true;
        },

        getDispenserCommStatus: dispenserId => {
          const isOnline = get().isDispenserOnline(dispenserId);
          return isOnline ? "online" : "offline";
        },

        // Debug helper (simplified)
        getDispenserActivityInfo: dispenserId => {
          const { dispensers, communicationStatus } = get();
          const dispenser = dispensers.find(d => d.id === dispenserId);
          const isOnline = communicationStatus[dispenserId] === true;

          return {
            dispenserId,
            isOnline,
            error: dispenser?.error || null,
          };
        },

        // Optimized state updates using maps - O(1) access!
        setDispenserFuelingStateByAddress: (address, newState) => {
          const dispenser = dispenserByBaseAddressMap.get(address);
          if (!dispenser) return;
          const selected_nozzle_id =
            dispenser.nozzles.find(n => n.address === address)?.id ?? null;
          const updatedDispenser = {
            ...dispenser,
            selected_nozzle_id,
            fueling_state: newState,
          };

          set(state => ({
            dispensers: state.dispensers.map(d =>
              d.base_address === address ? updatedDispenser : d
            ),
          }));

          updateDispenserInMaps(updatedDispenser);
        },

        // Updated function - only updates fueling state, doesn't touch nozzle selection
        updateFuelingStateByNozzleAddress: (nozzleAddress, newState) => {
          const dispenser = dispenserByNozzleAddressMap.get(nozzleAddress);
          if (!dispenser) return;
          const selected_nozzle_id =
            dispenser.nozzles.find(n => n.address === nozzleAddress)?.id ??
            null;
          // Only update fueling state, preserve current selected_nozzle_id
          const updatedDispenser = {
            ...dispenser,
            selected_nozzle_id,
            fueling_state: newState,
          };

          set(state => ({
            dispensers: state.dispensers.map(d =>
              d.id === dispenser.id ? updatedDispenser : d
            ),
          }));

          updateDispenserInMaps(updatedDispenser);
        },

        // Backend-triggered nozzle selection (only if no recent user selection)
        setSelectedNozzleByAddress: nozzleAddress => {
          const dispenser = dispenserByNozzleAddressMap.get(nozzleAddress);
          if (!dispenser || !dispenser.id) return;

          // Check if user has made a recent selection (within last 10 seconds)
          const userSelection = get().userNozzleSelections[dispenser.id];
          const now = Date.now();
          const recentUserSelection =
            userSelection && now - userSelection.timestamp < 10000;

          // If user made a recent selection, don't override it
          if (recentUserSelection) {

            return;
          }

          const targetNozzle = dispenser.nozzles.find(
            n => n.address === nozzleAddress
          );
          if (!targetNozzle) return;

          const updatedDispenser = {
            ...dispenser,
            selected_nozzle_id: targetNozzle.id,
          };

          set(state => ({
            dispensers: state.dispensers.map(d =>
              d.id === dispenser.id ? updatedDispenser : d
            ),
          }));

          updateDispenserInMaps(updatedDispenser);
        },

        // User-triggered nozzle selection (always takes priority)
        setSelectedNozzleByUser: (dispenserId, nozzleId) => {
          const dispenser = dispenserByIdMap.get(dispenserId);
          if (!dispenser) return;

          // Record user selection with timestamp
          set(state => ({
            userNozzleSelections: {
              ...state.userNozzleSelections,
              [dispenserId]: {
                nozzleId,
                timestamp: Date.now(),
              },
            },
            dispensers: state.dispensers.map(d =>
              d.id === dispenserId ? { ...d, selected_nozzle_id: nozzleId } : d
            ),
          }));

          const updatedDispenser = {
            ...dispenser,
            selected_nozzle_id: nozzleId,
          };
          updateDispenserInMaps(updatedDispenser);


        },

        setFuelingByNozzleAddress: (nozzleAddress, volume, amount) => {
          const dispenser = dispenserByNozzleAddressMap.get(nozzleAddress);
          if (!dispenser || dispenser.id == null) return;

          const preset = get().getDispenserPreset(dispenser.id);
          if (!preset) return;

          const updatedPreset = {
            ...preset,
            volume,
            amount,
          };

          get().setDispenserPreset(dispenser.id, updatedPreset);

          const updatedDispenser = {
            ...dispenser,
            fueling_state: {
              ...dispenser.fueling_state,
              volume,
              amount,
            },
          };

          set(state => ({
            dispensers: state.dispensers.map(d =>
              d.id === dispenser.id ? updatedDispenser : d
            ),
          }));

          updateDispenserInMaps(updatedDispenser);
        },

        // Helper getters - O(1) access
        getDispenserByAddress: address => {
          return dispenserByBaseAddressMap.get(address) || null;
        },

        getDispenserByNozzleAddress: nozzleAddress => {
          return dispenserByNozzleAddressMap.get(nozzleAddress) || null;
        },

        // Totals management
        setTotalData: (
          address: number,
          totalVolume: number,
          totalAmount: number
        ) => {
          set(state => {
            const newTotals = new Map(state.totals);
            const dispenser = dispenserByNozzleAddressMap.get(address);
            const current = newTotals.get(address) || {
              dispenserId: dispenser?.id || "",
              nozzleAddress: address,
              totalVolume: 0,
              totalAmount: 0,
              shiftVolume: 0,
              shiftAmount: 0,
              lastUpdated: new Date().toISOString(),
            };

            newTotals.set(address, {
              ...current,
              totalVolume,
              totalAmount,
              lastUpdated: new Date().toISOString(),
            });

            return { totals: newTotals };
          });
        },

        setShiftData: (
          address: number,
          shiftVolume: number,
          shiftAmount: number
        ) => {
          set(state => {
            const newTotals = new Map(state.totals);
            const dispenser = dispenserByNozzleAddressMap.get(address);
            const current = newTotals.get(address) || {
              dispenserId: dispenser?.id || "",
              nozzleAddress: address,
              totalVolume: 0,
              totalAmount: 0,
              shiftVolume: 0,
              shiftAmount: 0,
              lastUpdated: new Date().toISOString(),
            };

            newTotals.set(address, {
              ...current,
              shiftVolume,
              shiftAmount,
              lastUpdated: new Date().toISOString(),
            });

            return { totals: newTotals };
          });
        },

        getTotalByAddress: (address: number) => {
          return get().totals.get(address) || null;
        },

        getAllTotals: () => {
          return Array.from(get().totals.values());
        },

        clearTotals: () => {
          set({ totals: new Map() });
        },

        // Summary totals management
        loadSummaryTotals: async (startDate?: string, endDate?: string) => {
          set({ loading: true, error: null });
          try {
            // Pass ISO format dates directly to API
            const summaryData = await dispenserApi.getSummaryTotalsByNozzle(
              startDate,
              endDate
            );

            get().setSummaryTotals(summaryData);
            set({ loading: false });
            return summaryData;
          } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
          }
        },

        loadSummaryTotalsByDateRange: async (
          dateRange: { from?: string; to?: string } | null
        ) => {
          const startDate = dateRange?.from;
          const endDate = dateRange?.to;
          return get().loadSummaryTotals(startDate, endDate);
        },

        setSummaryTotals: (
          summaryData:
            | NozzleSummaryData[]
            | Record<string, RawNozzleSummaryData>
        ) => {
          set(() => {
            const newSummaryTotals = new Map<string, NozzleSummaryData>();


            // Handle both array and object formats
            if (Array.isArray(summaryData)) {
              // Handle array format (from API)
              summaryData.forEach(data => {
                newSummaryTotals.set(data.nozzle_id, data);
              });
            } else {
              // Handle object format (with string values that need conversion)
              Object.values(summaryData).forEach(data => {
                const nozzleSummary: NozzleSummaryData = {
                  nozzle_id: data.nozzle_id,
                  fo_volume: parseFloat(data.fo_volume) || 0,
                  fo_amount: parseFloat(data.fo_amount) || 0,
                  oi_volume: parseFloat(data.oi_volume) || 0,
                  oi_amount: parseFloat(data.oi_amount) || 0,
                };
                newSummaryTotals.set(data.nozzle_id, nozzleSummary);
              });
            }

            return { summaryTotals: newSummaryTotals };
          });
        },

        getSummaryTotalByNozzleId: (nozzleId: string) => {
          return get().summaryTotals.get(nozzleId) || null;
        },

        getAllSummaryTotals: () => {
          return Array.from(get().summaryTotals.values());
        },

        clearSummaryTotals: () => {
          set({ summaryTotals: new Map() });
        },

        // Ordering actions
        setDispenserOrder: (order: string[]) => {
          set({ dispenserOrder: order });
          saveOrderToLocalStorage(order);
        },

        getOrderedDispensers: () => {
          const { dispensers, dispenserOrder } = get();



          if (dispenserOrder.length === 0) {
            const sorted = dispensers
              .slice()
              .sort((a, b) => a.base_address - b.base_address);

            return sorted;
          }

          // Sort dispensers by the saved order
          const orderedDispensers = [...dispensers].sort((a, b) => {
            const aIndex = dispenserOrder.indexOf(a.id || "");
            const bIndex = dispenserOrder.indexOf(b.id || "");

            // If both are in order, use that order
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }

            // If only a is in order, a comes first
            if (aIndex !== -1) return -1;

            // If only b is in order, b comes first
            if (bIndex !== -1) return 1;

            // If neither is in order, sort by base_address
            return a.base_address - b.base_address;
          });


          return orderedDispensers;
        },

        moveDispenser: (dispenserId: string, newPosition: number) => {


          const { dispenserOrder } = get();
          const currentOrder = [...dispenserOrder];
          const currentIndex = currentOrder.indexOf(dispenserId);



          if (currentIndex === -1) {
            // If dispenser not in order, add it at the position
            currentOrder.splice(newPosition, 0, dispenserId);

          } else {
            // Remove from current position and insert at new position
            currentOrder.splice(currentIndex, 1);
            currentOrder.splice(newPosition, 0, dispenserId);

          }

          set({ dispenserOrder: currentOrder });
          saveOrderToLocalStorage(currentOrder);

        },

        // Add the missing methods
        loadOrderFromStorage: () => {
          const order = loadOrderFromLocalStorage();
          set({ dispenserOrder: order });
        },

        saveOrderToStorage: () => {
          const { dispenserOrder } = get();
          saveOrderToLocalStorage(dispenserOrder);
        },
      };
    },
    { name: "dispenser-store" }
  )
);
