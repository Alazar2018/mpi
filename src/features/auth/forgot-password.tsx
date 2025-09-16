import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Form from "@/components/form/Form";
import Input from "@/components/form/Input";
import { requestPasswordReset } from "./auth.api";
import { useApiRequest } from "@/hooks/useApiRequest";
import { required } from "@/utils/utils";
import { toast, ToastContainer } from 'react-toastify';
import icons from "@/utils/icons";

interface ForgotPasswordPayload {
  email: string;
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();
  const resetReq = useApiRequest();

  function handleSubmit(data: ForgotPasswordPayload) {
    if (resetReq.pending) return;

    // Immediately navigate to OTP verification page
    navigate(`/verify-password-reset-otp?email=${encodeURIComponent(data.email)}`);
    
    // Send the API request in the background
    resetReq.send(
      () => requestPasswordReset(data),
      (res) => {
        if (!res.success) {
          // If the API call fails, show error and navigate back
          toast.error(res.error || 'Failed to send password reset email');
          navigate('/forgot-password');
        }
      }
    );
  }

  function handleBackToLogin() {
    navigate('/login');
  }

  if (isEmailSent) {
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
          onClick={handleBackToLogin}
        >
          Back to Login
        </Button>
        <div className="flex flex-col gap-9 p-9 w-[30rem] rounded-[20px] bg-white">
          <div className="flex flex-col gap-6 justify-center items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-bold text-2xl">Check Your Email</h2>
              <p className="text-gray-600">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Didn't receive the email? Check your spam folder or</p>
              <button
                onClick={() => setIsEmailSent(false)}
                className="text-blue-600 hover:underline font-medium"
              >
                try again with a different email
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Button
              size="lg"
              onClick={handleBackToLogin}
              className="mt-2.5"
              type="action"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
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
        onClick={handleBackToLogin}
      >
        Back to Login
      </Button>
      <div className="flex flex-col gap-9 p-9 w-[30rem] rounded-[20px] bg-white">
        <div className="flex flex-col gap-6 justify-center items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2 text-center">
            <span className="font-bold text-2xl">Forgot Password?</span>
            <p className="text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>
        </div>
        <Form<ForgotPasswordPayload>
          form={({ onSubmit }) => {
            return (
              <div className="flex flex-col gap-6">
                                 <Input
                   validation={{ required: required }}
                   name="email"
                   label="Email Address"
                   placeholder="Enter your email address"
                   value={email}
                   onUpdate={(value) => setEmail(value)}
                 />
                <Button
                  pending={resetReq.pending}
                  size="lg"
                  onClick={onSubmit(handleSubmit)}
                  className="mt-2.5 transform transition-all duration-300 hover:scale-[1.02]"
                  type="action"
                  disabled={resetReq.pending}
                >
                  {resetReq.pending ? 'Sending...' : 'Send Reset Instructions'}
                </Button>
              </div>
            );
          }}
        />
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-all duration-200 hover:scale-105"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
      
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
    </div>
  );
}
