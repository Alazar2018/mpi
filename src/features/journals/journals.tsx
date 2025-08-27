import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";

import { toast } from "react-toastify";
import { journalsService, type Journal, type JournalFolder } from "@/service/journals.server";

// Local state interface for selected journals
interface LocalJournal extends Journal {
    isSelected: boolean;
    localDate: string; // For display purposes
}

export default function Journals() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'all' | 'folders'>('all');

    const [showDropdown, setShowDropdown] = useState<string | null>(null);
    const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
    const [showFolderFilter, setShowFolderFilter] = useState(false);
    
    // State for real data from API
    const [folders, setFolders] = useState<JournalFolder[]>([]);
    const [journals, setJournals] = useState<LocalJournal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination and filtering state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalJournals, setTotalJournals] = useState(0);
    const [filters, setFilters] = useState({
        title: '',
        isFavorite: false,
        color: '',
        folderId: '',
        sort: '-createdAt'
    });
    const [filtering, setFiltering] = useState(false);
    
    // UI state for filters
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set(['-createdAt']));

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (filters.title !== '') {
                setCurrentPage(1); // Reset to first page when searching
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
    }, [filters.title]);

    // Load data from API
    useEffect(() => {
        loadData();
    }, [currentPage, itemsPerPage, filters]);

    const loadData = async () => {
        try {
            if (currentPage === 1 && journals.length === 0) {
                setLoading(true);
            } else {
                setFiltering(true);
            }
            
            // Build query parameters for journals
            const journalParams: any = {
                page: currentPage,
                limit: itemsPerPage,
                sort: filters.sort
            };

            // Add filters if they have values
            if (filters.title) journalParams.title = filters.title;
            if (filters.isFavorite) journalParams.isFavorite = filters.isFavorite;
            if (filters.color) journalParams.color = filters.color;
            if (filters.folderId) journalParams.folderId = filters.folderId;

            const [foldersData, journalsData] = await Promise.all([
                journalsService.getFolders(),
                journalsService.getJournals(journalParams)
            ]);
            
            // Transform journals to include local state
            const transformedJournals: LocalJournal[] = journalsData.map(journal => ({
                ...journal,
                isSelected: false,
                localDate: new Date(journal.createdAt).toLocaleDateString('en-GB')
            }));
            
            setFolders(foldersData);
            setJournals(transformedJournals);
            setTotalJournals(transformedJournals.length); // Note: API should return total count
            setError(null);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load journals and folders');
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
            setFiltering(false);
        }
    };



    // Handle filter changes
    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handle items per page change
    const handleItemsPerPageChange = (limit: number) => {
        setItemsPerPage(limit);
        setCurrentPage(1); // Reset to first page
    };

    // Handle quick filter toggles
    const toggleQuickFilter = (filterType: string, value: any) => {
        const newActiveFilters = new Set(activeQuickFilters);
        
        if (filterType === 'sort') {
            // For sort filters, toggle on/off
            if (newActiveFilters.has(value)) {
                newActiveFilters.delete(value);
                handleFilterChange('sort', '-createdAt'); // Reset to default
            } else {
                // Clear other sort filters and add this one
                newActiveFilters.delete('-createdAt');
                newActiveFilters.delete('title');
                newActiveFilters.delete('-updatedAt');
                newActiveFilters.add(value);
                handleFilterChange('sort', value);
            }
        } else if (filterType === 'isFavorite') {
            // For favorite filter, toggle on/off
            if (newActiveFilters.has('favorite')) {
                newActiveFilters.delete('favorite');
                handleFilterChange('isFavorite', false);
            } else {
                newActiveFilters.add('favorite');
                handleFilterChange('isFavorite', true);
            }
        }
        
        setActiveQuickFilters(newActiveFilters);
    };

    // Handle journal favorite toggle
    const toggleJournalFavorite = async (journalId: string, currentFavorite: boolean) => {
        try {
            await journalsService.updateJournal(journalId, { isFavorite: !currentFavorite });
            // Refresh data after update
            await loadData();
            toast.success(currentFavorite ? 'Removed from favorites' : 'Added to favorites');
        } catch (err) {
            toast.error('Failed to update favorite status');
        }
    };



    // Function to determine if a color is light or dark for text contrast
    const getTextColor = (backgroundColor: string | null | undefined) => {
        // If no background color is provided, return a default dark text color
        if (!backgroundColor) {
            return '#1f2937';
        }
        
        // Convert hex to RGB
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return dark text for light backgrounds, light text for dark backgrounds
        return luminance > 0.5 ? '#1f2937' : '#ffffff';
    };

    // Filter journals based on selected folder
    const filteredJournals = selectedFolderFilter === 'all' 
        ? journals 
        : journals.filter(journal => journal.folderId?._id === selectedFolderFilter);

    const handleJournalClick = (journalId: string) => {
        setSelectedJournal(journalId);
        // Update the journals array to mark the clicked journal as selected
        setJournals(prevJournals => 
            prevJournals.map(journal => ({
                ...journal,
                isSelected: journal._id === journalId
            }))
        );
    };

    const handleDropdownToggle = (journalId: string) => {
        setShowDropdown(showDropdown === journalId ? null : journalId);
    };

    const handleEdit = async (journalId: string) => {
        try {
            setShowDropdown(null);
                    // Navigate to edit page with journal ID
        navigate(`/admin/journals/edit/${journalId}`);
            toast.success("Opening journal for editing...");
        } catch (err) {
            toast.error('Failed to open journal for editing');
        }
    };

    const handleDelete = async (journalId: string) => {
        const journalToDelete = journals.find(j => j._id === journalId);
        
        toast.info(
            <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-xl">🗑️</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Delete Journal</h3>
                        <p className="text-gray-600 text-sm">This action cannot be undone</p>
                    </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">Journal:</span> {journalToDelete?.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Date:</span> {journalToDelete?.localDate}
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            try {
                                toast.dismiss();
                                await journalsService.deleteJournal(journalId);
                                // Refresh data after deletion
                                await loadData();
                                setShowDropdown(null);
                                toast.success(
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600">✓</span>
                                        <span>Journal deleted successfully!</span>
                                    </div>,
                                    {
                                        position: "top-right",
                                        autoClose: 3000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                    }
                                );
                            } catch (err) {
                                toast.error('Failed to delete journal');
                            }
                        }}
                        className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                        Delete Journal
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss();
                            toast.info("Delete cancelled", {
                                position: "top-right",
                                autoClose: 2000,
                            });
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeButton: false,
                closeOnClick: false,
                draggable: false,
                pauseOnHover: false,
                hideProgressBar: true,
            }
        );
    };

    const getFolderName = (folderId?: string) => {
        if (!folderId) return "No Folder";
        const folder = folders.find(f => f._id === folderId);
        return folder ? folder.name : "Unknown Folder";
    };

    const getFolderColor = (folderId?: string) => {
        if (!folderId) return "#6b7280";
        // Generate a color based on folder ID for now
        const colors = ["#1e40af", "#059669", "#ea580c", "#7c3aed", "#be185d", "#d97706", "#0d9488", "#f97316", "#10b981"];
        const index = parseInt(folderId) % colors.length;
        return colors[index] || "#6b7280";
    };

    const getSelectedFolderName = () => {
        if (selectedFolderFilter === 'all') return 'All Folders';
        const folder = folders.find(f => f._id === selectedFolderFilter);
        return folder ? folder.name : 'All Folders';
    };

    const getSelectedFolderColor = () => {
        if (selectedFolderFilter === 'all') return '#6b7280';
        const folder = folders.find(f => f._id === selectedFolderFilter);
        if (folder) {
            const colors = ["#1e40af", "#059669", "#ea580c", "#7c3aed", "#be185d", "#d97706", "#0d9488", "#f97316", "#10b981"];
            const index = parseInt(folder._id) % colors.length;
            return colors[index] || "#6b7280";
        }
        return '#6b7280';
    };

    return (
        <div className="p-6 min-h-screen bg-[var(--bg-primary)]">
            {/* Header with Tabs and New Journal Button */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'all'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:bg-[var(--bg-card)] dark:text-gray-300 dark:hover:text-white'
                        }`}
                    >
                        All Journals
                    </button>
                    <button
                        onClick={() => setActiveTab('folders')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'folders'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:bg-[var(--bg-card)] dark:text-gray-300 dark:hover:text-white'
                        }`}
                    >
                        Folders
                    </button>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={() => navigate('/admin/journals/folders')}
                        className="bg-gray-500 text-white hover:bg-gray-600 rounded-lg px-4 py-2"
                    >
                        Manage Folders
                    </Button>
                    <Button 
                        onClick={() => navigate('/admin/journals/add')}
                        className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2"
                    >
                        New Journal
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-4xl">⏳</span>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-white mb-2">Loading journals...</h3>
                    <p className="text-[var(--text-secondary)] dark:text-gray-300">Please wait while we fetch your data</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-4xl text-red-600">⚠️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error loading data</h3>
                    <p className="text-[var(--text-secondary)] dark:text-gray-300 mb-6">{error}</p>
                    <Button 
                        onClick={loadData}
                        className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2"
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {/* Content based on active tab */}
            {!loading && !error && activeTab === 'all' ? (
                <>
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400">🔍</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search journals by title..."
                                    value={filters.title}
                                    onChange={(e) => handleFilterChange('title', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
                                />
                                {filters.title && (
                                    <button
                                        onClick={() => handleFilterChange('title', '')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-gray-400 dark:hover:text-white"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setFilters({
                                        title: '',
                                        isFavorite: false,
                                        color: '',
                                        folderId: '',
                                        sort: '-createdAt'
                                    });
                                    setActiveQuickFilters(new Set(['-createdAt']));
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                                title="Reset all filters and return to default view"
                            >
                                🔄 Reset All
                            </button>
                        </div>
                    </div>

                    {/* Quick Filter Chips */}
                    <div className="mb-4 flex flex-wrap gap-2">
                        <button
                            onClick={() => toggleQuickFilter('isFavorite', true)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                activeQuickFilters.has('favorite')
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            ⭐ Favorites
                        </button>
                        <button
                            onClick={() => toggleQuickFilter('sort', '-createdAt')}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                activeQuickFilters.has('-createdAt')
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            🕒 Latest
                        </button>
                        <button
                            onClick={() => toggleQuickFilter('sort', 'title')}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                activeQuickFilters.has('title')
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            📝 A-Z
                        </button>
                        <button
                            onClick={() => toggleQuickFilter('sort', '-updatedAt')}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                activeQuickFilters.has('-updatedAt')
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            🔄 Recently Updated
                        </button>
                    </div>

                    {/* Advanced Filters */}
                    <div className="mb-6">
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <span>🔧 Advanced Filters</span>
                            <span className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </button>
                        
                        {showAdvancedFilters && (
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-700">Filter Options</h3>
                                    <button
                                        onClick={() => {
                                            setFilters({
                                                title: '',
                                                isFavorite: false,
                                                color: '',
                                                folderId: '',
                                                sort: '-createdAt'
                                            });
                                            setActiveQuickFilters(new Set(['-createdAt']));
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {/* Title Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                                        <input
                                            type="text"
                                            placeholder="Search by title..."
                                            value={filters.title}
                                            onChange={(e) => handleFilterChange('title', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Favorite Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Favorite</label>
                                        <select
                                            value={filters.isFavorite.toString()}
                                            onChange={(e) => handleFilterChange('isFavorite', e.target.value === 'true')}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All</option>
                                            <option value="true">Favorites Only</option>
                                            <option value="false">Not Favorites</option>
                                        </select>
                                    </div>

                                    {/* Color Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                                        <select
                                            value={filters.color}
                                            onChange={(e) => handleFilterChange('color', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Colors</option>
                                            <option value="1">Blue</option>
                                            <option value="2">Green</option>
                                            <option value="3">Orange</option>
                                            <option value="4">Purple</option>
                                            <option value="5">Pink</option>
                                        </select>
                                    </div>

                                    {/* Sort Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
                                        <select
                                            value={filters.sort}
                                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="-createdAt">Newest First</option>
                                            <option value="createdAt">Oldest First</option>
                                            <option value="title">Title A-Z</option>
                                            <option value="-title">Title Z-A</option>
                                            <option value="-updatedAt">Recently Updated</option>
                                        </select>
                                    </div>

                                    {/* Items Per Page */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Per Page</label>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Folder Filter */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3">
                                                         <label className="text-sm font-medium text-[var(--text-primary)] dark:text-white">Filter by Folder:</label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowFolderFilter(!showFolderFilter)}
                                                                         className="flex items-center gap-2 px-4 py-2 border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] dark:text-white hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)]"
                                >
                                    <div 
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: getSelectedFolderColor() }}
                                    />
                                    <span>{getSelectedFolderName()}</span>
                                                                          <span className="text-[var(--text-secondary)] dark:text-gray-400">▼</span>
                                </button>
                                
                                {/* Folder Filter Dropdown */}
                                {showFolderFilter && (
                                                                         <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-lg z-10">
                                                                                 <div className="p-3 border-b border-[var(--border-secondary)]">
                                                                                         <h3 className="font-medium text-[var(--text-primary)] dark:text-white mb-2">Select Folder</h3>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                <button
                                                    onClick={() => {
                                                        setSelectedFolderFilter('all');
                                                        setShowFolderFilter(false);
                                                    }}
                                                    className="w-full text-left p-2 rounded hover:bg-gray-50 flex items-center gap-3"
                                                >
                                                    <div className="w-4 h-4 rounded bg-gray-500" />
                                                                                                         <span className="text-sm text-[var(--text-primary)] dark:text-white">All Folders</span>
                                                                                                             <span className="text-xs text-[var(--text-secondary)] dark:text-gray-400 ml-auto">
                                                             {journals.length} journals
                                                         </span>
                                                </button>
                                                {folders.map((folder) => (
                                                    <button
                                                        key={folder._id}
                                                        onClick={() => {
                                                            setSelectedFolderFilter(folder._id);
                                                            setShowFolderFilter(false);
                                                        }}
                                                        className="w-full text-left p-2 rounded hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700 flex items-center gap-3"
                                                    >
                                                        <div 
                                                            className="w-4 h-4 rounded"
                                                            style={{ backgroundColor: getFolderColor(folder._id) }}
                                                        />
                                                                                                                 <span className="text-sm text-[var(--text-primary)] dark:text-white">{folder.name}</span>
                                                                                                                 <span className="text-xs text-[var(--text-secondary)] dark:text-gray-400 ml-auto">
                                                             {journals.filter(j => j.folderId?._id === folder._id).length} journals
                                                         </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div className="mb-4 flex items-center justify-between">
                                                 <div className="text-sm text-[var(--text-secondary)] dark:text-gray-300 flex items-center gap-2">
                            {filtering && (
                                <div className="flex items-center gap-1 text-blue-600">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Filtering...</span>
                                </div>
                            )}
                            {filteredJournals.length > 0 ? (
                                <>
                                                                         Found <span className="font-medium text-[var(--text-primary)] dark:text-white">{filteredJournals.length}</span> journal{filteredJournals.length !== 1 ? 's' : ''}
                                    {filters.title && (
                                                                                 <> matching "<span className="font-medium text-[var(--text-primary)] dark:text-white">{filters.title}</span>"</>
                                    )}
                                    {filters.isFavorite && (
                                        <> (favorites only)</>
                                    )}
                                    {filters.color && (
                                                                                 <> with color <span className="font-medium text-[var(--text-primary)] dark:text-white">{filters.color}</span></>
                                    )}
                                </>
                            ) : (
                                "No journals found with current filters"
                            )}
                        </div>
                        
                        {/* Active Quick Filters */}
                        {activeQuickFilters.size > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Active:</span>
                                {Array.from(activeQuickFilters).map(filter => (
                                    <span key={filter} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                        {filter === 'favorite' ? '⭐ Favorites' : 
                                         filter === '-createdAt' ? '🕒 Latest' :
                                         filter === 'title' ? '📝 A-Z' :
                                         filter === '-updatedAt' ? '🔄 Recently Updated' : filter}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {Object.values(filters).some(value => value !== '' && value !== false && value !== '-createdAt') && (
                            <div className="text-xs text-gray-500">
                                Advanced filters: {Object.entries(filters)
                                    .filter(([, value]) => value !== '' && value !== false && value !== '-createdAt')
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ')}
                            </div>
                        )}
                    </div>

                    {/* All Journals View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredJournals.map((journal) => {
                            const backgroundColor = journal.isSelected ? '#4ade80' : (journal.color || '#f3f4f6');
                            const textColor = journal.isSelected ? '#ffffff' : getTextColor(journal.color);
                            
                            return (
                                <div
                                    key={journal._id}
                                    className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                        journal.isSelected
                                            ? 'border-green-500 shadow-md'
                                            : 'border-gray-200 hover:shadow-md'
                                    }`}
                                    style={{
                                        backgroundColor: backgroundColor,
                                        color: textColor
                                    }}
                                    onClick={() => handleJournalClick(journal._id)}
                                >
                                    {/* Folder Badge */}
                                    {journal.folderId && (
                                        <div className="absolute top-2 left-2">
                                            <span 
                                                className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                                style={{ backgroundColor: getFolderColor(journal.folderId._id) }}
                                            >
                                                {getFolderName(journal.folderId._id)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Journal Icon - Scribble/Loop Icons */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex flex-col gap-1">
                                            <div 
                                                className="w-2 h-1 rounded-full"
                                                style={{ backgroundColor: textColor }}
                                            ></div>
                                            <div 
                                                className="w-3 h-1 rounded-full"
                                                style={{ backgroundColor: textColor }}
                                            ></div>
                                            <div 
                                                className="w-2 h-1 rounded-full"
                                                style={{ backgroundColor: textColor }}
                                            ></div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Favorite Toggle */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleJournalFavorite(journal._id, journal.isFavorite);
                                                }}
                                                className={`p-2 rounded-full transition-all duration-200 ${
                                                    journal.isFavorite 
                                                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                                                }`}
                                                title={journal.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                                {journal.isFavorite ? '⭐' : '☆'}
                                            </button>
                                            
                                            {/* Dropdown Menu */}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDropdownToggle(journal._id);
                                                    }}
                                                    className="p-1 opacity-70 hover:opacity-100 transition-opacity"
                                                    style={{ color: textColor }}
                                                >
                                                    ⋯
                                                </button>
                                                
                                                {/* Dropdown Menu */}
                                                {showDropdown === journal._id && (
                                                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(journal._id);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(journal._id);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Journal Content */}
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">{journal.title}</h3>
                                        <p 
                                            className="text-sm mb-3 opacity-70"
                                            style={{ color: textColor }}
                                        >
                                            {journal.localDate}
                                        </p>
                                        <p 
                                            className="text-sm leading-relaxed opacity-90"
                                            style={{ color: textColor }}
                                        >
                                            {journal.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* No Journals Message */}
                    {filteredJournals.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-4xl">📝</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No journals found</h3>
                            <p className="text-gray-500 mb-6">
                                {selectedFolderFilter === 'all' 
                                    ? "No journals available. Create your first journal!"
                                    : `No journals found in the selected folder. Try a different filter or create a new journal.`
                                }
                            </p>
                            <Button 
                                onClick={() => navigate('/admin/journals/add')}
                                className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2"
                            >
                                Create Journal
                            </Button>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {filteredJournals.length > 0 && (
                        <div className="mt-8 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalJournals)} of {totalJournals} journals
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                
                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.ceil(totalJournals / itemsPerPage) }, (_, i) => i + 1)
                                        .filter(page => {
                                            // Show first page, last page, current page, and pages around current
                                            const totalPages = Math.ceil(totalJournals / itemsPerPage);
                                            if (totalPages <= 7) return true;
                                            if (page === 1 || page === totalPages) return true;
                                            if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                                            return false;
                                        })
                                        .map((page, index, array) => {
                                            // Add ellipsis if there are gaps
                                            const prevPage = array[index - 1];
                                            const showEllipsis = prevPage && page - prevPage > 1;
                                            
                                            return (
                                                <div key={page} className="flex items-center">
                                                    {showEllipsis && (
                                                        <span className="px-2 text-gray-500">...</span>
                                                    )}
                                                    <button
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-3 py-2 text-sm border rounded-md ${
                                                            currentPage === page
                                                                ? 'bg-blue-500 text-white border-blue-500'
                                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                </div>
                                
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= Math.ceil(totalJournals / itemsPerPage)}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : !loading && !error ? (
                /* Folders Overview */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {folders.map((folder) => (
                        <div
                            key={folder._id}
                            className="relative p-6 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                            style={{ backgroundColor: getFolderColor(folder._id) }}
                            onClick={() => navigate(`/admin/journals/folder/${folder._id}`)}
                        >
                            {/* Folder Icon */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-2xl">📁</span>
                                </div>
                            </div>

                            {/* Folder Info */}
                            <div className="text-white">
                                <h3 className="font-bold text-lg mb-2">{folder.name}</h3>
                                <p className="text-sm opacity-90 mb-2">
                                    {journals.filter(j => j.folderId?._id === folder._id).length} {journals.filter(j => j.folderId?._id === folder._id).length === 1 ? 'journal' : 'journals'}
                                </p>
                                <p className="text-xs opacity-75">
                                    Created {new Date(folder.createdAt).toLocaleDateString('en-GB')}
                                </p>
                            </div>
                        </div>
                    ))}
                    
                    {/* Create New Folder Card */}
                    <div
                        className="p-6 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer transition-all duration-200 hover:border-gray-400 hover:bg-gray-50"
                        onClick={() => navigate('/admin/journals/folders')}
                    >
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl text-gray-400">+</span>
                            </div>
                            <h3 className="font-medium text-gray-600">Create New Folder</h3>
                            <p className="text-sm text-gray-500 mt-1">Organize your journals</p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}