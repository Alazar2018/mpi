import { useState, useEffect } from "react";
import Button from "@/components/Button";
import icons from "@/utils/icons";

interface NewEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (eventData: any) => void;
    initialDate?: string | null;
}

const eventTypes = [
    { value: 'match', label: 'Match' },
    { value: 'training', label: 'Training' },
    { value: 'coaching', label: 'Coaching' },
    { value: 'session', label: 'Session' },
    { value: 'goal', label: 'Goal' },
    { value: 'reminder', label: 'Reminder' }
];

export default function NewEventModal({ isOpen, onClose, onSubmit, initialDate }: NewEventModalProps) {
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        place: '',
        date: initialDate || '',
        time: '',
        memo: ''
    });

    useEffect(() => {
        if (initialDate) {
            setFormData(prev => ({
                ...prev,
                date: initialDate
            }));
        }
    }, [initialDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
        setFormData({ type: '', title: '', place: '', date: '', time: '', memo: '' });
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-transparent backdrop-blur-sm flex justify-end z-[9999]"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-[var(--bg-card)] shadow-xl w-96 h-full overflow-y-auto border border-[var(--border-primary)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] sticky top-0 bg-[var(--bg-card)]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Event</h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-[var(--text-secondary)]">All Day</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                id="allDay"
                            />
                            <label
                                htmlFor="allDay"
                                className="block w-10 h-6 bg-gray-300 rounded-full cursor-pointer transition-colors"
                            >
                                <div className="w-4 h-4 bg-white rounded-full shadow transform transition-transform translate-x-1 translate-y-1"></div>
                            </label>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <i dangerouslySetInnerHTML={{ __html: icons.close }} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Event Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Event Type
                        </label>
                        <div className="relative">
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                required
                            >
                                <option value="">Select type...</option>
                                {eventTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <i dangerouslySetInnerHTML={{ __html: icons.chevronRight }} />
                            </div>
                        </div>
                    </div>

                    {/* Event Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter Event Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter event title"
                            required
                        />
                    </div>

                    {/* Place */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add Place
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i dangerouslySetInnerHTML={{ __html: icons.calender }} />
                            </div>
                            <input
                                type="text"
                                value={formData.place}
                                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter location"
                            />
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Set Date
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i dangerouslySetInnerHTML={{ __html: icons.calender }} />
                                </div>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add Time
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i dangerouslySetInnerHTML={{ __html: icons.clock }} />
                                </div>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Memo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add Memo
                        </label>
                        <textarea
                            value={formData.memo}
                            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={3}
                            placeholder="Add notes or description..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="neutral"
                            size="none"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="action"
                            size="none"
                            onClick={handleSubmit}
                        >
                            Create Event
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}