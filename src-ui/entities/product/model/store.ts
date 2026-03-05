import { PriceDTO } from "@/shared/bindings/PriceDTO";
import { PriceEntity } from "@/shared/bindings/PriceEntity";
import { ProductInputDTO } from "@/shared/bindings/dtos/ProductInputDTO";
import { create } from "zustand";
import { productApi } from "../api/product-api";
import { ProductEntity } from "./types";

interface ProductStore {
  products: ProductEntity[];
  loading: boolean;
  error: string | null;
  setProduct: (product: ProductEntity) => void;
  // Product operations
  loadProducts: () => Promise<void>;
  saveProduct: (product: ProductInputDTO) => Promise<ProductEntity>;
  deleteProduct: (id: string) => Promise<void>;
  restoreProduct: (id: string) => Promise<ProductEntity>;
  calculateBalance: (productId: string) => Promise<void>;
  calculateAllBalances: () => Promise<void>;

  // Price operations
  // savePrices: (productId: string, prices: PriceEntity[]) => Promise<ProductEntity>
  loadPrices: (productId: string) => Promise<PriceEntity[]>;
  savePrice: (prices: PriceDTO) => Promise<PriceEntity>;
  deletePrice: (price: PriceEntity) => Promise<void>;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  setProduct: (product: ProductEntity) => {
    set(state => ({
      products: state.products.map(p => (p.id === product.id ? product : p)),
    }));
  },

  loadProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await productApi.getProducts();
      set({ products, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load products";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  saveProduct: async (productDto: ProductInputDTO) => {
    set({ loading: true, error: null });
    try {
      const savedProduct = await productApi.saveProduct(productDto);

      // Update products list
      const { products } = get();
      const updatedProducts = productDto.id
        ? products.map(p => (p.id === productDto.id ? savedProduct : p))
        : [...products, savedProduct];

      set({ products: updatedProducts, loading: false });
      return savedProduct;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save product";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await productApi.deleteProduct(id);

      // Remove from products list
      const { products } = get();
      const updatedProducts = products.filter(p => p.id !== id);
      set({ products: updatedProducts, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete product";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  restoreProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const restoredProduct = await productApi.restoreProduct(id);

      // Add back to products list or update if already exists
      const { products } = get();
      const existingIndex = products.findIndex(p => p.id === id);

      const updatedProducts =
        existingIndex >= 0
          ? products.map(p => (p.id === id ? restoredProduct : p))
          : [...products, restoredProduct];

      set({ products: updatedProducts, loading: false });
      return restoredProduct;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to restore product";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  calculateBalance: async (productId: string) => {
    try {
      await productApi.calculateBalance(productId);
      // Reload products to get updated balances
      await get().loadProducts();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to calculate balance";
      set({ error: errorMessage });
      throw error;
    }
  },

  calculateAllBalances: async () => {
    set({ loading: true, error: null });
    try {
      await productApi.calculateAllBalances();
      // Reload products to get updated balances
      await get().loadProducts();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to calculate all balances";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Price operations
  savePrice: async (price: PriceDTO) => {
    set({ loading: true, error: null });
    try {
      const updatedPrice = await productApi.savePrice(price);
      set(state => {
        const products = state.products.map(product => {
          if (product.id !== updatedPrice.product_id) return product;
          const prices = product.prices.some(p => p.id === updatedPrice.id)
            ? product.prices.map(p =>
                p.id === updatedPrice.id ? updatedPrice : p
              )
            : [...product.prices, updatedPrice];

          // Recompute active prices locally (only prices with start_time <= now)
          const now = new Date();
          const getActivePrice = (type: string) => {
            const active = prices
              .filter(p => p.price_type === type && new Date(p.start_time) <= now)
              .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
            return active.length > 0 ? active[0].value : 0;
          };

          return {
            ...product,
            prices,
            sale_price: getActivePrice("Sale"),
            income_price: getActivePrice("Income"),
            outcome_price: getActivePrice("Outcome"),
          };
        });
        return { products, loading: false };
      });
      return updatedPrice; // Return the saved price with real ID
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save prices";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  loadPrices: async (productId: string) => {
    try {
      const prices = await productApi.getPrices(productId);

      // Update the product in the store with fresh prices and recompute active prices
      // NOTE: This local recomputation mirrors the backend logic in
      // ProductEntity::compute_price_by_type (product_entity.rs).
      // Backend is the source of truth; this is optimistic UI only.
      set(state => {
        const products = state.products.map(product => {
          if (product.id !== productId) return product;
          const now = new Date();
          const getActivePrice = (type: string) => {
            const active = prices
              .filter(p => p.price_type === type && new Date(p.start_time) <= now)
              .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
            return active.length > 0 ? active[0].value : 0;
          };
          return {
            ...product,
            prices,
            sale_price: getActivePrice("Sale"),
            income_price: getActivePrice("Income"),
            outcome_price: getActivePrice("Outcome"),
          };
        });
        return { products };
      });

      return prices;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load prices";
      set({ error: errorMessage });
      throw error;
    }
  },

  deletePrice: async (price: PriceEntity) => {
    try {
      await productApi.deletePrice(price);

      // Remove the price locally and recompute active prices
      if (price.product_id) {
        set(state => {
          const products = state.products.map(product => {
            if (product.id !== price.product_id) return product;
            const prices = product.prices.filter(p => p.id !== price.id);

            const now = new Date();
            const getActivePrice = (type: string) => {
              const active = prices
                .filter(p => p.price_type === type && new Date(p.start_time) <= now)
                .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
              return active.length > 0 ? active[0].value : 0;
            };

            return {
              ...product,
              prices,
              sale_price: getActivePrice("Sale"),
              income_price: getActivePrice("Income"),
              outcome_price: getActivePrice("Outcome"),
            };
          });
          return { products };
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete price";
      set({ error: errorMessage });
      throw error;
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
