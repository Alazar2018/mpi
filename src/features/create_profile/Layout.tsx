import ProfileContext from "@/context/profile_form_context";
import { useAuthStore } from "@/store/auth.store";
import { Outlet, useNavigate } from "react-router";
import CreateRole from "./create_role";
import ProfileForm from "./profile_form";
import AddressForm from "./address_form";
import Password from "./password";
import YouAreOnMindset from "./you_are_on_mindset";
import { useEffect } from "react";

export default function ProfileLayout() {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (!authStore.email || !authStore.otp) {
  //     navigate("/create_account");
  //   }
  // }, [authStore.email, authStore.otp, navigate])

  const components = [
    { name: "role", com: <CreateRole /> },
    { name: "profile", com: <ProfileForm /> },
    { name: "address", com: <AddressForm /> },
    { name: "pass", com: <Password /> },
    { name: "mindset", com: <YouAreOnMindset /> },
  ];

  return (
    <div
      style={{
        backgroundImage: 'url("/bg-image.jpg")',
      }}
      className="relative bg-right bg-cover w-full h-full"
    >
      <div
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(30, 30, 30, 0) 0%, rgba(30, 30, 30, 0.7) 47.6%)",
        }}
        className="overflow-auto absolute grid place-items-center p-24 inset-0"
      >
        <ProfileContext components={components} active="role">
          <Outlet />
        </ProfileContext>
      </div>
    </div>
  );
}
