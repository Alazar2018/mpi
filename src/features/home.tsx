import { Outlet } from "react-router";
import type { Route } from "./+types/home";
import Form from "@/components/form/Form";
import Input from "@/components/form/Input";
import {
  useForm,
  type SubmitHandler,
  type UseFormHandleSubmit,
  type UseFormReset,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { required } from "@/utils/utils";

export const handle = {
  name: "Dashboard",
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Welcome to MPI!" },
  ];
}

type Inputs = {
  example: string;
  exampleRequired: string;
};

export default function Home() {
  const submit = (data: Inputs) => console.log(data);

  return (
    <Form<Inputs>
      form={({ onSubmit, reset }) => {
        return (
          <div className="bg-white rounded-md p-4 flex flex-col gap-2 py-5">
            <Input
              value={'test'}
              label="Exam"
              name="example"
              validation={{ required: required }}
            />
            <Input name="exampleRequired" />
            <button onClick={onSubmit(submit)}>Submit</button>
          </div>
        );
      }}
    />
  );
}

export function OutletOnly() {
  return <Outlet />;
}
