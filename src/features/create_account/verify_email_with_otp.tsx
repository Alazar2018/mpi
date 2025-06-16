import Button from "@/components/Button";
import CodeInput from "@/components/form/CodeInput";
import Form from "@/components/form/Form";
import { verifyOTP } from "@/features/auth/auth.api";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useAuthStore } from "@/store/auth.store";
import { required, toast } from "@/utils/utils";
import { useProfileForm } from "@/context/profile_context";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";

export default function EnterYourEmail() {
  const optReq = useApiRequest();
  const authStore = useAuthStore();
  const form = useProfileForm();
  const email = authStore.email;
  if (!email) {
    form?.prev();
  }

  function verify(data: { otp: string }) {
    if (optReq.pending) return;
    optReq.send(
      () =>
        verifyOTP({
          email: email!,
          otp: data.otp,
        }),
      (res) => {
        if (res.success) {
          authStore.setOtp(data.otp)
          form?.next()
        }
        toast(res.success ? "s" : "e", ``, res.error);
      }
    );
  }
  return (
    <Form<{ otp: string }>
      form={({ onSubmit }) => {
        return (
          <FormParent
            className="max-w-[28.75rem]"
          >
            <LogoHeaderWithTitle
              title="Verify your email."
              description="A 6 digit verification code has been sent to your email. Check your inbox to continue."
            />
            <CodeInput
              validation={{
                required: required,
                validate: {
                  otp: (value) => {
                    if (/^[0-9]{6}$/.test(value)) return true;
                    return "Not A valida code";
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
            >
              Continues
            </Button>
          </FormParent>
        );
      }}
    />
  );
}
