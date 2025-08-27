import EnterYourEmail from "./enter_your_email";
import EnterOtp from "./verify_email_with_otp";
import AccountCreatedSuccessfully from "./account_created_successfully";
import ProfileContext from "@/context/profile_form_context";

export default function CreateAccount() {
  const components = [
    { name: "email", com: <EnterYourEmail /> },
    { name: "otp", com: <EnterOtp /> },
    { name: "congrats", com: <AccountCreatedSuccessfully /> },
  ];

  return (
    <ProfileContext active='email' components={components} />
  );
}
