import { useState } from "react";
import { ProfileFormContext, type ProfileValues } from "./profile_context";

// contexts/profile-form.context.tsx
export default function ProfileContext({
  children,
  active: ac,
  components,
}: {
  children?: React.ReactNode;
  active: string;
  components: { name: string; com: React.ReactNode }[];
}) {
  const [active, setActive] = useState(ac);
  const [values, setValue] = useState<ProfileValues | null>(null);

  const idx = components.findIndex((el) => el.name == active);

  function next() {
    if (idx + 1 < components.length) {
      setActive(components[idx + 1].name);
    }
  }

  function prev() {
    if (idx - 1 >= 0) {
      setActive(components[idx - 1].name);
    }
  }

  function setFormValue(name: keyof ProfileValues, value: any) {
    setValue((prev) => ({
      ...prev!,
      [name]: value,
    }));
  }

  const com = components.find((el) => el.name == active)?.com
  return (
    <ProfileFormContext.Provider value={{ components, component: com, setActive, active, values, setFormValue, next, prev }}>
      {children ?? com}
    </ProfileFormContext.Provider>
  );
}
