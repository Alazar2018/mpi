// src/components/Dialog.tsx
import { useState } from 'react';

interface DialogButton {
    text: string;
    variant: 'outlined' | 'contained';
    onClick: () => void;
}

interface DialogConfig {
    title: string;
    message: string;
    buttons: DialogButton[];
}

export const useDialog = () => {
    const [dialog, setDialog] = useState<{
        isOpen: boolean;
        config: DialogConfig | null;
    }>({
        isOpen: false,
        config: null,
    });

    const showDialog = (config: DialogConfig) => {
        setDialog({
            isOpen: true,
            config,
        });
    };

    const Dialog = () => {
        if (!dialog.isOpen || !dialog.config) return null;

        return (
            <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-sm w-full">
                    <h3 className="text-lg font-bold">{dialog.config.title}</h3>
                    <p className="my-4">{dialog.config.message}</p>
                    <div className="flex justify-end gap-2">
                        {dialog.config.buttons.map((button, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    button.onClick();
                                    setDialog({ isOpen: false, config: null });
                                }}
                                className={`px-4 py-2 rounded ${
                                    button.variant === 'contained'
                                        ? 'bg-red-500 text-white'
                                        : 'border border-gray-300'
                                }`}
                            >
                                {button.text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return { showDialog, Dialog };
};