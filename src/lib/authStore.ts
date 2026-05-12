import { create } from 'zustand';
import { authAPI } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  businessId: string;
  avatar?: string;
  lastLogin?: string;
}

interface Business {
  id: string;
  name: string;
  type: string;
  city?: string;
  plan: string;
  aiCreditsUsed?: number;
  aiCreditsLimit?: number;
  contactsLimit?: number;
  messagesLimit?: number;
  usersLimit?: number;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  brandColors?: { primary?: string; secondary?: string };
}

interface AuthState {
  user: User | null;
  business: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  onboardingCompleted: boolean;
  isDemoMode: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => void;
  register: (data: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    businessType: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
  setOnboardingCompleted: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  business: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  onboardingCompleted: false,
  isDemoMode: false,

  initialize: async () => {
    set({ isLoading: true });

    // Check for demo mode
    const demoMode = localStorage.getItem('demoMode') === 'true';
    if (demoMode) {
      const demoUser: User = {
        id: 'demo-user-id',
        email: 'bizzauto.solution@gmail.com',
        name: 'Demo User',
        phone: '+91 8983027975',
        role: 'OWNER',
        businessId: 'demo-business-id',
        avatar: undefined,
        lastLogin: new Date().toISOString(),
      };

      const demoBusiness: Business = {
        id: 'demo-business-id',
        name: 'Demo Business',
        type: 'general',
        city: 'Demo City',
        plan: 'FREE',
        aiCreditsUsed: 5,
        aiCreditsLimit: 10,
        contactsLimit: 100,
        messagesLimit: 100,
        phone: '+91 8983027975',
        email: 'demo@bizzauto.com',
        address: 'Demo Address',
        website: 'https://www.bizzautoai.com',
      };

      set({
        token: 'demo-token',
        user: demoUser,
        business: demoBusiness,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
        onboardingCompleted: true,
        isDemoMode: true,
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      set({ isInitialized: true, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await authAPI.getProfile();
      const { user, business } = res.data.data;
      const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
      set({
        token,
        user,
        business,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
        onboardingCompleted,
      });
    } catch {
      localStorage.removeItem('token');
      set({ token: null, user: null, business: null, isAuthenticated: false, isInitialized: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ email, password });
      const { user, business, token } = res.data.data;
      localStorage.setItem('token', token);
      set({ user, business, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.error || error.response?.data?.message || 'Invalid email or password';
      throw new Error(message);
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.register(data);
      const { user, business, token } = res.data.data;
      localStorage.setItem('token', token);
      set({ user, business, token, isAuthenticated: true, isLoading: false, onboardingCompleted: false });
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please try again.';
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('demoMode');
    set({ user: null, business: null, token: null, isAuthenticated: false, onboardingCompleted: false });
  },

  demoLogin: () => {
    // Enable demo mode
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('onboardingCompleted', 'true');

    const demoUser: User = {
      id: 'demo-user-id',
      email: 'bizzauto.solution@gmail.com',
      name: 'Demo User',
      phone: '+91 8983027975',
      role: 'OWNER',
      businessId: 'demo-business-id',
      avatar: undefined,
      lastLogin: new Date().toISOString(),
    };

    const demoBusiness: Business = {
      id: 'demo-business-id',
      name: 'Demo Business',
      type: 'general',
      city: 'Demo City',
      plan: 'PRO',
      aiCreditsUsed: 45,
      aiCreditsLimit: 1000,
      phone: '+91 8983027975',
      email: 'bizzauto.solution@gmail.com',
      address: 'I610,windsor county,Ambegaon bk,pune 411046',
      website: 'https://www.bizzautoai.com',
    };

    set({
      token: 'demo-token',
      user: demoUser,
      business: demoBusiness,
      isAuthenticated: true,
      isLoading: false,
      onboardingCompleted: true,
      isDemoMode: true,
    });
  },

  updateProfile: async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      const { user } = res.data.data;
      set({ user });
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Update failed. Please try again.';
      throw new Error(message);
    }
  },

  setOnboardingCompleted: (val) => {
    localStorage.setItem('onboardingCompleted', val ? 'true' : 'false');
    set({ onboardingCompleted: val });
  },
}));
