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
        if (res.success) {
          authStore?.setEmail(data.email);
          form?.next();
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
            className="max-w-[28.75rem]"
          >
            <LogoHeaderWithTitle
              title="Create your account!"
              description="To create your account, please enter your email address. You will receive a verification code shortly after."
            />
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
            >
              Continues
            </Button>
          </FormParent>
        );
      }}
    />
  );
}
