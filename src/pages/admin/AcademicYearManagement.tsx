import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AcademicYearTable from '@/components/admin/academic-year/AcademicYearTable';
import AcademicYearModal from '@/components/admin/academic-year/AcademicYearModal';
import { academicYearApi, AcademicYear } from '@/lib/api';

const MySwal = withReactContent(Swal);

const Toast = MySwal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

export default function AcademicYearManagement() {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);

    const fetchAcademicYears = async (page = 1, search = '') => {
        setIsLoading(true);
        try {
            const params: any = { page };

            if (search) {
                params.search = search;
            }

            const response = await academicYearApi.getAcademicYears(params);

            if (response.success && response.data) {
                const result = response.data;
                setAcademicYears(result.data || []);
                setPagination({
                    currentPage: result.meta?.current_page || result.current_page || 1,
                    lastPage: result.meta?.last_page || result.last_page || 1,
                    total: result.meta?.total || result.total || 0,
                    from: result.meta?.from || result.from || 0,
                    to: result.meta?.to || result.to || 0
                });
            } else {
                setAcademicYears([]);
            }
        } catch (error) {
            console.error("Failed to fetch academic years:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== undefined) {
                fetchAcademicYears(1, searchQuery);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchAcademicYears(newPage, searchQuery);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleCreate = () => {
        setSelectedAcademicYear(null);
        setIsModalOpen(true);
    };

    const handleEdit = (academicYear: AcademicYear) => {
        setSelectedAcademicYear(academicYear);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        try {
            if (selectedAcademicYear) {
                await academicYearApi.updateAcademicYear(selectedAcademicYear.id, data);
                Toast.fire({
                    icon: 'success',
                    title: 'Academic Year updated successfully'
                });
            } else {
                await academicYearApi.createAcademicYear(data);
                Toast.fire({
                    icon: 'success',
                    title: 'Academic Year created successfully'
                });
            }
            fetchAcademicYears(pagination.currentPage, searchQuery);
        } catch (error) {
            console.error("Failed to save academic year:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to save academic year'
            });
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await academicYearApi.deleteAcademicYear(id);
                MySwal.fire(
                    'Deleted!',
                    'Academic Year has been deleted.',
                    'success'
                );
                fetchAcademicYears(pagination.currentPage, searchQuery);
            } catch (error) {
                console.error("Failed to delete academic year:", error);
                MySwal.fire(
                    'Error!',
                    'Failed to delete academic year.',
                    'error'
                );
            }
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${ids.length} academic years. This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!'
        });

        if (result.isConfirmed) {
            try {
                await academicYearApi.bulkDeleteAcademicYears(ids);
                MySwal.fire(
                    'Deleted!',
                    `${ids.length} academic years have been deleted.`,
                    'success'
                );
                fetchAcademicYears(pagination.currentPage, searchQuery);
            } catch (error) {
                console.error("Failed to delete academic years:", error);
                MySwal.fire(
                    'Error!',
                    'Failed to delete academic years.',
                    'error'
                );
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 space-y-6 max-w-7xl mx-auto"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Academic Years</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage academic years and semesters.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        New Academic Year
                    </button>
                </div>
            </div>

            <AcademicYearTable
                academicYears={academicYears}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                pagination={pagination}
                onPageChange={handlePageChange}
                onBulkDelete={handleBulkDelete}
                onSearch={handleSearch}
            />

            <AcademicYearModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                academicYear={selectedAcademicYear}
                onSave={handleSave}
            />
        </motion.div>
    );
}
