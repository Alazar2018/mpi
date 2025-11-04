import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface CarouselProps {
    children: (item: any) => React.ReactElement;
    items: any[];
    className?: string;
}

export function Carousel({ children, items, className = "" }: CarouselProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'xl'>('desktop');

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setScreenSize('mobile');
            } else if (width < 1024) {
                setScreenSize('tablet');
            } else if (width < 1536) {
                setScreenSize('desktop');
            } else {
                setScreenSize('xl');
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const itemsPerPage = screenSize === 'mobile' ? 1 : screenSize === 'tablet' ? 2 : 3;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);
    
    const isMobile = screenSize === 'mobile';
    const isTablet = screenSize === 'tablet';

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
            <div className="flex overflow-hidden">
                {currentItems.map((item, index) => (
                    <div key={startIndex + index} className={`${isMobile ? 'w-full' : isTablet ? 'w-1/2' : 'w-1/3'} flex-shrink-0 ${!isMobile && index > 0 ? 'ml-4' : ''}`}>
                        {children(item)}
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <>
                    <button
                        onClick={prev}
                        disabled={currentPage === 0}
                        className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] dark:bg-gray-600 p-1.5 sm:p-2 rounded-full shadow-md hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-primary)] dark:text-white" />
                    </button>
                    <button
                        onClick={next}
                        disabled={currentPage >= totalPages - 1}
                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] dark:bg-gray-600 p-1.5 sm:p-2 rounded-full shadow-md hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-primary)] dark:text-white" />
                    </button>
                    
                    {/* Carousel Indicators */}
                    <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => goToPage(index)}
                                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 hover:scale-125 ${
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