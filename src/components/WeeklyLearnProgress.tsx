import icons from "@/utils/icons";
import Button from "./Button";

interface WeeklyLearnProgressProps {
    weekNumber: number;
    title: string;
    lessonCount: number;
    duration: string; // e.g. "1Hr 30Min"
    rating: number; // e.g. 4 (out of 5)
    progress: number; // 0-100
    status?: 'not-started' | 'in-progress' | 'completed';
    onOpenCourse?: () => void;
}

export default function WeeklyLearnProgress({
                                                weekNumber = 1,
                                                title = "Mindfulness unleashed",
                                                lessonCount = 4,
                                                duration = "1Hr 30Min",
                                                rating = 4,
                                                progress = 0,
                                                status = 'not-started',
                                                onOpenCourse
                                            }: WeeklyLearnProgressProps) {

    // Calculate progress bar width
    const progressWidth = `${Math.min(100, Math.max(0, progress))}%`;

    // Determine progress bar color based on status
    const progressBarColor = {
        'not-started': 'bg-gray-7',
        'in-progress': 'bg-blue-500',
        'completed': 'bg-green-500'
    }[status];

    return (
        <div className="hover:bg-green-50 transition-colors flex flex-col gap-4 p-4 sm:p-6 rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 pb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-2">
                <span className="text-base font-bold">Week {weekNumber}</span>
                <span className="text-xs text-gray-500">
          {lessonCount} Lesson{lessonCount !== 1 ? 's' : ''} ({duration})
        </span>
            </div>

            <span className="text-sm text-gray-600 line-clamp-2">{title}</span>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                    className={`h-full rounded-full ${progressBarColor}`}
                    style={{ width: progressWidth }}
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2 items-center bg-gray-100 text-gray-800 text-xs rounded-md px-3 py-1.5">
                    {rating}/5 <i className="*:size-3" dangerouslySetInnerHTML={{__html: icons.star}} />
                </div>

                <Button
                    className="h-8 sm:h-9 w-full sm:flex-1 justify-center rounded-md font-medium text-sm"
                    type={status === 'completed' ? 'success' : 'action'}
                    onClick={onOpenCourse}
                >
                    {status === 'completed' ? 'Review' : 'Open Course'}
                </Button>
            </div>
        </div>
    );
}