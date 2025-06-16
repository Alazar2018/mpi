import Button from "@/components/Button";
import Form from "@/components/form/Form";
import Input from "@/components/form/Input";
import SearchableSelect from "@/components/form/SearchableSelect";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import { useProfileForm } from "@/context/profile_context";
import {
  required,
  validateStreetAddress,
  validateCity,
  validateStateProvince,
  validateZipCode,
  maxLength,
  toast,
} from "@/utils/utils";
import { getPopularCountries } from "@/utils/countries";
import { useAuthStore, type Address, type Role } from "@/store/auth.store";
import { useApiRequest } from "@/hooks/useApiRequest";
import { register } from "@/features/auth/auth.api";

export default function AddressForm() {
  const form = useProfileForm();
  const authStore = useAuthStore();
  const registerReq = useApiRequest();

  function handleSubmit(data: Address) {
    if (registerReq.pending) return;

    registerReq.send(
      () =>
        register({
          email: authStore.email as string,
          otp: authStore.otp as string,
          role: form?.values?.role as Role,
          firstName: form?.values?.user.firstName as string,
          lastName: form?.values?.user.lastName as string,
          password: form?.values?.password as string,
          avatar: form?.values?.user?.avatar,
          dateOfBirth: form?.values?.user?.dateOfBirth as string,
          gender: form?.values?.user?.gender as string,
          phoneNumber: form?.values?.user?.phoneNumber?.split(
            " "
          )?.[0] as string,
          phoneNumberCountryCode: form?.values?.user?.phoneNumber?.split(
            " "
          )?.[1] as string,
          streetAddress: form?.values?.address?.streetAddress as string,
          city: form?.values?.address?.city as string,
          stateProvince: form?.values?.address?.stateProvince as string,
          country: form?.values?.address?.country as string,
          zipCode: form?.values?.address?.zipCode as string,
        }),
      (res) => {
        if (res.success) {
          form?.setFormValue?.("address", data);
          form?.next?.();
        }
        toast(res.success ? "s" : "e", "Successfully Registered!", res.error);
      }
    );
  }

  const countries = getPopularCountries();

  return (
    <FormParent className="w-[40.625rem]">
      <LogoHeaderWithTitle
        title="Provide your address"
        description="Could you please provide the specific details of your personal address."
      />
      <hr className="border-gray-6" />
      <Form<Address>
        form={({ onSubmit }) => {
          return (
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <SearchableSelect
                  name="country"
                  label="Country"
                  validation={{ required }}
                  options={countries}
                  placeholder="Search your country"
                />
              </div>
              <Input
                label="City"
                validation={{
                  required,
                  validate: validateCity,
                }}
                name="city"
                placeholder="Enter your city"
              />
              <Input
                label="State/Province"
                validation={{
                  required,
                  validate: validateStateProvince,
                }}
                name="stateProvince"
                placeholder="Enter your state or province"
              />
              <Input
                label="ZIP/Postal Code"
                validation={{
                  required,
                  validate: validateZipCode,
                }}
                name="zipCode"
                placeholder="Enter your ZIP or postal code"
              />
              <Input
                label="Street Address"
                validation={{
                  required,
                  validate: validateStreetAddress,
                }}
                name="streetAddress"
                placeholder="Enter your street address"
              />
              <div className="col-span-2">
                <Input
                  label="Street Address 2 (Optional)"
                  validation={{
                    maxLength: maxLength(100),
                  }}
                  name="streetAddress2"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>
              <Button
                pending={registerReq.pending}
                onClick={onSubmit(handleSubmit)}
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
