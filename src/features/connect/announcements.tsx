import { useState, useEffect } from "react";
import { announcementService } from "@/service/announcement.server";
import type { Announcement, CreateAnnouncementRequest } from "@/service/announcement.server";
import { useAuthStore } from "@/store/auth.store";

const categories = [
  "match",
  "training", 
  "message",
  "course"
];

export default function Announcements() {
  const [searchQuery, setSearchQuery] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filter, setFilter] = useState<"all" | "my">("all");
  const [editFormData, setEditFormData] = useState({
    title: "",
    category: "",
    description: "",
    announcedTo: "All" as "All" | "Players" | "Coaches" | "Parents" | "None"
  });
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    announcedTo: "All" as "All" | "Players" | "Coaches" | "Parents" | "None"
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openDeleteDropdown, setOpenDeleteDropdown] = useState<string | null>(null);

  const { user } = useAuthStore();
  const isCoach = user?.role === 'coach';

  // Load announcements on component mount and when filter changes
  useEffect(() => {
    loadAnnouncements();
  }, [filter]);

  // Close delete dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDeleteDropdown) {
        setOpenDeleteDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDeleteDropdown]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading announcements...', filter === 'my' ? '(my announcements)' : '(all announcements)');
      const response = filter === 'my' 
        ? await announcementService.getMyAnnouncements()
        : await announcementService.getAnnouncements();
      console.log('API response:', response);
      console.log('Response data structure:', {
        hasData: !!response?.data,
        dataType: typeof response?.data,
        hasAnnouncements: !!response?.data?.announcements,
        announcementsType: typeof response?.data?.announcements,
        isArray: Array.isArray(response?.data?.announcements)
      });
      
      if (response && response.success && response.data && response.data.announcements && Array.isArray(response.data.announcements)) {
        console.log('Setting announcements:', response.data.announcements);
        setAnnouncements(response.data.announcements);
      } else if (response && response.success && Array.isArray(response.data)) {
        // Fallback for direct array response
        console.log('Setting announcements (direct array):', response.data);
        setAnnouncements(response.data);
      } else {
        console.warn('API response data structure is unexpected:', response);
        setAnnouncements([]);
        setError(response?.message || 'Failed to load announcements - invalid data format');
      }
    } catch (err) {
      console.error('Error loading announcements:', err);
      
      // For development/testing, you can uncomment this to see sample data
      // setAnnouncements([
      //   {
      //     _id: '1',
      //     title: 'Sample Announcement',
      //     description: 'This is a sample announcement for testing',
      //     category: 'training',
      //     announcedTo: 'Players',
      //     createdBy: {
      //       _id: '1',
      //       firstName: 'John',
      //       lastName: 'Doe',
      //       avatar: '',
      //       role: 'coach',
      //       lastOnline: new Date().toISOString()
      //     },
      //     deletedBy: [],
      //     createdAt: new Date().toISOString(),
      //     updatedAt: new Date().toISOString()
      //   }
      // ]);
      
      setAnnouncements([]);
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = (() => {
    try {
      if (!Array.isArray(announcements)) {
        console.warn('Announcements is not an array:', announcements);
        return [];
      }
      
      return announcements.filter(announcement =>
        announcement.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } catch (error) {
      console.error('Error filtering announcements:', error);
      return [];
    }
  })();

  const handleNewAnnouncement = () => {
    if (!isCoach) {
      setError('Only coaches can create announcements');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({ title: "", category: "", description: "", announcedTo: "All" });
    setError(null);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAnnouncement(null);
    setIsEditMode(false);
    setEditFormData({ title: "", category: "", description: "", announcedTo: "All" });
  };

  const handleAnnouncementClick = async (announcement: Announcement) => {
    // Simply show the announcement details without marking as read
    setSelectedAnnouncement(announcement);
    setShowDetailModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const createData: CreateAnnouncementRequest = {
        title: formData.title,
        description: formData.description,
        category: formData.category as 'match' | 'training' | 'message' | 'course',
        announcedTo: formData.announcedTo as 'All' | 'Players' | 'Coaches' | 'Parents' | 'None'
      };

      const response = await announcementService.createAnnouncement(createData);
      
      if (response.success) {
        // Reload announcements to show the new one
        await loadAnnouncements();
    handleCloseModal();
      } else {
        setError(response.message || 'Failed to create announcement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!announcementService.canDeleteAnnouncements()) {
      setError('You do not have permission to delete announcements');
      return;
    }

    try {
      setOpenDeleteDropdown(null); // Close dropdown
      const response = await announcementService.softDeleteAnnouncement(announcementId);
      if (response.success) {
        // Close detail modal if open
        if (showDetailModal) {
          handleCloseDetailModal();
        }
        // Reload announcements
        await loadAnnouncements();
      } else {
        setError(response.message || 'Failed to delete announcement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement');
    }
  };

  const handleEditAnnouncement = async (announcementId: string, data: any) => {
    if (!announcementService.canEditAnnouncements()) {
      setError('You do not have permission to edit announcements');
      return;
    }

    try {
      const response = await announcementService.updateMyAnnouncement(announcementId, data);
      if (response.success) {
        // Reload announcements
        await loadAnnouncements();
        handleCloseDetailModal();
      } else {
        setError(response.message || 'Failed to update announcement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update announcement');
    }
  };

  const handleClearAllAnnouncements = async () => {
    if (!announcementService.canDeleteAnnouncements()) {
      setError('You do not have permission to clear announcements');
      return;
    }

    if (!window.confirm('Are you sure you want to clear all announcements? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      
      const response = await announcementService.clearAllAnnouncements();
      if (response.success) {
        // Reload announcements
        await loadAnnouncements();
      } else {
        setError(response.message || 'Failed to clear announcements');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear announcements');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditModeToggle = () => {
    if (selectedAnnouncement) {
      setEditFormData({
        title: selectedAnnouncement.title,
        category: selectedAnnouncement.category,
        description: selectedAnnouncement.description,
        announcedTo: (selectedAnnouncement.announcedTo as "All" | "Players" | "Coaches" | "Parents" | "None") || "All"
      });
      setIsEditMode(true);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedAnnouncement || !editFormData.title || !editFormData.category || !editFormData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await handleEditAnnouncement(selectedAnnouncement._id, editFormData);
      setIsEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({ title: "", category: "", description: "", announcedTo: "All" });
  };

  const handleHardDeleteAnnouncement = async (announcementId: string) => {
    if (!announcementService.canEditAnnouncements()) {
      setError('You do not have permission to permanently delete announcements');
      return;
    }

    if (!window.confirm('Are you sure you want to permanently delete this announcement? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setOpenDeleteDropdown(null); // Close dropdown
      
      const response = await announcementService.deleteMyAnnouncement(announcementId);
      if (response.success) {
        // Reload announcements
        await loadAnnouncements();
        // Close modal if it's open
        if (showDetailModal) {
          handleCloseDetailModal();
        }
      } else {
        setError(response.message || 'Failed to delete announcement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--bg-primary)] dark:bg-gray-900 rounded-2xl p-6 h-full">
        <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-2xl p-6 h-full shadow-sm flex flex-col">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-12 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-primary)] dark:bg-gray-900 rounded-2xl p-6 h-full">
      <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-2xl p-6 h-full shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-white">Announcements</h1>
          <div className="flex items-center gap-3">
            {announcementService.canDeleteAnnouncements() && (announcements || []).length > 0 && (
              <button 
                onClick={handleClearAllAnnouncements}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? 'Clearing...' : 'Clear All'}
              </button>
            )}
            {isCoach && (
          <button 
            onClick={handleNewAnnouncement}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Announcement
          </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Filter and Search Section */}
        <div className="mb-6 flex-shrink-0 space-y-4">
          {/* Filter Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-400">Filter:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "all"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                All Announcements
              </button>
              <button
                onClick={() => setFilter("my")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "my"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                My Announcements
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search announcements"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-4 pr-12 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-[var(--text-secondary)] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Announcements List - Scrollable Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div 
                key={announcement._id} 
                className="bg-[var(--bg-card)] dark:bg-gray-700 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAnnouncementClick(announcement)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-[var(--text-primary)] dark:text-white text-lg mb-1">
                      {announcement.title}
                    </h3>
                      <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                      {announcementService.formatAnnouncementDate(announcement.createdAt)} • {announcementService.formatAnnouncementTime(announcement.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[var(--bg-secondary)] dark:bg-gray-600 text-[var(--text-secondary)] dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0">
                      {announcement.category}
                    </span>
                    {announcementService.canDeleteAnnouncements() && (
                      (filter === "my" || 
                       (typeof announcement.createdBy === 'object' && announcement.createdBy && announcement.createdBy._id === user?._id))
                    ) && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDeleteDropdown(openDeleteDropdown === announcement._id ? null : announcement._id);
                          }}
                          className="text-red-500 hover:text-red-600 p-1"
                          title="Delete options"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <div className={`absolute right-0 top-full mt-1 bg-[var(--bg-card)] dark:bg-gray-800 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px] ${openDeleteDropdown === announcement._id ? 'block' : 'hidden'}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnnouncement(announcement._id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border-b border-[var(--border-primary)] dark:border-gray-600"
                          >
                            Soft Delete
                          </button>
                          {announcementService.canEditAnnouncements() && (
                            (filter === "my" || 
                             (typeof announcement.createdBy === 'object' && announcement.createdBy && announcement.createdBy._id === user?._id))
                          ) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHardDeleteAnnouncement(announcement._id);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-red-800 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              Hard Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] dark:text-gray-400 text-sm leading-relaxed">
                  {announcement.description}
                </p>
                {typeof announcement.createdBy === 'object' && announcement.createdBy && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-[var(--bg-tertiary)] dark:bg-gray-600 rounded-full flex items-center justify-center">
                      {announcement.createdBy.avatar ? (
                        <img 
                          src={announcement.createdBy.avatar} 
                          alt={`${announcement.createdBy.firstName} ${announcement.createdBy.lastName}`}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-[var(--text-secondary)] dark:text-gray-400 font-medium">
                          {announcement.createdBy.firstName.charAt(0)}{announcement.createdBy.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)] dark:text-gray-500">
                      {announcement.createdBy.firstName} {announcement.createdBy.lastName} ({announcement.createdBy.role})
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredAnnouncements.length === 0 && (
            <div className="text-center py-8 text-[var(--text-secondary)] dark:text-gray-400">
              {searchQuery 
                ? "No announcements found matching your search." 
                : filter === "my" 
                  ? "You haven't created any announcements yet." 
                  : "No announcements yet."}
            </div>
          )}
        </div>
      </div>

      {/* Create New Announcement Modal */}
      {showCreateModal && (
         <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[60vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-white">Create New Announcement</h2>
                <button 
                  onClick={handleCloseModal} 
                  className="text-red-500 hover:text-red-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Title Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                  className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
                />
              </div>

              {/* Category Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white appearance-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-[var(--text-secondary)] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Description Textarea */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Write a short description"
                  rows={4}
                  className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white resize-none"
                />
              </div>

              {/* Announced To Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Announced To
                </label>
                <div className="relative">
                  <select
                    value={formData.announcedTo}
                    onChange={(e) => setFormData({ ...formData, announcedTo: e.target.value as "All" | "Players" | "Coaches" | "Parents" | "None" })}
                    className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white appearance-none"
                  >
                    <option value="All">All</option>
                    <option value="Players">Players</option>
                    <option value="Coaches">Coaches</option>
                    <option value="Parents">Parents</option>
                    <option value="None">None</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-[var(--text-secondary)] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.category || !formData.description || submitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Creating...' : 'Create Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Detail Modal */}
      {showDetailModal && selectedAnnouncement && (
         <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[60vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-white">
                  {isEditMode ? 'Edit Announcement' : 'Announcement Details'}
                </h2>
                <div className="flex items-center gap-2">
                  {isEditMode ? (
                    <>
                      <button 
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white font-medium"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleEditSubmit}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <>
                      {announcementService.canEditAnnouncements() && (
                        (filter === "my" || 
                         (typeof selectedAnnouncement.createdBy === 'object' && selectedAnnouncement.createdBy && selectedAnnouncement.createdBy._id === user?._id))
                      ) && (
                        <button 
                          onClick={handleEditModeToggle}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      )}
                      {announcementService.canDeleteAnnouncements() && (
                        (filter === "my" || 
                         (typeof selectedAnnouncement.createdBy === 'object' && selectedAnnouncement.createdBy && selectedAnnouncement.createdBy._id === user?._id))
                      ) && (
                        <button 
                          onClick={() => handleDeleteAnnouncement(selectedAnnouncement._id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </>
                  )}
                <button 
                  onClick={handleCloseDetailModal} 
                  className="text-red-500 hover:text-red-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                </div>
              </div>

              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    placeholder="Enter title"
                    className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
                  />
                ) : (
                <div className="w-full p-4 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white">
                  {selectedAnnouncement.title}
                </div>
                )}
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                {isEditMode ? (
                  <div className="relative">
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white appearance-none"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--text-secondary)] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                <div className="w-full p-4 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white">
                  <span className="bg-[var(--bg-secondary)] dark:bg-gray-600 text-[var(--text-secondary)] dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedAnnouncement.category}
                  </span>
                </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Date & Time
                </label>
                <div className="w-full p-4 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white">
                  {announcementService.formatAnnouncementDate(selectedAnnouncement.createdAt)} • {announcementService.formatAnnouncementTime(selectedAnnouncement.createdAt)}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                {isEditMode ? (
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Write a short description"
                    rows={4}
                    className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white resize-none min-h-[100px]"
                  />
                ) : (
                <div className="w-full p-4 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white min-h-[100px]">
                    {selectedAnnouncement.description}
                </div>
                )}
              </div>

              {/* Announced To */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Announced To
                </label>
                {isEditMode ? (
                  <div className="relative">
                    <select
                      value={editFormData.announcedTo}
                      onChange={(e) => setEditFormData({ ...editFormData, announcedTo: e.target.value as "All" | "Players" | "Coaches" | "Parents" | "None" })}
                      className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white appearance-none"
                    >
                      <option value="All">All</option>
                      <option value="Players">Players</option>
                      <option value="Coaches">Coaches</option>
                      <option value="Parents">Parents</option>
                      <option value="None">None</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--text-secondary)] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                <div className="w-full p-4 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white">
                  {selectedAnnouncement.announcedTo || "All"}
                </div>
                )}
              </div>

                            {/* Created By */}
              {typeof selectedAnnouncement.createdBy === 'object' && selectedAnnouncement.createdBy && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                    Created By
                  </label>
                  <div className="w-full p-4 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--bg-tertiary)] dark:bg-gray-600 rounded-full flex items-center justify-center">
                        {selectedAnnouncement.createdBy.avatar ? (
                          <img 
                            src={selectedAnnouncement.createdBy.avatar} 
                            alt={`${selectedAnnouncement.createdBy.firstName} ${selectedAnnouncement.createdBy.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-[var(--text-secondary)] dark:text-gray-400 font-medium">
                            {selectedAnnouncement.createdBy.firstName.charAt(0)}{selectedAnnouncement.createdBy.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)] dark:text-white">
                          {selectedAnnouncement.createdBy.firstName} {selectedAnnouncement.createdBy.lastName}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400 capitalize">
                          {selectedAnnouncement.createdBy.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      )}
    </div>
  );
}
