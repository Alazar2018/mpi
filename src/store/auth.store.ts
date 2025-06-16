import { create } from 'zustand'

export type Role = "player" | "coach" | "parent";

export interface EmailAddress {
  email: string;
  verified: boolean;
}

export interface PhoneNumber {
  countryCode: string;
  number: string;
}

export interface Address {
  streetAddress: string;
  streetAddress2: string;
  city: string;
  stateProvince: string;
  country: string;
  zipCode: string;
}

export interface NotificationSettings {
  enabled: boolean;
  notificationType: string[];
  notificationFrequency: string;
}


export interface NotificationPreference {
  emailNotification: NotificationSettings;
  pushNotification: NotificationSettings;
}

export interface User {
  _id: string;
  isRegistrationComplete: boolean;
  hasOtp: boolean;
  badge: number;
  firstName: string;
  lastName: string;
  emailAddress: EmailAddress;
  dateOfBirth: string;
  gender: string;
  phoneNumber: PhoneNumber;
  address: Address;
  isProfilePublic: boolean;
  notificationPreference: NotificationPreference;
  avatar: string;
  role: Role;
  googleId: string;
  lastOnline: string;
  provider: string;
  __t: string;
  children: string[];
  id: string;
}

interface AuthState {
  otp: string | null,
  email: string | null;
  user: User | null;
	accessToken: string | null;
  refreshToken: string | null;
  setEmail: (email: string) => void;
  setOtp: (otp: string) => void;
  setUser: (user: User) => void;
  setToken: (accessToken: string, refreshToken: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  email: null,
  otp: null,
  user: null,
	accessToken: null,
  refreshToken: null,
  setEmail: (email: string) => set((state) => ({ ...state, email })),
  setUser: (user) => set((state) => ({ ...state, user })),
  setOtp: (otp) => set((state) => ({ ...state, otp })),
	setToken: (accessToken: string, refreshToken: string) => set((state) => ({ ...state, accessToken, refreshToken })),
  clearUser: () => set({ user: null })
}));
