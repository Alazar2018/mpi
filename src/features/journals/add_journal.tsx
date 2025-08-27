import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button";
import icons from "@/utils/icons";
import { toast } from "react-toastify";
import { journalsService } from "@/service/journals.server";

interface Folder {
    _id: string;
    name: string;
    user: string;
    createdAt: string;
    updatedAt: string;
}

export default function AddJournal() {
    const navigate = useNavigate();
    const { journalId } = useParams();
    const isEditing = Boolean(journalId);
    
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(false);


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

    // Function to generate a consistent color for folders based on their ID
    const getFolderColor = (folderId: string): string => {
        const colors = [
            "#1e40af", "#059669", "#ea580c", "#7c3aed", "#be185d",
            "#d97706", "#0d9488", "#f97316", "#10b981", "#8b5cf6"
        ];
        const hash = folderId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return colors[Math.abs(hash) % colors.length];
    };
    
    const [journalTitle, setJournalTitle] = useState("");
    const [journalContent, setJournalContent] = useState("");
    const [selectedFolder, setSelectedFolder] = useState("");
    const [selectedColor, setSelectedColor] = useState("#ffffff");

    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);
    
    // New folder creation state
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderColor, setNewFolderColor] = useState("#1e40af");

    const colorOptions = [
        "#1e40af", "#059669", "#ea580c", "#7c3aed", "#be185d",
        "#d97706", "#0d9488", "#f97316", "#10b981", "#8b5cf6",
        "#f59e0b", "#06b6d4", "#84cc16", "#f43f5e", "#6366f1"
    ];

    // Load folders and journal data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Load folders
                const foldersData = await journalsService.getFolders();
                setFolders(foldersData);
                
                // If editing, load journal data
                if (isEditing && journalId) {
                    const journalData = await journalsService.getJournal(journalId);
                    setJournalTitle(journalData.title);
                    setJournalContent(journalData.content);
                    if (journalData.folderId?._id) {
                        setSelectedFolder(journalData.folderId._id);
                    }
                    if (journalData.color) {
                        setSelectedColor(journalData.color);
                    }
                }
            } catch (err) {
                console.error('Error loading data:', err);
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [isEditing, journalId]);

    // Close color picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.color-picker-container')) {
                setShowColorPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) {
            toast.error("Please enter a folder name");
            return;
        }

        const newFolder: Folder = {
            _id: Date.now().toString(),
            name: newFolderName.trim(),
            user: "current-user", // This should come from auth context
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
        };

        setFolders(prev => [newFolder, ...prev]);
        setSelectedFolder(newFolder._id);
        setNewFolderName("");
        setNewFolderColor("#1e40af");
        setShowFolderModal(false);
        toast.success("Folder created successfully!");
    };

    const handleSave = async () => {
        if (!journalTitle.trim()) {
            toast.error("Please enter a journal title");
            return;
        }

        if (!journalContent.trim()) {
            toast.error("Please enter some content");
            return;
        }

        try {
            if (isEditing && journalId) {
                await journalsService.updateJournal(journalId, {
                    title: journalTitle,
                    content: journalContent,
                    folderId: selectedFolder || undefined,
                    color: selectedColor
                });
                toast.success("Journal updated successfully!");
            } else {
                await journalsService.createJournal({
                    title: journalTitle,
                    content: journalContent,
                    folderId: selectedFolder || undefined,
                    color: selectedColor
                });
                toast.success("Journal created successfully!");
            }

            // Navigate back to journals list
            navigate('/admin/journals');
        } catch (err) {
            console.error('Error saving journal:', err);
            toast.error('Failed to save journal');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-3">
                                         <button 
                         onClick={() => navigate('/admin/journals')}
                         className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-gray-300 dark:hover:text-white"
                     >
                        <i dangerouslySetInnerHTML={{ __html: icons.chevronLeft }} />
                    </button>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)] dark:text-white">
                        {isEditing ? "Editing Journal" : "Adding new Journal"}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button 
                            className="flex items-center gap-2 px-4 py-2 border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] dark:text-white hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700 bg-[var(--bg-primary)]"
                            onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                        >
                            <span>{selectedFolder || "Select Folder"}</span>
                            <span>▼</span>
                        </button>
                        
                        {/* Folder Dropdown */}
                        {showFolderDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-lg z-10">
                                <div className="p-3 border-b border-[var(--border-secondary)]">
                                    <h3 className="font-medium text-[var(--text-primary)] dark:text-white mb-2">Select Folder</h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                                                                 {folders.map((folder) => (
                                             <button
                                                 key={folder._id}
                                                 onClick={() => {
                                                     setSelectedFolder(folder._id);
                                                     setShowFolderDropdown(false);
                                                 }}
                                                 className="w-full text-left p-2 rounded hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700 flex items-center gap-3"
                                             >
                                                 <div 
                                                     className="w-4 h-4 rounded"
                                                     style={{ backgroundColor: getFolderColor(folder._id) }}
                                                 />
                                                 <span className="text-sm">{folder.name}</span>
                                             </button>
                                         ))}
                                    </div>
                                </div>
                                
                                {/* Create New Folder Option */}
                                <div className="p-3 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowFolderDropdown(false);
                                            setShowFolderModal(true);
                                        }}
                                        className="w-full text-center p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded font-medium"
                                    >
                                        + Create New Folder
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex gap-6 p-6">
                {/* Left Side - Journal Content */}
                <div className="flex-1">
                    {/* Title Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                            Journal Title
                        </label>
                        <input
                            type="text"
                            value={journalTitle}
                            onChange={(e) => setJournalTitle(e.target.value)}
                            placeholder="Enter journal title..."
                            className="w-full px-4 py-3 text-lg border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
                        />
                    </div>

                    {/* Content Textarea */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                            Journal Content
                        </label>
                        <div className="min-h-[500px] border border-[var(--border-primary)] rounded-lg">
                            <textarea
                                value={journalContent}
                                onChange={(e) => setJournalContent(e.target.value)}
                                placeholder="Start writing your journal here..."
                                className="w-full h-full min-h-[500px] p-4 text-[var(--text-primary)] dark:text-white placeholder-[var(--text-tertiary)] dark:placeholder-gray-400 border-none outline-none focus:ring-0 resize-none rounded-lg bg-[var(--bg-primary)]"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side - Settings */}
                <div className="w-80 space-y-6">
                    {/* Folder Selection */}
                    <div className="bg-[var(--bg-secondary)] dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-medium text-[var(--text-primary)] dark:text-white mb-3">Folder</h3>
                        {selectedFolder ? (
                            <div className="flex items-center gap-2 p-2 bg-[var(--bg-card)] dark:bg-gray-600 rounded border border-[var(--border-primary)]">
                                                                 <div 
                                     className="w-4 h-4 rounded"
                                     style={{ 
                                         backgroundColor: folders.find(f => f._id === selectedFolder) ? getFolderColor(selectedFolder) : "#6b7280" 
                                     }}
                                 />
                                                                 <span className="text-sm font-medium">
                                     {folders.find(f => f._id === selectedFolder)?.name || selectedFolder}
                                 </span>
                                <button
                                    onClick={() => setSelectedFolder("")}
                                    className="ml-auto text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--text-secondary)] dark:text-gray-300">No folder selected</p>
                        )}
                    </div>

                    {/* Color Selection */}
                    <div className="bg-[var(--bg-secondary)] dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-medium text-[var(--text-primary)] dark:text-white mb-3">Journal Color</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        selectedColor === color 
                                            ? 'border-gray-800 scale-110' 
                                            : 'border-gray-300 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                        <div className="mt-3 p-2 bg-[var(--bg-card)] dark:bg-gray-600 rounded border border-[var(--border-primary)]">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: selectedColor }}
                                />
                                <span className="text-sm font-medium">Selected: {selectedColor}</span>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-[var(--bg-secondary)] dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-medium text-[var(--text-primary)] dark:text-white mb-3">Preview</h3>
                        <div 
                            className="p-3 rounded border border-[var(--border-primary)]"
                            style={{ 
                                backgroundColor: selectedColor,
                                color: getTextColor(selectedColor)
                            }}
                        >
                            <h4 className="font-medium mb-1">Sample Journal</h4>
                            <p className="text-xs opacity-80">This is how your journal will look</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-6 right-6">
                <Button
                    onClick={handleSave}
                    className="bg-green-100 text-green-700 hover:bg-green-200 rounded-lg px-6 py-3 font-medium"
                >
                    {isEditing ? "Update Journal" : "Save Journal"}
                </Button>
            </div>

            {/* Create Folder Modal */}
            {showFolderModal && (
                <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
                    <div className="bg-[var(--bg-card)] rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-white">Create New Folder</h2>
                                <button 
                                    onClick={() => setShowFolderModal(false)} 
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-gray-400 dark:hover:text-white p-2"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                                    Folder Name
                                </label>
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Enter folder name"
                                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[var(--text-primary)] dark:text-white bg-[var(--bg-primary)]"
                                    autoFocus
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                                    Folder Color
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setNewFolderColor(color)}
                                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                                newFolderColor === color 
                                                    ? 'border-gray-800 scale-110' 
                                                    : 'border-gray-300 hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowFolderModal(false)}
                                    className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-gray-300 dark:hover:text-white font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateFolder}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                                >
                                    Create Folder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
