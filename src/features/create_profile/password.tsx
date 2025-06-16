import Button from "@/components/Button";
import Form from "@/components/form/Form";
import InputPassword from "@/components/form/InputPassword";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import { useProfileForm } from "@/context/profile_context";
import { required } from "@/utils/utils";

export default function Password() {
  const form = useProfileForm();

  function submit(values: { password: string }) {
    form?.setFormValue?.("password", values.password);
    form?.next?.();
  }

  return (
    <FormParent className="w-[30.625rem]">
      <LogoHeaderWithTitle title="Set Password" description="" />
      <hr className="border-gray-6" />
      <Form<{ password: string; confrmPassword: string }>
        form={({ onSubmit, getValues }) => {
          return (
            <div className="flex flex-col gap-6">
              <InputPassword
                name="password"
                label="Password"
                validation={{ required }}
              />
              <InputPassword
                name="confrmPassword"
                label="Confirm Password"
                validation={{
                  required,
                  validate: {
                    equalTo: () =>
                      getValues("password") === getValues("confrmPassword")
                        ? undefined
                        : "Passwords do not match",
                  },
                }}
              />
              <Button
                onClick={onSubmit(submit)}
                className="col-span-2 mt-6"
                type="action"
                size="lg"
              >
                Continue
              </Button>
            </div>
          );
        }}
      />
    </FormParent>
  );
}
