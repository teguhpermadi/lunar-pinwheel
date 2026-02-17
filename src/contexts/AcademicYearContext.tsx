import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { academicYearApi, AcademicYear } from '@/lib/api';

interface AcademicYearContextType {
    academicYears: AcademicYear[];
    selectedYearId: string | null;
    selectedYear: AcademicYear | null;
    setSelectedYearId: (id: string) => Promise<void>;
    isLoading: boolean;
    refreshAcademicYears: () => Promise<void>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedYearId, setSelectedYearIdState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchAcademicYears = useCallback(async (pageNum: number, isRefresh = false) => {
        if (isRefresh) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const response = await academicYearApi.getAcademicYears({
                page: pageNum,
                per_page: 10, // Adjust batch size as needed
                sort_by: 'created_at',
                order: 'desc'
            });

            if (response.success && response.data) {
                const result = response.data as any;
                // Handle both paginated and non-paginated structures safely
                const newYears: AcademicYear[] = Array.isArray(result) ? result : (result.data || []);
                const meta = result.meta || {};

                setAcademicYears(prev => {
                    if (isRefresh) return newYears;
                    // Filter duplicates
                    const existingIds = new Set(prev.map(y => y.id));
                    const uniqueNewYears = newYears.filter(y => !existingIds.has(y.id));
                    return [...prev, ...uniqueNewYears];
                });

                // Update pagination state
                const lastPage = meta.last_page || 1;
                setHasMore(pageNum < lastPage);
                setPage(pageNum);

                // Initial Selection Logic (Only runs on first load/refresh)
                if (isRefresh) {
                    const storedYearId = localStorage.getItem('selectedAcademicYearId');
                    if (storedYearId && newYears.find(y => y.id === storedYearId)) {
                        setSelectedYearIdState(storedYearId);
                    } else if (newYears.length > 0 && !selectedYearId) {
                        const defaultYear = newYears[0];
                        setSelectedYearIdState(defaultYear.id);
                        localStorage.setItem('selectedAcademicYearId', defaultYear.id);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch academic years for context:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [selectedYearId]);

    useEffect(() => {
        fetchAcademicYears(1, true);
    }, [fetchAcademicYears]);

    const loadMore = async () => {
        if (!isLoadingMore && hasMore) {
            await fetchAcademicYears(page + 1, false);
        }
    };

    const refreshAcademicYears = async () => {
        setPage(1);
        setHasMore(true);
        await fetchAcademicYears(1, true);
    };

    const setSelectedYearId = async (id: string) => {
        // Just client side update
        setIsLoading(true);

        // Simulate a brief delay to show transition if needed
        await new Promise(resolve => setTimeout(resolve, 300));

        setSelectedYearIdState(id);
        localStorage.setItem('selectedAcademicYearId', id);

        // Show success alert
        const Swal = (await import('sweetalert2')).default;
        Swal.fire({
            icon: 'success',
            title: 'Academic Year Updated',
            text: 'Active academic year changed locally.',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });

        setIsLoading(false);
    };

    // Ensure selected year is available even if not in current page (optional: fetch specific if missing)
    // For now, we rely on the list. If the user has a selected ID that isn't loaded, 
    // it effectively acts as "Select Year" until they find it or we load it. 
    // Ideally we'd fetch the specific selected year if missing, but let's keep it simple for now.
    const selectedYear = academicYears.find(y => y.id === selectedYearId) || null;

    return (
        <AcademicYearContext.Provider value={{
            academicYears,
            selectedYearId,
            selectedYear,
            setSelectedYearId,
            isLoading,
            refreshAcademicYears,
            loadMore,
            hasMore
        }}>
            {children}
        </AcademicYearContext.Provider>
    );
}

export function useAcademicYear() {
    const context = useContext(AcademicYearContext);
    if (context === undefined) {
        throw new Error('useAcademicYear must be used within an AcademicYearProvider');
    }
    return context;
}
