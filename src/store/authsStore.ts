// stores/authStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  login: async (access, refresh) => {
    await AsyncStorage.setItem("access_token", access);
    await AsyncStorage.setItem("refresh_token", refresh);

    set({
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");

    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  loadAuth: async () => {
    const access = await AsyncStorage.getItem("access_token");
    const refresh = await AsyncStorage.getItem("refresh_token");

    if (access && refresh) {
      set({
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
      });
    }
  },
}));
