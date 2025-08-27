import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import Form from "@/components/form/Form";
import Input from "@/components/form/Input";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import { useProfileForm } from "@/context/profile_context";
import { useAuthStore } from "@/store/auth.store";
import { type Address } from "@/context/profile_context";
import {
    required,
    validateStreetAddress,
    validateCity,
    validateStateProvince,
    validateZipCode,
    maxLength,
} from "@/utils/utils";
import { getPopularCountries } from "@/utils/countries";

export default function AddressForm() {
    const form = useProfileForm();
    const authStore = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-populate address fields with data from auth store if available
    useEffect(() => {
        if (authStore.user && form) {
            // Note: Address fields are not available in the User type from auth store
            // They will need to be filled by the user
            console.log("Address form: User data available from auth store:", authStore.user);
        }
    }, [authStore.user, form]);

    function handleSubmit(data: Address) {
        if (form) {
            console.log("Saving address data:", data);
            form.setFormValue("address", data);
            form.next();
        }
    }

    console.log("Current form values:", form?.values);

    const countries = getPopularCountries();

    return (
        <FormParent className="w-full max-w-2xl mx-auto">
            <LogoHeaderWithTitle
                title="Provide your address"
                description="Could you please provide the specific details of your personal address."
            />
            <hr className="border-gray-6" />
            <Form<Address>
                defaultValues={form?.values?.address || {}}
                form={({ onSubmit, setValue }) => {
                    // Initialize form with existing values
                    useEffect(() => {
                        if (form?.values?.address) {
                            const { address } = form.values;
                            Object.entries(address).forEach(([key, value]) => {
                                if (value != null && value !== "") {
                                    setValue(key as keyof Address, value);
                                }
                            });
                        }
                    }, [form?.values?.address, setValue]);

                    return (
                        <div className="space-y-6 w-full">
                            <div className="col-span-2">
                                <SearchableSelect
                                    name="country"
                                    label="Country"
                                    validation={{ required }}
                                    value={form?.values?.address?.country}
                                    options={countries}
                                    placeholder="Search your country"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            </div>
                            <div>
                                <Input
                                    label="Street Address 2 (Optional)"
                                    validation={{
                                        maxLength: maxLength(100),
                                    }}
                                    name="streetAddress2"
                                    placeholder="Apartment, suite, unit, building, floor, etc."
                                />
                            </div>
                            <div className="pt-4">
                                <Button
                                    onClick={onSubmit(handleSubmit)}
                                    className="w-full"
                                    type="action"
                                    size="lg"
                                >
                                    Continue
                                </Button>
                            </div>
                        </div>
                    );
                }}
            />
        </FormParent>
    );
}