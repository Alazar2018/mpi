import ProfileContext from "@/context/profile_form_context";
import CreateRole from "./create_role";
import ProfileForm from "./profile_form";
import AddressForm from "./address_form";
import Password from "./password";
import YouAreOnMindset from "./you_are_on_mindset";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

export default function ProfileLayout() {
  const authStore = useAuthStore();
  
  // Debug logging
  console.log("ProfileLayout render:", {
    hasAuthStore: !!authStore,
    hasUser: !!authStore.user,
    userRole: authStore.user?.role,
    userEmail: authStore.user?.email,
    nextStep: authStore.user?.nextStep
  });
  
  // Determine initial components and active step based on user's login state
  const [components, setComponents] = useState<Array<{ name: string; com: React.ReactNode }>>(() => {
    // Start with empty components until we determine the flow
    return [];
  });

  const [initialActive, setInitialActive] = useState("");

  // Update components and active step when auth store is ready
  useEffect(() => {
    console.log("ProfileLayout useEffect triggered:", {
      hasUser: !!authStore.user,
      userRole: authStore.user?.role,
      nextStep: authStore.user?.nextStep
    });
    
    if (authStore.user) {
      // User is logged in, determine the flow based on nextStep
      if (authStore.user.nextStep === 'profile_completion') {
        // User is already registered but needs to complete assessment
        console.log("User needs assessment, setting up assessment flow");
        setComponents([
          { name: "mindset", com: <YouAreOnMindset /> },
        ]);
        setInitialActive("mindset");
      } else if (authStore.user.role === "player") {
        // New player registration flow
        console.log("Setting up new player registration flow");
        setComponents([
          { name: "profile", com: <ProfileForm /> },
          { name: "mindset", com: <YouAreOnMindset /> },
          { name: "address", com: <AddressForm /> },
          { name: "pass", com: <Password /> },
        ]);
        setInitialActive("profile");
      } else {
        // Non-player registration flow
        console.log("Setting up non-player registration flow");
        setComponents([
          { name: "profile", com: <ProfileForm /> },
          { name: "address", com: <AddressForm /> },
          { name: "pass", com: <Password /> },
        ]);
        setInitialActive("profile");
      }
    } else {
      // No user (coming from signup), start with role selection
      console.log("Setting up signup flow with role selection");
      setComponents([
        { name: "role", com: <CreateRole /> },
        { name: "profile", com: <ProfileForm /> },
        { name: "address", com: <AddressForm /> },
        { name: "pass", com: <Password /> },
      ]);
      setInitialActive("role");
    }
  }, [authStore.user]);

  return (
    <div
      style={{
        backgroundImage: 'url("/bg-image.jpg")',
      }}
      className="relative bg-right bg-cover w-full min-h-screen"
    >
      {/* Navigation buttons */}
      <div className="absolute top-6 left-6 z-30 flex gap-3">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl group"
        >
          <svg 
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Signup
        </Link>
        
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/90 backdrop-blur-sm rounded-lg text-sm text-white hover:text-white hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
        >
          <svg 
            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Go to Login
        </Link>
      </div>

      {/* Main content area with gradient overlay */}
      <div
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(30, 30, 30, 0) 0%, rgba(30, 30, 30, 0.7) 47.6%)",
        }}
        className="relative w-full min-h-screen flex items-center justify-center py-8 sm:py-12 lg:py-16"
      >
        {/* Content container with proper padding and centering */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center w-full">
            {components.length > 0 && initialActive ? (
              <ProfileContext components={components} active={initialActive} />
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading profile flow...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
