import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import ClassroomTable from '@/components/admin/classroom/ClassroomTable';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { classroomApi, Classroom } from '@/lib/api';

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

export default function ClassroomManagement() {
    const navigate = useNavigate();
    const { selectedYearId } = useAcademicYear();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0
    });

    const fetchClassrooms = async (page = 1, search?: string) => {
        setIsLoading(true);
        try {
            const query = search !== undefined ? search : searchQuery;

            const params: any = {
                page,
                sort_by: 'created_at',
                order: 'desc'
            };

            if (query) {
                params.search = query;
            }

            // Filter by Academic Year from global state
            if (selectedYearId) {
                params.academic_year_id = selectedYearId;
            }

            const response = await classroomApi.getClassrooms(params);

            if (response.success && response.data) {
                const result = response.data;
                const data = Array.isArray(result) ? result : result.data;

                setClassrooms(data || []);

                if (!Array.isArray(result)) {
                    setPagination({
                        currentPage: result.meta?.current_page || result.current_page || 1,
                        lastPage: result.meta?.last_page || result.last_page || 1,
                        total: result.meta?.total || result.total || 0,
                        from: result.meta?.from || result.from || 0,
                        to: result.meta?.to || result.to || 0
                    });
                }
            } else {
                setClassrooms([]);
            }
        } catch (error) {
            console.error("Failed to fetch classrooms:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to load classrooms'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Reload when academic year changes
    useEffect(() => {
        if (selectedYearId) {
            fetchClassrooms(1); // Reset to page 1, keep current search query
        }
    }, [selectedYearId]);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchClassrooms(1, searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchClassrooms(newPage, searchQuery);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleCreate = () => {
        navigate('/admin/classrooms/create');
    };

    const handleEdit = (classroom: Classroom) => {
        navigate(`/admin/classrooms/${classroom.id}`);
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
                await classroomApi.deleteClassroom(id);
                MySwal.fire(
                    'Deleted!',
                    'Classroom has been deleted.',
                    'success'
                );
                fetchClassrooms(pagination.currentPage, searchQuery);
            } catch (error) {
                console.error("Failed to delete classroom:", error);
                MySwal.fire(
                    'Error!',
                    'Failed to delete classroom.',
                    'error'
                );
            }
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${ids.length} classrooms. This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!'
        });

        if (result.isConfirmed) {
            try {
                await classroomApi.bulkDeleteClassrooms(ids);
                MySwal.fire(
                    'Deleted!',
                    `${ids.length} classrooms have been deleted.`,
                    'success'
                );
                fetchClassrooms(pagination.currentPage, searchQuery);
            } catch (error) {
                console.error("Failed to delete classrooms:", error);
                MySwal.fire(
                    'Error!',
                    'Failed to delete classrooms.',
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
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Classroom Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all active classes, student counts, and levels.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-white">upload_file</span>
                        Import Excel
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        New Classroom
                    </button>
                </div>
            </div>

            <ClassroomTable
                classrooms={classrooms}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                pagination={pagination}
                onPageChange={handlePageChange}
                onBulkDelete={handleBulkDelete}
                onSearch={handleSearch}
            />
        </motion.div>
    );
}
