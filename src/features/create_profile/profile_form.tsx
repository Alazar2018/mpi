import Button from "@/components/Button";
import DatePicker from "@/components/form/DateInput";
import Form from "@/components/form/Form";
import Input from "@/components/form/Input";
import PhoneInput from "@/components/form/PhoneInput";
import Select from "@/components/form/Select";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import { useProfileForm } from "@/context/profile_context";
import {
  required,
  validateDateOfBirth,
  validateName
} from "@/utils/utils";
import { type CreateUser } from "@/context/profile_context";
import FileInput from "@/components/form/FileInput";
import { useAuthStore } from "@/store/auth.store";

export default function ProfileForm() {
  const form = useProfileForm();
  const authStore = useAuthStore();

  function log(data: CreateUser) {
    form?.setFormValue?.("user", data);
    form?.next?.();
  }
  return (
    <FormParent className="w-[40.625rem]">
      <LogoHeaderWithTitle
        title="Setup your profile."
        description="To get started, please set up your profile by providing your personal information and preferences."
      />
      <hr className="border-gray-6" />
      <Form<CreateUser>
        form={({ onSubmit }) => {
          return (
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <FileInput seed={authStore?.email} name="avatar" label="Avatar" />
              </div>
              <Input
                label="First Name"
                validation={{
                  required,
                  validate: validateName
                }}
                name="firstName"
                placeholder="Enter your first name"
              />
              <Input
                label="Last Name"
                validation={{
                  required,
                  validate: validateName
                }}
                name="lastName"
                placeholder="Enter your last name"
              />
              <Select
                name="gender"
                label="Gender"
                validation={{ required }}
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                ]}
                placeholder="Select Your Gender"
              />
              <DatePicker
                placeholder="Select Your Date Of Birth"
                validation={{
                  required,
                  validate: validateDateOfBirth
                }}
                label="Date of Birth"
                name="dateOfBirth"
              />
              <div className="col-span-2">
                <PhoneInput
                  validation={{ required }}
                  label="Phone Number"
                  name="phoneNumber"
                />
              </div>
              <Button
                onClick={onSubmit(log)}
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
