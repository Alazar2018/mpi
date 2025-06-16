import { useNavigate } from "react-router";
import Button from "@/components/Button";
import DefaultPage from "@/components/DefaultPage";
import DatePicker from "@/components/form/DateInput";
import Form from "@/components/form/Form";
import Select from "@/components/form/Select";
import Textarea from "@/components/form/Textarea";
import icons from "@/utils/icons";
import { required } from "@/utils/utils";

export default function ScheduleMatch() {
  const navigate = useNavigate()
  return (
    <DefaultPage
      title="Schedule New Match"
      rightAction={
        <Button onClick={() => navigate('/admin/matchs/schedule')} type="neutral">
          View Calendar{" "}
          <i dangerouslySetInnerHTML={{ __html: icons.calender }} />
        </Button>
      }
    >
      <Form
        form={({ onSubmit }) => {
          return (
            <>
              <div className="mt-4 relative isolate rounded-2xl overflow-hidden h-full max-h-[16.375rem]">
                <div className="absolute p-9 bg-primary/60 inset-0 flex flex-col justify-end gap-4 items-center">
                  <div className="w-full grid grid-cols-[1fr_3rem_1fr] gap-6">
                    <div className="p-6 flex flex-col gap-3 rounded-[10px] bg-white">
                      <span className="font-bold">Player One</span>
                      <input className="h-[3.25rem] bg-gray-7 rounded-lg px-4" placeholder="Search for a Player" />
                    </div>
                    <span className="size-12 rounded-full bg-green-2 grid place-items-center font-bold self-center text-xl">
                      VS
                    </span>
                    <div className="p-6 flex flex-col gap-3 rounded-[10px] bg-white h-[8.5rem]">
                      <span className="font-bold">Player two</span>
                      <input className="h-[3.25rem] bg-gray-7 rounded-lg px-4" placeholder="Search for a Player" />
                    </div>
                  </div>
                </div>
                <img
                  src="/stuff.jpg"
                  className="max-w-full object-cover w-full h-full"
                />
              </div>
              <div className="grid grid-cols-3 gap-12 py-6" >
                <DatePicker 
                  label='Match Date & Time'
                  validation={{required: required}}
                  name='date'
                />
                <Select 
                  options={[]}
                  label='Total Sets to Win'
                  validation={{required: required}}
                  name='sets to win'
                />
                <Select 
                  options={[]}
                  label='Points to Break Ties'
                  validation={{required: required}}
                  name='sets to win'
                />
                <Select 
                  options={[]}
                  label='Select Match Category'
                  validation={{required: required}}
                  name='sets to win'
                />
                <Select 
                  options={[]}
                  label='Field Surface Material'
                  validation={{required: required}}
                  name='sets to win'
                />
                <Select 
                  options={[]}
                  label='Court Location'
                  validation={{required: required}}
                  name='sets to win'
                />
              </div>
              <div className="col-span-3" >
                <Textarea 
                  label="Note (Memo)"
                  name='notes'
                  placeholder="Type your notes."
                />
              </div>
              <div className="mt-8 flex justify-end" >
                <Button type="action" size="lg" className="!rounded-3xl" >
                Schedule Match 
                </Button>
              </div>
            </>
          )
        }}
      />

    </DefaultPage>
  );
}
