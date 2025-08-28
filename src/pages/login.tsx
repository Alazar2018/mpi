import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Checkbox from "@/components/form/Checkbox";
import Form from "@/components/form/Form";
import Input from "@/components/form/Input";
import InputPassword from "@/components/form/InputPassword";
import OrLoginWithGoogle from "@/components/OrLoginWithGoogle";
import { login } from "@/features/auth/auth.api";
import { useApiRequest } from "@/hooks/useApiRequest";
import { decodeToken } from '@/utils/jwt';
import type { LoginPayload, LoginResponse } from "@/interface";
import { useAuthStore } from "@/store/auth.store";
import icons from "@/utils/icons";
import { required, toast } from "@/utils/utils";

import { getDeviceInfo } from "@/utils/deviceInfo";
import React from "react";

export default function Login() {
  const authStore = useAuthStore()
	const loginReq = useApiRequest<LoginResponse>()
  const navigate = useNavigate()

  // Force light mode on login page for better visibility and security
  React.useEffect(() => {
    // Remove dark mode class to ensure light mode
    document.documentElement.classList.remove('dark');
    
    // Clean up when component unmounts
    return () => {
      // Don't restore dark mode here - let the user's preference take effect
      // when they log back in
    };
  }, []);

  function sub(data: LoginPayload) {
		if(loginReq.pending) return

		// Get device info
		const deviceInfo = getDeviceInfo();

		loginReq.send(
			() => login({
				email: data.email, 
				password: data.password,
				deviceInfo
			}),
			(res) => {
				if(res.success && res.data) {				
					// The response is already transformed, so res.data contains the API response
					// API response structure: { status, message, data: { user, tokens, session } }
					let userData, tokensData, sessionData;
					
					if (res.data.status === 'success' && res.data.data?.user && res.data.data?.tokens) {
						// API response structure
						userData = res.data.data.user;
						tokensData = res.data.data.tokens;
						sessionData = res.data.data.session;
						
						// Add nextStep to user data if it exists in the response
						if (res.data.data.nextStep) {
							userData.nextStep = res.data.data.nextStep;
						}
				
					} else {
						console.error('Invalid response structure:', res.data);
						toast('e', 'Login failed', 'Invalid response structure');
						return;
					}

					if (userData && tokensData) {
						const tokenData = decodeToken(tokensData.accessToken);

						
						// Extract email from JWT token and add it to user data
						if (tokenData && tokenData.email) {
							userData.email = tokenData.email;
						}
						
						authStore.setUser(userData);
						authStore.setToken(tokensData.accessToken, tokensData.refreshToken);
						
						// Store session info if available
						if (sessionData) {
							authStore.setSession(sessionData);
						}

						// Navigate based on next step (not role-based)
						if (userData.nextStep === 'profile_completion') {
							navigate('/create_profile');
						} else if (userData.nextStep === 'login') {
							try {
								navigate('/admin');
							} catch (error) {
								console.error('Navigation error:', error);
							}
						} else {
							navigate('/'); // Default route for unknown cases
						}

						// Set refresh token cookie for future use
						document.cookie = `refreshToken=${tokensData.refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days
					} else {
						console.error('Invalid response structure:', res.data);
						toast('e', 'Login failed', 'Invalid response structure');
					}
				} else {
					console.error('Login failed:', res);
					toast('e', 'Login failed', res.error || 'Unknown error');
				}
			}
		)
	}

    function navigateToSignup() {
        navigate('/signup')

    }

  return (
    <div
      style={{
        backgroundImage: 'url("/bg-image.jpg")',
      }}
      className="h-full overflow-auto min-h-full w-full bg-cover flex justify-start flex-col gap-12 p-6 pt-24 pl-32"
    >
      <Button
        className="rounded-tl-none !min-h-11 !px-6 self-start font-bold"
        type="neutral"
        icon={icons.back}
      >
        Go Back
      </Button>
      <div className="flex flex-col gap-9 p-9 w-[30rem] rounded-[20px] bg-white shadow-lg border border-gray-200">
        <div className="flex flex-col gap-6 justify-center items-center">
          <img src="/logo.png" className="max-w-full w-[8rem]" />
          <div className="flex gap-2 items-center">
            <span className="font-bold text-2xl text-gray-800">Welcome Back</span>
            👋
          </div>
        </div>  
        <Form<LoginPayload>
          form={({ onSubmit }) => {
            return (
              <div className="flex flex-col gap-6">
                <Input
                  validation={{ required: required }}
                  name="email"
                  label="Email"
                  placeholder="Enter Your Email"
                />
                <InputPassword />
                <div className="flex justify-between items-center">
                  <Checkbox name="agree">
                    Keep me logged in
                  </Checkbox>
                  <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                    Forgot Password?
                  </Link>
                </div>
                <Button
                  pending={loginReq.pending}
                  size="lg"
                  onClick={onSubmit(sub)}
                  className="mt-2.5"
                  type="action"
                >
                  Login
                </Button>
              </div>
            );
          }}
        />
        <OrLoginWithGoogle>
            <Button icon={icons.mail} className="!bg-[#EEF0FF] text-[#4E5969] !justify-center border-0" onClick={navigateToSignup}>
                Register with Email
            </Button>
        </OrLoginWithGoogle>
      </div>
    </div>
  );
}
