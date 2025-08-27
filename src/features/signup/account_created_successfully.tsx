import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import Button from "@/components/Button";
import icons from "@/utils/icons";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";

export default function AccountCreatedSuccessfully() {
  const nav = useNavigate()
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

      {/* Confetti Background */}
      <div className="absolute inset-0 pointer-events-none">
        <i dangerouslySetInnerHTML={{__html: icons.confety}} />
      </div>
      
      <div className="space-y-6 w-full relative z-10">
        <LogoHeaderWithTitle
          title="Account Created Successfully"
          description="Congratulations on creating your account! We're excited to design a wonderful experience just for you."
        />
        
        <Button 
          onClick={() => nav('/create_profile')} 
          type="action" 
          size="lg"
          className="w-full"
        >
          Setup Profile
        </Button>
      </div>
    </FormParent>
  );
}
