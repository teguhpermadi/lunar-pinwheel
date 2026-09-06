import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { academicYearApi, AcademicYear } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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
    const { user, token } = useAuth();
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedYearId, setSelectedYearIdState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
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
                    } else if (newYears.length > 0) {
                        setSelectedYearIdState(prev => {
                            if (!prev) {
                                // Prefer the server-designated active year, fall back to first item
                                const defaultYear = newYears.find(y => y.is_active) || newYears[0];
                                localStorage.setItem('selectedAcademicYearId', defaultYear.id);
                                return defaultYear.id;
                            }
                            return prev;
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch academic years for context:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []); // Removed selectedYearId to avoid continuous re-fetching

    useEffect(() => {
        if (token && (user?.role === 'admin' || user?.role === 'teacher')) {
            fetchAcademicYears(1, true);
        }
    }, [fetchAcademicYears, token, user?.role]);

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
        setIsLoading(true);
        try {
            // Persist the active year on the server (single source of truth).
            const response = await academicYearApi.setActive(id);

            if (!response?.success) {
                throw new Error(response?.message || 'Gagal mengubah tahun akademik aktif');
            }

            setSelectedYearIdState(id);
            localStorage.setItem('selectedAcademicYearId', id);

            const Swal = (await import('sweetalert2')).default;
            Swal.fire({
                icon: 'success',
                title: 'Academic Year Updated',
                text: 'Tahun akademik aktif berhasil diubah.',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            console.error('Failed to set active academic year:', error);
            const Swal = (await import('sweetalert2')).default;
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Tahun akademik aktif gagal diubah. Silakan coba lagi.',
                timer: 2500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } finally {
            setIsLoading(false);
        }
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
