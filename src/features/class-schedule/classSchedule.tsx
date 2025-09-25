import React, { useState, useEffect } from 'react';
import DefaultPage from '@/components/DefaultPage';
import { useClassSchedule } from '@/hooks/useClassSchedule';
import type { ClassScheduleRequest, User, AvailabilitySlot } from '@/service/classSchedule.server';
import Button from '@/components/Button';
import SimpleModal from '@/components/SimpleModal';
import { toast } from 'react-toastify';
import { formatAvailabilityTime } from '@/utils/utils';

export default function ClassSchedule() {
  const {
    requests,
    coaches,
    children,
    availability,
    loading,
    error,
    userRole,
    fetchMyRequests,
    fetchMyCoaches,
    fetchMyChildren,
    fetchChildCoaches,
    fetchCoachRequests,
    createRequest,
    createRequestForChild,
    updateRequest,
    deleteRequest,
    fetchCoachAvailability,
    respondToRequest,
    updateCoachResponseHandler,
    clearError
  } = useClassSchedule();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClassScheduleRequest | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [playerNote, setPlayerNote] = useState<string>('');
  const [coachNote, setCoachNote] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<'accepted' | 'rejected'>('accepted');
  const [activeTab, setActiveTab] = useState<'requests' | 'schedule' | 'children'>('requests');
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDateForAvailability, setSelectedDateForAvailability] = useState<string>('');
  const [coachAvailability, setCoachAvailability] = useState<{ time: string; available: boolean }[]>([]);
  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Handle create/update request for player/parent
  const handleCreateRequest = async () => {
    if (!selectedCoach || !selectedDate) return;

    setIsSubmitting(true);

    try {
      if (editingRequestId) {
        // Update existing request
        await updateRequest(editingRequestId, {
          date: selectedDate,
          playerNote,
          timezone: userTimezone
        });
        
        toast.success('Request updated successfully!');
      } else {
        // Create new request
        if (userRole === 'parent' && selectedChild) {
          await createRequestForChild(selectedChild, selectedCoach, {
            date: selectedDate,
            playerNote,
            timezone: userTimezone
          });
        } else {
          await createRequest(selectedCoach, {
            date: selectedDate,
            playerNote,
            timezone: userTimezone
          });
        }
        
        toast.success('Class request created successfully!');
      }
      
      // Close modal and navigate immediately
      setShowCreateModal(false);
      resetForm();
      setActiveTab('requests');
      // Refresh the requests list
      if (userRole === 'coach') {
        fetchCoachRequests();
      } else {
        fetchMyRequests();
      }
      
    } catch (error) {
      console.error('Failed to create/update request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create/update request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle coach response
  const handleCoachResponse = async () => {
    if (!selectedRequest) return;

    try {
      await respondToRequest(selectedRequest._id, {
        status: responseStatus,
        coachNote
      });
      
      setShowResponseModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to respond to request:', error);
    }
  };

  // Handle delete request
  const handleDeleteRequest = async (requestId: string) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await deleteRequest(requestId);
      } catch (error) {
        console.error('Failed to delete request:', error);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedChild('');
    setSelectedCoach('');
    setSelectedDate('');
    setSelectedTime('');
    setPlayerNote('');
    setCoachNote('');
    setResponseStatus('accepted');
    setSelectedRequest(null);
    setEditingRequestId(null);
    setIsSubmitting(false);
    setShowAvailability(false);
    setAvailabilityLoading(false);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-[var(--bg-secondary)] text-[var(--text-primary)]';
      case 'rejected':
        return 'bg-[var(--bg-secondary)] text-[var(--text-primary)]';
      default:
        return 'bg-[var(--bg-secondary)] text-[var(--text-primary)]';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user display name
  const getUserDisplayName = (user: string | User) => {
    if (typeof user === 'string') return user;
    return `${user.firstName} ${user.lastName}`;
  };

  // Convert ISO date to datetime-local format
  const convertToDateTimeLocal = (isoDate: string) => {
    const dateObj = new Date(isoDate);
    const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
  };

  // Check if request date is in the past
  const isRequestInPast = (requestDate: string) => {
    const requestDateTime = new Date(requestDate);
    const now = new Date();
    return requestDateTime < now;
  };

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDetailModal) {
        setShowDetailModal(false);
        setSelectedRequest(null);
      }
    };

    if (showDetailModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDetailModal]);

  // Debug modal state
  useEffect(() => {
    console.log('Modal state:', { showDetailModal, selectedRequest: !!selectedRequest });
  }, [showDetailModal, selectedRequest]);

  // Reset form when create modal is closed
  useEffect(() => {
    if (!showCreateModal) {
      resetForm();
    }
  }, [showCreateModal]);

  // Fetch coach availability when coach and date are selected
  const fetchCoachAvailabilityForDate = async (coachId: string, date: string) => {
    if (!coachId || !date) return;
    
    try {
      setAvailabilityLoading(true);
      await fetchCoachAvailability(coachId, date, userTimezone);
      setShowAvailability(true);
    } catch (err: any) {
      console.error('Failed to fetch coach availability:', err);
      setShowAvailability(false);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Handle coach selection
  const handleCoachSelection = (coachId: string) => {
    setSelectedCoach(coachId);
    setShowAvailability(false);
    setCoachAvailability([]);
    setSelectedTime(''); // Clear selected time when switching coaches
    
    // If we have a date selected, immediately fetch availability for this coach
    if (selectedDate) {
      fetchCoachAvailabilityForDate(coachId, selectedDate);
    }
  };

  // Handle date selection for availability
  const handleDateSelection = (date: string) => {
    setSelectedDate(date);
    setSelectedDateForAvailability(date);
    setSelectedTime(''); // Clear selected time when date changes
    // Always fetch availability if we have both coach and date
    if (selectedCoach) {
      fetchCoachAvailabilityForDate(selectedCoach, date);
    }
  };

  // Handle time selection from available slots
  const handleTimeSelection = (time: string) => {
    setSelectedTime(time);
    
    // Update the selectedDate to include the selected time
    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      const [hours, minutes] = time.split(':').map(Number);
      dateObj.setHours(hours, minutes, 0, 0);
      
      // Convert to datetime-local format
      const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
      const dateTimeLocal = localDate.toISOString().slice(0, 16);
      setSelectedDate(dateTimeLocal);
    }
  };

  // Render create/edit request modal
  const renderCreateModal = () => (
    <SimpleModal
      isOpen={showCreateModal}
      onClose={() => {
        setShowCreateModal(false);
        resetForm();
      }}
      title={editingRequestId ? "Edit Class Request" : "Schedule Class"}
      size="md"
    >
              <div className="space-y-6">
                     {userRole === 'parent' && (
             <div>
               <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
                 Select Child *
               </label>
               <select
                 value={selectedChild}
                 onChange={(e) => setSelectedChild(e.target.value)}
                 className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                 required
               >
                 <option value="">Choose a child</option>
                 {children.map((child) => (
                   <option key={child._id} value={child._id}>
                     {child.firstName} {child.lastName}
                   </option>
                 ))}
               </select>
             </div>
           )}

                     <div>
             <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
               Select Coach *
             </label>
                            <select
                 value={selectedCoach}
                 onChange={(e) => handleCoachSelection(e.target.value)}
                 className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                 required
               >
               <option value="">Choose a coach</option>
               {coaches.map((coach) => (
                 <option key={coach._id} value={coach._id}>
                   {coach.firstName} {coach.lastName}
                 </option>
               ))}
             </select>
           </div>

                     <div>
             <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
               Class Date & Time *
             </label>
             <input
               type="datetime-local"
               value={selectedDate}
               onChange={(e) => handleDateSelection(e.target.value)}
               min={new Date().toISOString().slice(0, 16)}
               className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
               required
             />
           </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
              Note (Optional)
            </label>
            <textarea
              value={playerNote}
              onChange={(e) => setPlayerNote(e.target.value)}
              placeholder="Any specific notes about the class, skills you want to work on, or special requests..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] resize-none"
            />
          </div>

        <div className="flex justify-end space-x-4 pt-6">
                     <button
             onClick={() => {
               setShowCreateModal(false);
               resetForm();
             }}
             className="px-6 py-3 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
           >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </div>
          </button>
                     <button
             onClick={handleCreateRequest}
             disabled={!selectedCoach || !selectedDate || isSubmitting}
             className="px-6 py-3 text-sm font-semibold text-white bg-gray-600 border border-transparent rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
           >
             <div className="flex items-center space-x-2">
               {isSubmitting ? (
                 <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               ) : (
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
               )}
               <span>
                 {isSubmitting 
                   ? (editingRequestId ? "Updating..." : "Creating...") 
                   : (editingRequestId ? "Update Request" : "Schedule Class")
                 }
               </span>
             </div>
           </button>
        </div>
      </div>
    </SimpleModal>
  );

  // Render coach response modal
  const renderResponseModal = () => (
    <SimpleModal
      isOpen={showResponseModal}
      onClose={() => setShowResponseModal(false)}
      title="Respond to Request"
      size="md"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
            Status
          </label>
          <div className="relative">
            <select
              value={responseStatus}
              onChange={(e) => setResponseStatus(e.target.value as 'accepted' | 'rejected')}
              className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            >
              <option value="accepted">Accept</option>
              <option value="rejected">Reject</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
            Note (Optional)
          </label>
          <textarea
            value={coachNote}
            onChange={(e) => setCoachNote(e.target.value)}
            placeholder="Add a note for the player, instructions, or any special requirements..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] resize-none"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            onClick={() => setShowResponseModal(false)}
            className="px-6 py-3 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </div>
          </button>   
          <button
            onClick={handleCoachResponse}
            className="px-6 py-3 text-sm font-semibold text-white bg-gray-600 border border-transparent rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Submit Response</span>
            </div>
          </button>
        </div>
      </div>
    </SimpleModal>
  );

  // Render detail modal
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedRequest) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
      >
        <div 
          className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-secondary)] w-full max-w-4xl border border-[var(--border-primary)] transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="rounded-t-2xl bg-[var(--bg-primary)] p-6 border-b border-[var(--border-primary)] transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[var(--bg-secondary)] rounded-full">
                  <svg className="w-6 h-6 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Request Details</h3>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full transition-all duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Status and Date */}
                <div className="flex items-center space-x-4">
                  <span className={`px-4 py-2 text-sm font-semibold rounded-full shadow-sm ${getStatusBadgeColor(selectedRequest.status)}`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                  <div className="flex items-center space-x-2 text-[var(--text-tertiary)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                </div>

                {/* Coach Information */}
                <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] transition-colors duration-300">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide font-semibold">Coach</p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">{getUserDisplayName(selectedRequest.coachId)}</p>
                    </div>
                  </div>
                </div>

                {/* Player Information (for coaches) */}
                {userRole === 'coach' && (
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] transition-colors duration-300">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide font-semibold">Player</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{getUserDisplayName(selectedRequest.userId)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Class Date */}
                <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] transition-colors duration-300">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide font-semibold">Class Date</p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">{formatDate(selectedRequest.date)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Player Note */}
                {selectedRequest.playerNote && (
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] transition-colors duration-300">
                    <div className="flex items-start space-x-4 mb-3">
                      <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mt-1">
                        <svg className="w-6 h-6 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide font-semibold mb-2">Player Note</p>
                        <p className="text-[var(--text-primary)] text-lg leading-relaxed">{selectedRequest.playerNote}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coach Note */}
                {selectedRequest.coachNote && (
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] transition-colors duration-300">
                    <div className="flex items-start space-x-4 mb-3">
                      <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mt-1">
                        <svg className="w-6 h-6 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide font-semibold mb-2">Coach Note</p>
                        <p className="text-[var(--text-primary)] text-lg leading-relaxed">{selectedRequest.coachNote}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3 pt-4">
                  {userRole === 'coach' && selectedRequest.status === 'pending' && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowResponseModal(true);
                      }}
                      className="w-full py-3 px-6 text-sm font-semibold text-white bg-gray-600 border border-transparent rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>Respond to Request</span>
                      </div>
                    </button>
                  )}
                  
                  {(userRole === 'player' || userRole === 'parent') && selectedRequest.status === 'pending' && (
                    <>
                      {!isRequestInPast(selectedRequest.date) ? (
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            // Populate form with existing data
                            // Convert ISO date to datetime-local format
                            setSelectedDate(convertToDateTimeLocal(selectedRequest.date));
                            setPlayerNote(selectedRequest.playerNote || '');
                            setSelectedCoach(typeof selectedRequest.coachId === 'string' ? selectedRequest.coachId : selectedRequest.coachId._id);
                            // Set edit mode
                            setEditingRequestId(selectedRequest._id);
                            setShowCreateModal(true);
                          }}
                          className="w-full py-3 px-6 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-secondary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-primary)] transition-all duration-200"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit Request</span>
                          </div>
                        </button>
                      ) : (
                        <div className="w-full py-3 px-6 text-sm font-medium text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border-2 border-[var(--border-primary)] rounded-xl cursor-not-allowed">
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span>Cannot Edit Past Request</span>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          handleDeleteRequest(selectedRequest._id);
                        }}
                        className="w-full py-3 px-6 text-sm font-semibold text-white bg-gray-600 border border-transparent rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Request</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

    // Render requests list
  const renderRequestsList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {requests.length === 0 ? (
         <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16">
          <div className="mx-auto w-24 h-24 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No requests found</h3>
          <p className="text-[var(--text-secondary)] max-w-sm mx-auto">
            {userRole === 'coach' 
              ? 'No student requests at the moment. Check back later!'
              : 'You haven\'t scheduled any classes yet. Start by scheduling your first class!'
            }
          </p>
        </div>
      ) : (
        requests.map((request, index) => (
          <div
            key={request._id}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] p-6 hover:shadow-[var(--shadow-secondary)] transition-all duration-300 cursor-pointer"
            onClick={() => {
              setSelectedRequest(request);
              setShowDetailModal(true);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`px-4 py-2 text-sm font-semibold rounded-full shadow-sm ${getStatusBadgeColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  <div className="flex items-center space-x-2 text-[var(--text-tertiary)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{formatDate(request.createdAt)}</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-primary)] transition-colors duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Coach</p>
                        <p className="font-medium text-[var(--text-primary)] text-sm">{getUserDisplayName(request.coachId)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {userRole === 'coach' && (
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-primary)] transition-colors duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Player</p>
                          <p className="font-medium text-[var(--text-primary)] text-sm">{getUserDisplayName(request.userId)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-[var(--bg-secondary)] rounded-lg p-3 mb-4 border border-[var(--border-primary)] transition-colors duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide font-semibold">Class Date</p>
                      <p className="font-medium text-[var(--text-primary)] text-sm">{formatDate(request.date)}</p>
                    </div>
                  </div>
                </div>
                
                {request.playerNote && (
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3 mb-3 border border-[var(--border-primary)] transition-colors duration-300">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mt-1">
                        <svg className="w-3 h-3 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide font-semibold mb-1">Player Note</p>
                        <p className="text-[var(--text-primary)] text-sm line-clamp-2">{request.playerNote}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {request.coachNote && (
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3 mb-3 border border-[var(--border-primary)] transition-colors duration-300">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mt-1">
                        <svg className="w-3 h-3 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide font-semibold mb-1">Coach Note</p>
                        <p className="text-[var(--text-primary)] text-sm line-clamp-2">{request.coachNote}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                {userRole === 'coach' && request.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(request);
                      setShowResponseModal(true);
                    }}
                    className="px-3 py-2 text-xs font-medium text-white bg-gray-600 border border-transparent rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span>Respond</span>
                    </div>
                  </button>
                )}
                
                {(userRole === 'player' || userRole === 'parent') && request.status === 'pending' && (
                  <>
                    {!isRequestInPast(request.date) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                          // Convert ISO date to datetime-local format
                          setSelectedDate(convertToDateTimeLocal(request.date));
                          setPlayerNote(request.playerNote || '');
                          setSelectedCoach(typeof request.coachId === 'string' ? request.coachId : request.coachId._id);
                          // Set edit mode
                          setEditingRequestId(request._id);
                          setShowCreateModal(true);
                        }}
                        className="px-3 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </div>
                      </button>
                    ) : (
                      <div className="px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg cursor-not-allowed">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span>Past</span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(request._id);
                      }}
                      className="px-3 py-2 text-xs font-medium text-white bg-gray-600 border border-transparent rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
                    >
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

    // Render children section for parents
  const renderChildrenSection = () => (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] p-8 shadow-[var(--shadow-secondary)] transition-colors duration-300">
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="mx-auto w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <button
            onClick={() => fetchMyChildren()}
            disabled={loading}
            className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-medium rounded-lg hover:bg-[var(--bg-tertiary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-2">
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </div>
          </button>
        </div>
        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">My Children</h3>
        <p className="text-[var(--text-secondary)]">
          Manage and view information about your children 
          {children.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)]">
              {children.length} {children.length === 1 ? 'child' : 'children'}
            </span>
          )}
        </p>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--text-primary)] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">Loading Children</h4>
          <p className="text-[var(--text-secondary)]">Please wait while we fetch your children's information...</p>
        </div>
      ) : children.length === 0 ? (
        <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Children Found</h4>
          <p className="text-[var(--text-secondary)] mb-4">You haven't added any children to your account yet.</p>
          <button className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-sm">
            Add Children
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <div key={child._id} className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] hover:shadow-[var(--shadow-secondary)] transition-all duration-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-tertiary)] flex items-center justify-center">
                  {child.avatar ? (
                    <img 
                      src={child.avatar} 
                      alt={`${child.firstName} ${child.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-[var(--text-primary)]">{child.firstName} {child.lastName}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">Player</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[var(--text-secondary)]">{child.emailAddress?.email || 'No email'}</span>
                </div>
                
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-[var(--text-secondary)]">
                    {child.phoneNumber ? `${child.phoneNumber.countryCode} ${child.phoneNumber.number}` : 'No phone'}
                  </span>
                </div>
                
                {child.lastOnline && (
                  <div className="flex items-center space-x-3 text-sm">
                    <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[var(--text-secondary)]">
                      Last online: {new Date(child.lastOnline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex space-x-2">
                <button 
                  onClick={() => {
                    setSelectedChild(child._id);
                    setActiveTab('schedule');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200"
                >
                  Schedule Class
                </button>
                <button className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-medium rounded-lg hover:bg-[var(--bg-tertiary)] transition-all duration-200">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render schedule new class section
  const renderScheduleSection = () => (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] p-8 shadow-[var(--shadow-secondary)] transition-colors duration-300">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Schedule New Class</h3>
        <p className="text-[var(--text-secondary)]">Book your tennis class with your preferred coach</p>
      </div>
      
      {userRole === 'parent' && children.length === 0 && (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Children Found</h4>
          <p className="text-[var(--text-secondary)] mb-4">Please add children to your account first to schedule classes.</p>
          <button className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Add Children
          </button>
        </div>
      )}
      
      {userRole === 'player' && coaches.length === 0 && (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Coaches Found</h4>
          <p className="text-[var(--text-secondary)] mb-4">Please connect with coaches first to schedule classes.</p>
          <button className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Find Coaches
          </button>
        </div>
      )}
      
      {userRole === 'parent' && children.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
            Select Child
          </label>
          <select
            value={selectedChild}
            onChange={(e) => {
              setSelectedChild(e.target.value);
              if (e.target.value) {
                fetchChildCoaches(e.target.value);
              }
            }}
            className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
          >
            <option value="">Choose a child</option>
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.firstName} {child.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {((userRole === 'player') || (userRole === 'parent' && selectedChild)) && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
              Select Coach
            </label>
            <select
              value={selectedCoach}
              onChange={(e) => handleCoachSelection(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            >
              <option value="">Choose a coach</option>
              {coaches.map((coach) => (
                <option key={coach._id} value={coach._id}>
                  {coach.firstName} {coach.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
              Class Date & Time
            </label>
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => handleDateSelection(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            />
          </div>

          {/* Coach Availability Display */}
          {selectedCoach && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-6 transition-colors duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-[var(--text-primary)]">Coach Availability</h4>
              </div>
              
              {!selectedDate ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-2">
                    <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-[var(--text-secondary)]">Select a date to see coach availability</span>
                  </div>
                </div>
              ) : availabilityLoading ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-2">
                    <svg className="w-5 h-5 text-[var(--text-primary)] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-[var(--text-secondary)]">Checking availability...</span>
                  </div>
                </div>
              ) : availability.length > 0 ? (
                <div>
                  {/* Selected Time Display */}
                  {selectedTime && (
                    <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] transition-colors duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[var(--text-primary)] font-medium">Selected Time: {selectedTime}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTime('');
                            // Reset the date field to just the date without time
                            if (selectedDate) {
                              const dateObj = new Date(selectedDate);
                              const dateOnly = dateObj.toISOString().split('T')[0];
                              setSelectedDate(dateOnly);
                            }
                          }}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    Available time slots for {new Date(selectedDate).toLocaleDateString()}:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {availability.map((slot: AvailabilitySlot, index: number) => (
                      <div
                        key={index}
                        onClick={() => slot.available && handleTimeSelection(slot.time)}
                        className={`p-3 rounded-lg text-center text-sm font-medium cursor-pointer transition-all duration-200 ${
                          slot.available
                            ? selectedTime === slot.time
                              ? 'bg-blue-500 text-white border-2 border-blue-600 shadow-md dark:bg-blue-600 dark:border-blue-500'
                              : 'bg-green-500 text-white border border-green-600 hover:bg-green-600 hover:border-green-700 dark:bg-green-600 dark:border-green-500 dark:hover:bg-green-700'
                            : 'bg-red-500 text-white border border-red-600 cursor-not-allowed dark:bg-red-600 dark:border-red-500'
                        }`}
                      >
                        {formatAvailabilityTime(slot.time)}
                        <div className="text-xs mt-1">
                          {slot.available 
                            ? selectedTime === slot.time 
                              ? 'Selected' 
                              : 'Click to select'
                            : 'Busy'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[var(--text-secondary)]">No availability data for this date.</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
              Note (Optional)
            </label>
            <textarea
              value={playerNote}
              onChange={(e) => setPlayerNote(e.target.value)}
              placeholder="Any specific notes about the class, skills you want to work on, or special requests..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-transparent transition-all duration-200 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] resize-none"
            />
          </div>

                     <button
             onClick={handleCreateRequest}
             disabled={!selectedCoach || !selectedDate || isSubmitting}
             className="w-full py-4 px-6 text-lg font-semibold text-white bg-gray-600 border border-transparent rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
           >
             <div className="flex items-center justify-center space-x-3">
               {isSubmitting ? (
                 <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               ) : (
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
               )}
               <span>
                 {isSubmitting 
                   ? (editingRequestId ? "Updating..." : "Creating...") 
                   : (editingRequestId ? "Update Request" : "Schedule Class")
                 }
               </span>
             </div>
           </button>
        </div>
      )}
    </div>
  );

  if (loading && requests.length === 0) {
    return (
      <DefaultPage>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--bg-tertiary)] rounded w-1/4"></div>
          <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[var(--bg-tertiary)] rounded"></div>
            ))}
          </div>
        </div>
      </DefaultPage>
    );
  }

  return (
    <DefaultPage>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-[var(--bg-card)] p-8 border border-[var(--border-primary)] shadow-[var(--shadow-secondary)] transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-[var(--bg-secondary)] rounded-full">
              <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Class Schedule</h1>
          </div>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl">
            {userRole === 'coach' 
              ? 'Manage class schedule requests from your students with ease'
              : userRole === 'parent'
              ? 'Schedule classes for your children with their coaches seamlessly'
              : 'Schedule classes with your coaches and track your progress'
            }
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-[var(--bg-secondary)] border-l-4 border-[var(--border-primary)] rounded-r-lg p-6 shadow-[var(--shadow-secondary)] transition-colors duration-300">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-2 bg-[var(--bg-tertiary)] rounded-full">
                  <svg className="h-6 w-6 text-[var(--text-primary)]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">Error</h3>
                <p className="text-[var(--text-secondary)]">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="ml-4 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-colors duration-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-secondary)] p-2 border border-[var(--border-primary)] transition-colors duration-300">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'requests'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{userRole === 'coach' ? 'Student Requests' : userRole === 'parent' ? 'Child Requests' : 'My Requests'}</span>
                </div>
              </button>
              
              {(userRole === 'player' || userRole === 'parent') && (
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'schedule'
                      ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Schedule New Class</span>
                  </div>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'requests' ? (
          <div className="space-y-6">
            {/* Child Selector for Parents */}
            {userRole === 'parent' && (
              <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] p-6 shadow-[var(--shadow-secondary)] transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Select Child to View Requests</h3>
                  <button
                    onClick={() => fetchMyChildren()}
                    disabled={loading}
                    className="px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-medium rounded-lg hover:bg-[var(--bg-tertiary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </div>
                  </button>
                </div>
                
                {children.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[var(--text-tertiary)]">No children found. Please add children to your account first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child) => (
                      <button
                        key={child._id}
                        onClick={() => {
                          setSelectedChild(child._id);
                          // Fetch requests for this specific child
                          fetchMyRequests();
                        }}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          selectedChild === child._id
                            ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-sm'
                            : 'border-[var(--border-primary)] hover:border-[var(--border-primary)] hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center">
                            {child.avatar ? (
                              <img 
                                src={child.avatar} 
                                alt={`${child.firstName} ${child.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-[var(--text-primary)]">{child.firstName} {child.lastName}</h4>
                            <p className="text-sm text-[var(--text-secondary)]">Click to view requests</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Show message for parents without selected child */}
            {userRole === 'parent' && !selectedChild ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">Select a Child</h4>
                <p className="text-[var(--text-secondary)]">Choose a child from above to view their class schedule requests.</p>
              </div>
            ) : (
              renderRequestsList()
            )}
          </div>
        ) : activeTab === 'children' ? (
          renderChildrenSection()
        ) : (
          renderScheduleSection()
        )}
      </div>

      {/* Modals */}
      {renderCreateModal()}
      {renderResponseModal()}
      {renderDetailModal()}
    </DefaultPage>
  );
}
