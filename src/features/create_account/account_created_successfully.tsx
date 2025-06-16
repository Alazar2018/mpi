import { useNavigate } from "react-router";
import Button from "@/components/Button";
import icons from "@/utils/icons";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";

export default function AccountCreatedSuccessfully() {
  const nav = useNavigate()
  return (
    <FormParent
      className="max-w-[26rem]"
    >
			<div className="absolute inset-0"  >
				<i dangerouslySetInnerHTML={{__html: icons.confety}} />
			</div>
      <LogoHeaderWithTitle
        title="Account Created Successfully"
        description="Congratulations on creating your account! We're excited to design a wonderful experience just for you."
      />
      <Button onClick={() => nav('/create_profile')} type="action" size="lg">
        Setup Profile
      </Button>
    </FormParent>
  );
}
