import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import SubjectTable from '@/components/admin/subject/SubjectTable';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { subjectApi, Subject } from '@/lib/api';

const MySwal = withReactContent(Swal);


export default function SubjectManagement() {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { selectedYearId } = useAcademicYear();

    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0
    });

    const fetchSubjects = async (page = 1, search = '') => {
        setIsLoading(true);
        try {
            const params: any = { page };

            if (search) {
                params.search = search;
            }

            if (selectedYearId) {
                params.academic_year_id = selectedYearId;
            }

            const response = await subjectApi.getSubjects(params);

            if (response.success && response.data) {
                const result = response.data;
                setSubjects(result.data || []);
                setPagination({
                    currentPage: result.meta?.current_page || result.current_page || 1,
                    lastPage: result.meta?.last_page || result.last_page || 1,
                    total: result.meta?.total || result.total || 0,
                    from: result.meta?.from || result.from || 0,
                    to: result.meta?.to || result.to || 0
                });
            } else {
                setSubjects([]);
            }
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects(1, searchQuery);
    }, [selectedYearId]);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== undefined) {
                fetchSubjects(1, searchQuery);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchSubjects(newPage, searchQuery);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleCreate = () => {
        navigate('/admin/subjects/create');
    };

    const handleEdit = (subject: Subject) => {
        navigate(`/admin/subjects/${subject.id}`);
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
                await subjectApi.deleteSubject(id);
                MySwal.fire(
                    'Deleted!',
                    'Subject has been deleted.',
                    'success'
                );
                fetchSubjects(pagination.currentPage, searchQuery);
            } catch (error) {
                console.error("Failed to delete subject:", error);
                MySwal.fire(
                    'Error!',
                    'Failed to delete subject.',
                    'error'
                );
            }
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${ids.length} subjects. This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!'
        });

        if (result.isConfirmed) {
            try {
                await subjectApi.bulkDeleteSubjects(ids);
                MySwal.fire(
                    'Deleted!',
                    `${ids.length} subjects have been deleted.`,
                    'success'
                );
                fetchSubjects(pagination.currentPage, searchQuery);
            } catch (error) {
                console.error("Failed to delete subjects:", error);
                MySwal.fire(
                    'Error!',
                    'Failed to delete subjects.',
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
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Subject Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage subjects, assignments, and curriculum.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        New Subject
                    </button>
                </div>
            </div>

            <SubjectTable
                subjects={subjects}
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
