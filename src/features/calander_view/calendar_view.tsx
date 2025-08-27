import Calendar from "@/components/Calendar";
import DefaultPage from "@/components/DefaultPage";
import Button from "@/components/Button";
import icons from "@/utils/icons";

// Sample data
const calendarEvents = [
    {
        id: '1',
        title: 'Match vs. Alex Morgan',
        type: 'match',
        status: 'pending',
        date: new Date().toISOString(),
        time: '14:30',
        court: 'Court 3'
    },
    {
        id: '2',
        title: 'Tennis Fundamentals',
        type: 'course',
        date: new Date(Date.now() + 86400000).toISOString(),
        time: '10:00',
        location: 'Training Center'
    },
    {
        id: '3',
        title: 'Coach Meeting',
        type: 'meeting',
        date: new Date(Date.now() + 172800000).toISOString(),
        time: '16:00',
        duration: '30 mins'
    }
];

export default function CalendarView() {
    const handleEventClick = (event: any) => {
        console.log('Event clicked:', event);
        // Navigate to event detail or open modal
    };

    return (
        <DefaultPage
            title="My Calendar"
            rightAction={
                <Button type="action" size="sm">
                    <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
                    <span className="ml-2">Add Event</span>
                </Button>
            }
        >
            <Calendar
                events={calendarEvents}
                onEventClick={handleEventClick}
                view="week"
            />
        </DefaultPage>
    );
}