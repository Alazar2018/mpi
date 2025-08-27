
import { Link } from "react-router-dom";
import Button from "@/components/Button";
import Form from "@/components/form/Form";
import Input from "@/components/form/Input";
import OrLoginWithGoogle from "@/components/OrLoginWithGoogle";
import { getAccountCreationOtp } from "@/features/auth/auth.api";
import { useApiRequest } from "@/hooks/useApiRequest";
import { email, required, toast } from "@/utils/utils";
import { useProfileForm } from "@/context/profile_context";
import { useAuthStore } from "@/store/auth.store";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import FormParent from "@/components/FormParent";

export type Email = {
  email: string;
};

export default function EnterYourEmail() {
  const form = useProfileForm();
  const optReq = useApiRequest();
  const authStore = useAuthStore();


  function sendEmail(data: Email) {
    if (optReq.pending) return;

    optReq.send(
      () => getAccountCreationOtp(data),
      (res) => {
        console.log('OTP Response:', res); // Debug log
        if (res.success) {
          console.log('OTP sent successfully, calling form?.next()'); // Debug log
          // Store email in localStorage for the next step
          localStorage.setItem('signup_email', data.email);
          
          // Navigate to next step
          form?.next();
          console.log('form?.next() called');
        } else {
          console.log('OTP failed:', res.error); // Debug log
        }
        toast(res.success ? "s" : "e", `OTP Sent to ${data.email}`, res.error);
      }
    );
  }
  return (
    <Form<Email>
      form={({ onSubmit }) => {
        return (
          <FormParent
            className="w-full max-w-[28.75rem] px-4 sm:px-6"
          >
            {/* Back to Login Button */}
            <div className="w-full flex justify-start mb-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 group"
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
              title="Create your account!"
              description="To create your account, please enter your email address. You will receive a verification code shortly after."
            />
            
            <div className="space-y-6 w-full">
              <Input
                validation={{
                  required,
                  validate: {
                    email: email,
                  },
                }}
                name="email"
                label="Email Address"
                placeholder="Enter your email"
              />
              
              <OrLoginWithGoogle />
              
              <Button
                pending={optReq.pending}
                onClick={onSubmit(sendEmail)}
                type="action"
                size="lg"
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </FormParent>
        );
      }}
    />
  );
}
