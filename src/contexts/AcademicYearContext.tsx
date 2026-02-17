import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { academicYearApi, AcademicYear } from '@/lib/api';

interface AcademicYearContextType {
    academicYears: AcademicYear[];
    selectedYearId: string | null;
    selectedYear: AcademicYear | null;
    setSelectedYearId: (id: string) => Promise<void>;
    isLoading: boolean;
    refreshAcademicYears: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedYearId, setSelectedYearIdState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAcademicYears = async () => {
        setIsLoading(true);
        try {
            // Fetch all academic years - assuming pagination might be an issue if there are many,
            // but for a selector we typically want all active ones or a reasonable list.
            // Use a large per_page if pagination is enforced by default.
            const response = await academicYearApi.getAcademicYears({ per_page: 100 });
            if (response.success && response.data) {
                // Handle potentially paginated response structure similar to AcademicYearManagement
                const result = response.data as any;
                const years: AcademicYear[] = Array.isArray(result) ? result : (result.data || []);

                setAcademicYears(years);

                // Initialize selection
                const storedYearId = localStorage.getItem('selectedAcademicYearId');

                if (storedYearId && years.find(y => y.id === storedYearId)) {
                    setSelectedYearIdState(storedYearId);
                } else if (years.length > 0) {
                    // Default to the most recent one or active one if available
                    // For now, let's default to the first one in the list (usually latest if sorted by created_at desc)
                    const defaultYear = years[0];
                    setSelectedYearIdState(defaultYear.id);
                    localStorage.setItem('selectedAcademicYearId', defaultYear.id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch academic years for context:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
    }, []);

    const setSelectedYearId = async (id: string) => {
        // Just client side update
        setIsLoading(true);

        // Simulate a brief delay to show transition if needed, 
        // or just to allow UI to catch up before alert
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

    const selectedYear = academicYears.find(y => y.id === selectedYearId) || null;

    return (
        <AcademicYearContext.Provider value={{
            academicYears,
            selectedYearId,
            selectedYear,
            setSelectedYearId,
            isLoading,
            refreshAcademicYears: fetchAcademicYears
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
