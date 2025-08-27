import Button from "@/components/Button";
import DefaultPage from "@/components/DefaultPage";
import icons from "@/utils/icons";

export const handle = {
  name: "Schedules",
};

export default function MatchSchedule() {
  let data = [
    // Week 1
    [
      // Monday
      [
        {
          date: {
            from: new Date(2025, 5, 10, 0, 0),
            to: new Date(2025, 5, 10, 1, 0),
          },
          type: "match",
          title: "Friendly Match",
          between: [{ name: "Team A" }, { name: "Team B" }],
          location: "City Stadium",
        },
      ],
      // Tuesday
      [
        {
          date: {
            from: new Date(2025, 5, 11, 2, 0),
            to: new Date(2025, 5, 11, 3, 0),
          },
          type: "reminder",
          title: "Team Meeting",
          description: "Discuss upcoming tournament strategies",
          location: "Meeting Room",
        },
      ],
      // Wednesday
      [
        {
          date: {
            from: new Date(2025, 5, 14, 4, 0),
            to: new Date(2025, 5, 14, 5, 0),
          },
          type: "goal",
          title: "Monthly Performance Review",
          description: "Set individual and team goals for next month",
          location: "Coach's Office",
        },
      ],
      // Thursday
      [
        {
          date: {
            from: new Date(2025, 5, 13, 0, 0),
            to: new Date(2025, 5, 13, 1, 0),
          },
          type: "training",
          title: "Fitness Training",
          description: "Endurance and strength exercises",
          location: "Training Ground",
        },
      ],
      // Friday
      [
        {
          date: {
            from: new Date(2025, 5, 12, 3, 0),
            to: new Date(2025, 5, 12, 4, 0),
          },
          type: "session",
          title: "Video Analysis",
          description: "Review last match performance",
          location: "Video Room",
        },
      ],
      // Saturday
      [
        {
          date: {
            from: new Date(2025, 5, 9, 10, 0),
            to: new Date(2025, 5, 9, 12, 0),
          },
          type: "training",
          title: "Morning Training Session",
          description: "Focus on passing and ball control",
          location: "Main Stadium",
        },
      ],
      // Sunday
      [
        {
          date: {
            from: new Date(2025, 5, 15, 9, 0),
            to: new Date(2025, 5, 15, 11, 0),
          },
          type: "match",
          title: "League Match",
          between: [{ name: "Our Team" }, { name: "City Rivals" }],
          location: "National Stadium",
        },
      ],
    ],
    // Week 2
    [
      // Monday
      [
        {
          date: {
            from: new Date(2025, 5, 16, 16, 0),
            to: new Date(2025, 5, 16, 18, 0),
          },
          type: "training",
          title: "Tactical Training",
          description: "Set pieces and formations",
          location: "Training Ground B",
        },
      ],
      // Tuesday
      [
        {
          date: {
            from: new Date(2025, 5, 17, 10, 0),
            to: new Date(2025, 5, 17, 11, 0),
          },
          type: "reminder",
          title: "Medical Check-up",
          description: "Monthly physical examination",
          location: "Medical Center",
        },
      ],
      // Rest of the week...
      [],
      [],
      [],
      [],
      [],
    ],
    // You can add more weeks as needed
  ];

  const getScheduleForCell = (
    weekIndex: number,
    dayIndex: number,
    hour: number
  ) => {
    // Get the current week's schedule
    const weekSchedule = data[weekIndex];
    if (!weekSchedule) return [];

    // Get the day's schedule
    const daySchedule = weekSchedule[dayIndex] || [];

    // Filter events that match the current hour
    const res = daySchedule.filter((event) => {
      const eventHour = event.date.from.getHours();
      return eventHour === hour;
    });

    console.log(res, weekIndex, dayIndex, hour);

    return res;
  };
  return (
    <DefaultPage 
      title="Schedules"
      rightAction={
        <Button type="action" className="rounded-lgg" >
          New Event
        </Button>
      }
    >
      <div className="py-6 flex justify-between items-center">
        <button className="bg-gray-7 py-[5px] px-4 rounded-xs">Today</button>
        <div className="w-[17.5rem] flex justify-between items-center">
          <i dangerouslySetInnerHTML={{ __html: icons.back }} />
          <span className="font-bold">Jun 7 - 14, 2025</span>
          <i
            dangerouslySetInnerHTML={{ __html: icons.back }}
            className="rotate-180"
          />
        </div>
        <div className="flex">
          <button className="bg-gray-7 py-[5px] px-4">Day</button>
          <button className="bg-gray-7 py-[5px] px-4">Week</button>
          <button className="bg-gray-7 py-[5px] px-4">Month</button>
          <button className="bg-gray-7 py-[5px] px-4">Year</button>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table>
          <thead className="font-bold">
            <tr className="h-12 *:min-w-[147px] *:border *:border-gray-9">
              <th className="!min-w-16 !max-w-16">
                <div className="grid place-items-center">
                  <i dangerouslySetInnerHTML={{ __html: icons.clock }} />
                </div>
              </th>
              <th>Monday</th>
              <th>Tuesday</th>
              <th>Wednesday</th>
              <th>Thursday</th>
              <th>Friday</th>
              <th>Saturday</th>
              <th>Sunday</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }).map((_, hour) => {
              return (
                <tr key={hour} className="h-12 *:border *:border-gray-9">
                  <td className="flex h-20">
                    <div className="relative text-[13px] text-gray-2 h-full w-full grid place-items-center">
                      {`${hour}`.padStart(2, "0")} AM
                      <div className="size-6 grid place-items-center absolute-center bg-gray-1 rounded-2xl !top-full">
                        <i
                          className="*:size-4"
                          dangerouslySetInnerHTML={{ __html: icons.plus }}
                        />
                      </div>
                    </div>
                  </td>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const cellData = getScheduleForCell(0, dayIndex, hour);
                    return cellData.length ? (
                      cellData.map((el) => {
                        if (el.type == "match") {
                          return (
                            <td
                              key={dayIndex}
                              className="relative overflow-visible"
                            >
                              <div className="absolute top-0 left-0">
                                <div className="min-h-full  border border-secondary  bg-green-3/5	flex flex-col gap-2 p-4 w-full h-full rounded-2xl">
                                  <span className="text-[13px] font-bold text-secondary leading-5">
                                    First Friendly Match
                                  </span>
                                  <ul className="ml-4 text-xs list-disc appearance-none">
                                    <li>Birhane Araya</li>
                                    <li>Abel Teame</li>
                                  </ul>
                                  <div className="mt-2 flex items-center gap-[5px]">
                                    <div className="rounded-3xl bg-secondary text-[13px] px-[7px] text-white">
                                      09:00
                                    </div>
                                    <div className="rounded-3xl bg-secondary text-[13px] px-[7px] text-white">
                                      10:30
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          );
                        } else if (el.type == "reminder") {
                          return (
                            <td
                              key={dayIndex}
                              className="relative overflow-visible"
                            >
                              <div className="absolute top-0 left-0 w-full">
                                <div className="min-h-full  border-[0.4px] border-orange-5  bg-orange-5/5	flex flex-col gap-2 p-4 w-full h-full rounded-2xl">
                                  <div className="self-start rounded-3xl bg-orange-5 text-[13px] px-[7px] text-white">
                                    09:00
                                  </div>
                                  <span className="text-[13px] leading-5">
                                    Study the art of serving first at the
                                    library.
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        } else if (el.type == "goal") {
                          return (
                            <td
                              key={dayIndex}
                              className="relative overflow-visible"
                            >
                              <div className="absolute top-0 left-0 w-full">
                                <div className="min-h-full  border-[0.4px] border-indego-5  bg-indego-5/5	flex flex-col gap-2 p-4 w-full h-full rounded-2xl">
                                  <div className="self-start rounded-3xl bg-indego-5 text-[13px] px-[7px] text-white">
                                  Goal
                                  </div>
                                  <span className="text-[13px] leading-5">
                                    Study the art of serving first at the
                                    library.
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        } else if (el.type == "session") {
                          return (
                            <td
                              key={dayIndex}
                              className="relative overflow-visible"
                            >
                              <div className="absolute top-0 left-0 w-full">
                                <div className="min-h-full  border-[0.4px] border-sky-5  bg-sky-5/5	flex flex-col gap-2 p-4 w-full h-full rounded-2xl">
                                  <div className="mt-2 flex items-center gap-[5px]">
                                    <div className="rounded-3xl bg-sky-5 text-[13px] px-[7px] text-white">
                                      09:00
                                    </div>
                                    <div className="rounded-3xl bg-sky-5 text-[13px] px-[7px] text-white">
                                      10:30
                                    </div>
                                  </div>
                                  <span className="text-[13px] leading-5">
                                    Rally consistency from the baseline
                                  </span>
                                  <ul className="ml-4 text-[13px] leading-5 list-disc appearance-none">
                                    <li>
                                      Deep cross-court forehand and backhand
                                      drills
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </td>
                          );
                        } else if (el.type == "training") {
                          return (
                            <td
                              key={dayIndex}
                              className="relative overflow-visible"
                            >
                              <div className="absolute top-0 left-0 w-full">
                                <div className="min-h-full  border-[0.4px] border-yellow-5  bg-yellow-5/5	flex flex-col gap-2 p-4 w-full h-full rounded-2xl">
                                  <div className="mt-2 flex items-center gap-[5px]">
                                    <div className="rounded-3xl bg-yellow-5 text-[13px] px-[7px] text-white">
                                      09:00
                                    </div>
                                    <div className="rounded-3xl bg-yellow-5 text-[13px] px-[7px] text-white">
                                      10:30
                                    </div>
                                  </div>
                                  <span className="text-[13px] leading-5">
                                  Coach Samuel
                                  </span>
                                  <ul className="ml-4 text-[13px] leading-5 list-disc appearance-none">
                                    <li>
                                    Mechanics and rhythm of the first serve
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        return <td key={dayIndex}></td>;
                      })
                    ) : (
                      <td key={dayIndex}></td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="*:border *:border-gray-9" >
              <td colSpan={100} className="h-20" >
                <div className="w-full h-full gap-9 flex items-center justify-end" >
                  <div className="flex items-center gap-[10px]" >
                    <div className="bg-orange-5 size-4 rounded-full"></div>
                    Reminder
                  </div>
                  <div className="flex items-center gap-[10px]" >
                    <div className="bg-yellow-5 size-4 rounded-full"></div>
                    Training
                  </div>
                  <div className="flex items-center gap-[10px]" >
                    <div className="bg-sky-5 size-4 rounded-full"></div>
                    Session
                  </div>
                  <div className="flex items-center gap-[10px]" >
                    <div className="bg-indego-5 size-4 rounded-full"></div>
                    Goal
                  </div>
                  <div className="flex items-center gap-[10px]" >
                    <div className="bg-secondary size-4 rounded-full"></div>
                    Match
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DefaultPage>
  );
}
