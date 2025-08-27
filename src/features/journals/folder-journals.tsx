import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button";
import icons from "@/utils/icons";
import { toast } from "react-toastify";
import { journalsService, type Journal, type JournalFolder } from "@/service/journals.server";

interface LocalJournal extends Journal {
    isSelected: boolean;
    localDate: string;
}

export default function FolderJournals() {
    const navigate = useNavigate();
    const { folderId } = useParams();

    const [showDropdown, setShowDropdown] = useState<string | null>(null);
    const [currentFolder, setCurrentFolder] = useState<JournalFolder | null>(null);
    
    const [folders, setFolders] = useState<JournalFolder[]>([]);
    const [journals, setJournals] = useState<LocalJournal[]>([]);


    // Filter journals for current folder
    const folderJournals = journals.filter(journal => journal.folderId?._id === folderId);

    // Load data from API
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [foldersData, journalsData] = await Promise.all([
                    journalsService.getFolders(),
                    journalsService.getJournals()
                ]);
                
                // Transform journals to include local state
                const transformedJournals: LocalJournal[] = journalsData.map(journal => ({
                    ...journal,
                    isSelected: false,
                    localDate: new Date(journal.createdAt).toLocaleDateString('en-GB')
                }));
                
                setFolders(foldersData);
                setJournals(transformedJournals);
            } catch (err) {
                console.error('Error loading data:', err);
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, []);

    useEffect(() => {
        if (folderId) {
            const folder = folders.find(f => f._id === folderId);
            setCurrentFolder(folder || null);
        }
    }, [folderId, folders]);

    // Function to determine if a color is light or dark for text contrast
    const getTextColor = (backgroundColor: string | null | undefined) => {
        // If no background color is provided, return a default dark text color
        if (!backgroundColor) {
            return '#1f2937';
        }
        
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#1f2937' : '#ffffff';
    };

    const handleJournalClick = (journalId: string) => {
        setSelectedJournal(journalId);
    };

    const handleDropdownToggle = (journalId: string) => {
        setShowDropdown(showDropdown === journalId ? null : journalId);
    };

    const handleEdit = (journalId: string) => {
        navigate(`/admin/journals/edit/${journalId}`);
        toast.success("Opening journal for editing...");
    };

    const handleDelete = (journalId: string) => {
        const journalToDelete = folderJournals.find(j => j._id === journalId);
        
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
                        onClick={() => {
                            toast.dismiss();
                            toast.success("Journal deleted successfully!");
                        }}
                        className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                        Delete Journal
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss();
                            toast.info("Delete cancelled");
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

    if (!currentFolder) {
        return (
            <div className="p-6 min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-600">Folder not found</h2>
                    <Button 
                        onClick={() => navigate('/admin/journals')}
                        className="mt-4 bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2"
                    >
                        Back to Journals
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/admin/journals')}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <i dangerouslySetInnerHTML={{ __html: icons.chevronLeft }} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-8 h-8 rounded-lg"
                            style={{ backgroundColor: "#1e40af" }}
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{currentFolder.name}</h1>
                            <p className="text-sm text-gray-600">
                                {folderJournals.length} {folderJournals.length === 1 ? 'journal' : 'journals'}
                            </p>
                        </div>
                    </div>
                </div>
                <Button 
                    onClick={() => navigate('/admin/journals/add')}
                    className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2"
                >
                    New Journal
                </Button>
            </div>

            {/* Journals Grid */}
            {folderJournals.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-4xl">📝</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No journals yet</h3>
                    <p className="text-gray-500 mb-6">Start writing your first journal in this folder</p>
                    <Button 
                        onClick={() => navigate('/admin/journals/add')}
                        className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2"
                    >
                        Create First Journal
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {folderJournals.map((journal) => {
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
            )}
        </div>
    );
}
