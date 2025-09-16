import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/Button";
import CodeInput from "@/components/form/CodeInput";
import Form from "@/components/form/Form";
import { verifyOTP } from "@/features/auth/auth.api";
import { useApiRequest } from "@/hooks/useApiRequest";
import { required } from "@/utils/utils";
import { toast, ToastContainer } from 'react-toastify';
import { useProfileForm } from "@/context/profile_context";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";

export default function EnterOtp() {
  const optReq = useApiRequest();
  const form = useProfileForm();
  const [email, setEmail] = useState<string | null>(null);
  
  console.log('EnterOtp component rendered, current active:', form?.active); // Debug log
  
  // Use useEffect to get email from localStorage after component mounts
  useEffect(() => {
    const storedEmail = localStorage.getItem('signup_email');
    console.log('useEffect - Email from localStorage:', storedEmail); // Debug log
    setEmail(storedEmail);
  }, []);
  
  // If no email is found yet, show loading
  if (!email) {
    console.log('No email found yet, showing loading...'); // Debug log
    return <div>Loading...</div>; // Show loading instead of going back
  }
  
  function verify(data: { otp: string }) {
    if (optReq.pending) return;
    
    optReq.send(
      () =>
        verifyOTP({
          email: email!, // We know email is not null here because of the check above
          otp: data.otp,
        }),
      (res) => {
        if (res.success) {
          toast.success('OTP verification successful!');
          form?.next();
        } else {
          toast.error(res.error || 'OTP verification failed');
        }
      }
    );
  }
  return (
    <>
      <Form<{ otp: string }>
        form={({ onSubmit }) => {
          return (
            <FormParent
              className="w-full max-w-[28.75rem] px-4 sm:px-6"
            >
              {/* Back to Login Button */}
              <div className="w-full flex justify-start mb-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-all duration-200 group hover:scale-105"
                >
                  <svg 
                    className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Login
                </Link>
              </div>

              <LogoHeaderWithTitle
                title="Verify your email."
                description="A 6 digit verification code has been sent to your email. Check your inbox to continue."
              />
              
              <div className="space-y-6 w-full">
                <CodeInput
                  validation={{
                    required: required,
                    validate: {
                      otp: (value) => {
                        if (/^[0-9]{6}$/.test(value)) return true;
                        return "Not a valid code";
                      },
                    },
                  }}
                  name="otp"
                />
                
                <Button
                  name="submit"
                  pending={optReq.pending}
                  onClick={onSubmit(verify)}
                  type="action"
                  size="lg"
                  className="w-full transform transition-all duration-300 hover:scale-[1.02]"
                  disabled={optReq.pending}
                >
                  {optReq.pending ? 'Verifying...' : 'Continue'}
                </Button>
              </div>
            </FormParent>
          );
        }}
      />
      
      {/* ToastContainer for this page */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
