import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "@/components/Button";
import Form from "@/components/form/Form";
import Input from "@/components/form/Input";
import InputPassword from "@/components/form/InputPassword";
import { resetPasswordWithOTP } from "./auth.api";
import { useApiRequest } from "@/hooks/useApiRequest";
import { required, toast } from "@/utils/utils";
import icons from "@/utils/icons";

interface ResetPasswordWithOTPPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export default function VerifyPasswordResetOTP() {
  const [searchParams] = useSearchParams();
  const [email] = useState(searchParams.get('email') || '');
  const navigate = useNavigate();
  const verifyReq = useApiRequest();



  function handleSubmit(data: ResetPasswordWithOTPPayload) {
    if (verifyReq.pending) return;

    // Create the complete payload with email from state
    const completePayload = {
      email: email, // Use email from state instead of form data
      otp: data.otp,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    };

    // Validate email is present
    if (!completePayload.email || completePayload.email.trim() === '') {
      toast('e', 'Error', 'Email is required');
      return;
    }

    // Validate password confirmation
    if (completePayload.newPassword !== completePayload.confirmPassword) {
      toast('e', 'Error', 'Passwords do not match');
      return;
    }

    // Validate password strength (optional)
    if (completePayload.newPassword.length < 8) {
      toast('e', 'Error', 'Password must be at least 8 characters long');
      return;
    }

    verifyReq.send(
      () => resetPasswordWithOTP(completePayload),
      (res) => {
        if (res.success && res.data) {
          toast('s', 'Success', 'Password reset successfully! Please log in with your new password.');
          // Redirect to login page after successful password reset
          setTimeout(() => {
            navigate('/login');
          }, 2000); // 2 second delay to show success message
        } else {
          toast('e', 'Error', res.error || 'Failed to reset password');
        }
      }
    );
  }

  function handleBackToForgotPassword() {
    navigate('/forgot-password');
  }

  function handleBackToLogin() {
    navigate('/login');
  }



  // If no email is provided, show error message
  if (!email) {
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
          onClick={handleBackToForgotPassword}
        >
          Back
        </Button>
        <div className="flex flex-col gap-9 p-9 w-[30rem] rounded-[20px] bg-white">
          <div className="flex flex-col gap-6 justify-center items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-bold text-2xl">Invalid Reset Link</h2>
              <p className="text-gray-600">
                This password reset link is invalid or missing email information.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Button
              size="lg"
              onClick={handleBackToForgotPassword}
              className="mt-2.5"
              type="action"
            >
              Back to Forgot Password
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
        onClick={handleBackToForgotPassword}
      >
        Back
      </Button>
      <div className="flex flex-col gap-9 p-9 w-[30rem] rounded-[20px] bg-white">
        <div className="flex flex-col gap-6 justify-center items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2 text-center">
            <span className="font-bold text-2xl">Reset Your Password</span>
            <p className="text-gray-600">
              We've sent a verification code to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Please check your email, enter the code and create a new password
            </p>
          </div>
        </div>
        <Form<ResetPasswordWithOTPPayload>
          form={({ onSubmit }) => {
            return (
                              <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-base">Email Address</span>
                    <div className="px-4 flex overflow-hidden gap-2 bg-gray-100 rounded-lg h-[3.25rem]">
                      <input
                        type="text"
                        className="focus:shadow-none placeholder:opacity-50 placeholder:font-normal focus:outline-none h-full font-bold w-full rounded-2xl bg-transparent text-gray-600"
                        value={email}
                        disabled={true}
                        readOnly={true}
                      />
                    </div>
                  </div>
                <Input
                  validation={{ required: required }}
                  name="otp"
                  label="Verification Code"
                  placeholder="Enter the 6-digit code"
                />
                <InputPassword
                  validation={{ required: required }}
                  name="newPassword"
                  label="New Password"
                />
                <InputPassword
                  validation={{ required: required }}
                  name="confirmPassword"
                  label="Confirm New Password"
                />
                <Button
                  pending={verifyReq.pending}
                  size="lg"
                  onClick={onSubmit(handleSubmit)}
                  className="mt-2.5"
                  type="action"
                >
                  Reset Password
                </Button>
              </div>
            );
          }}
        />
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            Didn't receive the code?
          </p>
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            ← Back to Forgot Password
          </Link>
        </div>
      </div>
    </div>
  );
}
