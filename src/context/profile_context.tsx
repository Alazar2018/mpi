import { createContext, useContext } from "react";

export type Address = {
  streetAddress: string;
  streetAddress2?: string;
  city: string;
  stateProvince: string;
  country: string;
  zipCode: string;
};

export type CreateUser = {
  firstName: string;
  lastName: string;
  avatar?: File | null;
  gender: "male" | "female";
  dateOfBirth: string;
  phoneNumber: string;
  phoneNumberCountryCode: string;
};

export type ProfileValues = {
  role: string;
  password: string;
  user: CreateUser;
  address: Address;
};

export const ProfileFormContext = createContext<{
	component: React.ReactNode,
	components: { name: string; com: React.ReactNode }[],
	active: string,
  values: ProfileValues | null;
	setActive: (name: string) => void;
  setFormValue: (name: keyof ProfileValues, value: any) => void;
  next: () => void;
  prev: () => void;
} | null>(null);

export const useProfileForm = () => useContext(ProfileFormContext);
