import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import icons from "@/utils/icons";
import { toast } from "react-toastify";

interface Folder {
    id: string;
    name: string;
    color: string;
    journalCount: number;
    createdAt: string;
}

export default function Folders() {
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [selectedColor, setSelectedColor] = useState("#1e40af");
    const [folders, setFolders] = useState<Folder[]>([
        {
            id: "1",
            name: "Training Notes",
            color: "#1e40af",
            journalCount: 5,
            createdAt: "2025-01-15"
        },
        {
            id: "2",
            name: "Match Analysis",
            color: "#059669",
            journalCount: 3,
            createdAt: "2025-01-10"
        },
        {
            id: "3",
            name: "Personal Goals",
            color: "#ea580c",
            journalCount: 2,
            createdAt: "2025-01-08"
        },
        {
            id: "4",
            name: "Tournament Prep",
            color: "#7c3aed",
            journalCount: 4,
            createdAt: "2025-01-05"
        },
        {
            id: "5",
            name: "Mental Game",
            color: "#be185d",
            journalCount: 1,
            createdAt: "2025-01-03"
        }
    ]);

    const colorOptions = [
        "#1e40af", "#059669", "#ea580c", "#7c3aed", "#be185d",
        "#d97706", "#0d9488", "#f97316", "#10b981", "#8b5cf6",
        "#f59e0b", "#06b6d4", "#84cc16", "#f43f5e", "#6366f1"
    ];

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) {
            toast.error("Please enter a folder name");
            return;
        }

        const newFolder: Folder = {
            id: Date.now().toString(),
            name: newFolderName.trim(),
            color: selectedColor,
            journalCount: 0,
            createdAt: new Date().toISOString().split('T')[0]
        };

        setFolders(prev => [newFolder, ...prev]);
        setNewFolderName("");
        setSelectedColor("#1e40af");
        setShowCreateModal(false);
        toast.success("Folder created successfully!");
    };

    const handleFolderClick = (folderId: string) => {
        navigate(`/admin/journals/folder/${folderId}`);
    };

    const handleDeleteFolder = (folderId: string) => {
        if (folders.find(f => f.id === folderId)?.journalCount > 0) {
            toast.error("Cannot delete folder with journals. Move or delete journals first.");
            return;
        }

        setFolders(prev => prev.filter(f => f.id !== folderId));
        toast.success("Folder deleted successfully!");
    };

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
                    <h1 className="text-2xl font-bold text-gray-800">Folders</h1>
                </div>
                <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2"
                >
                    New Folder
                </Button>
            </div>

            {/* Folders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {folders.map((folder) => (
                    <div
                        key={folder.id}
                        className="relative p-6 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                        style={{ backgroundColor: folder.color }}
                        onClick={() => handleFolderClick(folder.id)}
                    >
                        {/* Folder Icon */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span className="text-white text-2xl">📁</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFolder(folder.id, folder.name);
                                }}
                                className="text-white opacity-70 hover:opacity-100 transition-opacity"
                                title="Delete folder"
                            >
                                🗑️
                            </button>
                        </div>

                        {/* Folder Info */}
                        <div className="text-white">
                            <h3 className="font-bold text-lg mb-2">{folder.name}</h3>
                            <p className="text-sm opacity-90 mb-2">
                                {folder.journalCount} {folder.journalCount === 1 ? 'journal' : 'journals'}
                            </p>
                            <p className="text-xs opacity-75">
                                Created {folder.createdAt}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Folder Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Create New Folder</h2>
                                <button 
                                    onClick={() => setShowCreateModal(false)} 
                                    className="text-gray-400 hover:text-gray-600 p-2"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Folder Name
                                </label>
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Enter folder name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                    autoFocus
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Folder Color
                                </label>
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
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
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
