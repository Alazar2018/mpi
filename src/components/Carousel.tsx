import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface CarouselProps {
    children: (item: any) => React.ReactElement;
    items: any[];
    className?: string;
}

export function Carousel({ children, items, className = "" }: CarouselProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const itemsPerPage = isMobile ? 1 : 3;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    const next = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prev = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    if (items.length === 0) return null;

    return (
        <div className={`relative ${className}`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {currentItems.map((item, index) => (
                    <div key={startIndex + index} className="w-full bg-[var(--bg-secondary)] dark:bg-gray-700 p-3 rounded-lg">
                        {children(item)}
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <>
                    <button
                        onClick={prev}
                        disabled={currentPage === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] dark:bg-gray-600 p-2 rounded-full shadow-md hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                    >
                        <ChevronLeft className="w-5 h-5 text-[var(--text-primary)] dark:text-white" />
                    </button>
                    <button
                        onClick={next}
                        disabled={currentPage >= totalPages - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] dark:bg-gray-600 p-2 rounded-full shadow-md hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                    >
                        <ChevronRight className="w-5 h-5 text-[var(--text-primary)] dark:text-white" />
                    </button>
                    
                    {/* Carousel Indicators */}
                    <div className="flex justify-center items-center gap-2 mt-4">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => goToPage(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    index === currentPage
                                        ? 'bg-blue-600 scale-110'
                                        : 'bg-[var(--bg-tertiary)] dark:bg-gray-500 hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-400'
                                }`}
                                aria-label={`Go to page ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}