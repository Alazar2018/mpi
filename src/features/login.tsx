import { Link, useNavigate } from "react-router";
import Button from "@/components/Button";
import Checkbox from "@/components/form/Checkbox";
import Form from "@/components/form/Form";
import Input from "@/components/form/Input";
import InputPassword from "@/components/form/InputPassword";
import OrLoginWithGoogle from "@/components/OrLoginWithGoogle";
import { login } from "@/features/auth.api";
import { useApiRequest } from "@/hooks/useApiRequest";
import type { LoginPayload, LoginResponse } from "@/interface";
import { useAuthStore } from "@/store/auth.store";
import icons from "@/utils/icons";
import { required, toast } from "@/utils/utils";



export default function Login() {
  const authStore = useAuthStore()
	const loginReq = useApiRequest<LoginResponse>()
  const navigate = useNavigate()

  function sub(data: LoginPayload) {
		if(loginReq.pending) return

		loginReq.send(
			() => login({email: data.email, password: data.password}),
			(res) => {

				if(res.success && res.data) {
					console.log(res.data)
          authStore.setUser(res.data.user)
          authStore.setToken(res.data.tokens.accessToken, res.data.tokens.refreshToken)
          localStorage.setItem('user', JSON.stringify(res.data.user))
          localStorage.setItem('tokens', JSON.stringify(res.data.tokens))
          navigate('/admin')
				}
        toast(res.success ? 's' : 'e', 'Successfully Logged in', res.error)
			}
		)
	}

  return (
    <div
      style={{
        backgroundImage: 'url("/bg-image.jpg")',
      }}
      className="h-full overflow-auto min-h-full w-full bg-cover flex justify-start flex-col gap-12 p-6 pt-24 pl-32"
    >
      <Button
        className="rounded-tl-none !min-h-11 !px-6 self-start font-bold"
        type="neutral"
        icon={icons.back}
      >
        Go Back
      </Button>
      <div className="flex flex-col gap-9 p-9 w-[30rem] rounded-[20px] bg-white">
        <div className="flex flex-col gap-6 justify-center items-center">
          <img src="/logo.png" className="max-w-full w-[8rem]" />
          <div className="flex gap-2 items-center">
            <span className="font-bold text-2xl">Welcome Back</span>
            👋
          </div>
        </div>  
        <Form<LoginPayload>
          form={({ onSubmit }) => {
            return (
              <div className="flex flex-col gap-6">
                <Input
                  validation={{ required: required }}
                  name="email"
                  label="Email"
                  placeholder="Enter Your Email"
                />
                <InputPassword />
                <div className="flex justify-between items-center">
                  <Checkbox validation={{ required }} name="agree">
                    Keep me logged in
                  </Checkbox>
                  <span className="text-sm font-semibold">
                    Forgot Password?
                  </span>
                </div>
                <Button
                  pending={loginReq.pending}
                  size="lg"
                  onClick={onSubmit(sub)}
                  className="mt-2.5"
                  type="action"
                >
                  Login
                </Button>
              </div>
            );
          }}
        />
        <OrLoginWithGoogle>
          <Link to='/create_account' className="text-center italic underline text-gray-2" >create account</Link>
        </OrLoginWithGoogle>
      </div>
    </div>
  );
}
