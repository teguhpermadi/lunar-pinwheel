import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate, useParams } from 'react-router-dom';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { classroomApi, studentApi, Student, Classroom } from '@/lib/api';

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

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function ClassroomForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { selectedYearId } = useAcademicYear();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Classroom Form Data
    const [formData, setFormData] = useState<Partial<Classroom>>({
        name: '',
        level: 'Intermediate', // Default from HTML
        capacity: 32 // Default or from API
    });

    // Student Assignment State
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
    const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
    const [selectedAssigned, setSelectedAssigned] = useState<string[]>([]);

    // Search State
    const [availableSearch, setAvailableSearch] = useState('');
    const [assignedSearch, setAssignedSearch] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        if (isEditing && id) {
            fetchClassroomData(id);
        }
        // fetchAvailableStudents is now triggered by availableSearch effect
    }, [id, isEditing, selectedYearId]);

    const fetchClassroomData = async (classroomId: string) => {
        setLoading(true);
        try {
            const response = await classroomApi.getClassroom(classroomId);
            if (response.success && response.data) {
                const classroom = response.data;
                const data = Array.isArray(classroom) ? classroom[0] : classroom;
                setFormData({
                    name: data.name,
                    level: data.level,
                    capacity: data.capacity,
                    academic_year_id: data.academic_year?.id // Capture the classroom's academic year
                });

                if (data.students) {
                    setAssignedStudents(data.students);
                }
            }
        } catch (error) {
            console.error("Failed to load classroom:", error);
            Toast.fire({ icon: 'error', title: 'Failed to load classroom data' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableStudents = async (reset = false) => {
        const targetYearId = isEditing ? formData.academic_year_id : selectedYearId;
        if (!targetYearId && !selectedYearId) return;

        try {
            const currentPage = reset ? 1 : page;
            if (!reset) setIsLoadingMore(true);

            const response = await classroomApi.getAvailableStudents({
                academic_year_id: targetYearId || selectedYearId,
                search: availableSearch,
                page: currentPage,
                per_page: 15 // Adjust batch size as needed
            });

            if (response.success && response.data) {
                const responseData = response.data;
                const newStudents = Array.isArray(responseData) ? responseData : (responseData.data || []);
                const meta = responseData.meta || {};

                setAvailableStudents(prev => {
                    const combined = reset ? newStudents : [...prev, ...newStudents];
                    // Remove duplicates just in case
                    return Array.from(new Map(combined.map(s => [s.id, s])).values());
                });

                setHasMore(newStudents.length > 0 && currentPage < (meta.last_page || 999));
                setPage(currentPage + 1);
            }
        } catch (error) {
            console.error("Failed to load available students:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedYearId) fetchAvailableStudents(true);
        }, 500);
        return () => clearTimeout(timer);
    }, [availableSearch]);

    // Handle Infinite Scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingMore && !loading) {
            fetchAvailableStudents();
        }
    };

    const handleGenerateStudents = async () => {
        if (!isEditing || !id) return;

        // Use classroom's year if available, fallback to global context
        const syncYearId = formData.academic_year_id || selectedYearId;

        if (!syncYearId) {
            Toast.fire({ icon: 'error', title: 'Missing Academic Year' });
            return;
        }

        try {
            // Logic to move selected available to assigned
            const studentsToAdd = availableStudents.filter(s => selectedAvailable.includes(s.id));

            // Calculate new assigned state for API payload
            const newAssigned = [...assignedStudents, ...studentsToAdd];
            const newAssignedIds = newAssigned.map(s => s.id);

            // API Call with FULL list for sync
            await classroomApi.syncStudents(id, newAssignedIds, syncYearId);

            Toast.fire({ icon: 'success', title: 'Students assigned successfully' });
            setSelectedAvailable([]);

            // Reload data to ensure consistency and avoid duplicates
            await fetchClassroomData(id);
            // We should reload available students too, potentially
            if (selectedYearId) await fetchAvailableStudents();
        } catch (error) {
            console.error("Failed to assign students:", error);
            Toast.fire({ icon: 'error', title: 'Failed to assign students' });
        }
    };

    const handleRemoveStudents = async () => {
        if (!isEditing || !id) return;

        // Use classroom's year if available, fallback to global context
        const syncYearId = formData.academic_year_id || selectedYearId;

        if (!syncYearId) {
            Toast.fire({ icon: 'error', title: 'Missing Academic Year' });
            return;
        }

        try {
            // Calculate new assigned state for API payload
            const newAssigned = assignedStudents.filter(s => !selectedAssigned.includes(s.id));
            const newAssignedIds = newAssigned.map(s => s.id);

            // API Call with FULL list for sync
            await classroomApi.syncStudents(id, newAssignedIds, syncYearId);

            Toast.fire({ icon: 'success', title: 'Students removed successfully' });
            setSelectedAssigned([]);

            // Reload data
            await fetchClassroomData(id);
            if (selectedYearId) await fetchAvailableStudents();
        } catch (error) {
            console.error("Failed to remove students:", error);
            Toast.fire({ icon: 'error', title: 'Failed to remove students' });
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (isEditing && id) {
                await classroomApi.updateClassroom(id, formData);
                Toast.fire({ icon: 'success', title: 'Classroom updated' });
            } else {
                if (!selectedYearId) {
                    Toast.fire({ icon: 'error', title: 'Please select an Academic Year first' });
                    return;
                }
                const payload = { ...formData, academic_year_id: selectedYearId };
                const res = await classroomApi.createClassroom(payload);
                if (res.success && res.data) {
                    Toast.fire({ icon: 'success', title: 'Classroom created' });
                    // Navigate to edit page to allow student assignment immediately? 
                    // Or just back to list. Let's go to list for simple flow, or edit to assign.
                    // Design implies unified page.
                    navigate(`/admin/classrooms/${res.data.id}`);
                }
            }
        } catch (error) {
            console.error("Failed to save classroom:", error);
            Toast.fire({ icon: 'error', title: 'Failed to save classroom' });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleAvailableSort = (studentId: string) => {
        setSelectedAvailable(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const toggleAssignedSort = (studentId: string) => {
        setSelectedAssigned(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    // Filtered lists
    // We only filter out assigned students from the server results to be safe, 
    // but the server search handles the text search now.
    const filteredAvailable = availableStudents.filter(s => !assignedStudents.some(assigned => assigned.id === s.id));

    const filteredAssigned = assignedStudents.filter(s =>
        s.name.toLowerCase().includes(assignedSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(assignedSearch.toLowerCase())
    );

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="p-8 space-y-8 max-w-7xl mx-auto"
        >
            {/* Headers and Details Section (unchanged) */}
            <motion.div variants={itemVariants} className="flex items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {isEditing ? 'Edit Classroom' : 'New Classroom'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Modify classroom details and manage student assignments.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/classrooms')}
                        className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || loading}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
                    >
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">info</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Classroom Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nama (Name)</label>
                        {loading ? (
                            <Skeleton className="h-12 w-full rounded-xl" />
                        ) : (
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200 font-medium"
                            />
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Level</label>
                        {loading ? (
                            <Skeleton className="h-12 w-full rounded-xl" />
                        ) : (
                            <select
                                value={formData.level || 'Intermediate'}
                                onChange={e => setFormData({ ...formData, level: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200 font-medium"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Jumlah Siswa (Total)</label>
                        {loading ? (
                            <Skeleton className="h-12 w-full rounded-xl" />
                        ) : (
                            <input
                                type="number"
                                value={isEditing ? assignedStudents.length : 0}
                                disabled
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200 font-medium opacity-60"
                            />
                        )}
                    </div>
                </div>
            </motion.div>

            {isEditing && (
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                    {/* Header for assignment */}
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined">person_add</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Assign Students</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
                        {/* Available Students Column */}
                        <div className="flex flex-col border-r border-slate-100 dark:border-slate-800">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Students</h4>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                                        {/* Total count might not be accurate if paginated, maybe show loaded count? or nothing */}
                                        {loading ? <Skeleton className="h-4 w-10 inline-block" /> : 'Select to Add'}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                        <span className="material-symbols-outlined text-lg">search</span>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search available students..."
                                        value={availableSearch}
                                        onChange={e => setAvailableSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleGenerateStudents}
                                    disabled={selectedAvailable.length === 0 || loading}
                                    className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Add Selected Students ({selectedAvailable.length})
                                </button>
                            </div>

                            <div
                                className="flex-1 overflow-y-auto p-6 pt-0 space-y-2 student-list max-h-[500px]"
                                onScroll={handleScroll}
                            >
                                {loading && availableStudents.length === 0 ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex items-center gap-3 p-3">
                                                <Skeleton className="size-9 rounded-full" />
                                                <div className="space-y-2 flex-1">
                                                    <Skeleton className="h-4 w-1/2" />
                                                    <Skeleton className="h-3 w-1/3" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <AnimatePresence mode='popLayout'>
                                            {filteredAvailable.map(student => (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    key={student.id}
                                                    onClick={() => toggleAvailableSort(student.id)}
                                                    className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedAvailable.includes(student.id) ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAvailable.includes(student.id)}
                                                            readOnly
                                                            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary dark:bg-slate-700 pointer-events-none"
                                                        />
                                                        <div className="size-9 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="size-full flex items-center justify-center text-slate-400 bg-slate-200 dark:bg-slate-700">
                                                                <span className="material-symbols-outlined text-lg">person</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{student.name}</span>
                                                            <span className="text-xs text-slate-400">{student.username || student.email}</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {isLoadingMore && (
                                            <div className="py-4 text-center">
                                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                                            </div>
                                        )}
                                        {!hasMore && filteredAvailable.length > 0 && (
                                            <div className="py-4 text-center text-xs text-slate-400">
                                                No more students
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Assigned Students Column */}
                        <div className="flex flex-col bg-slate-50/20 dark:bg-slate-800/10">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-primary uppercase tracking-widest">Assigned Students</h4>
                                    <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-bold">{loading ? <Skeleton className="h-4 w-10 inline-block" /> : `${filteredAssigned.length} Students`}</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                        <span className="material-symbols-outlined text-lg">search</span>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search assigned students..."
                                        value={assignedSearch}
                                        onChange={e => setAssignedSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleRemoveStudents}
                                    disabled={selectedAssigned.length === 0 || loading}
                                    className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-lg">person_remove</span>
                                    Remove Selected Students ({selectedAssigned.length})
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-2 student-list max-h-[500px]">
                                {loading && assignedStudents.length === 0 ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex items-center gap-3 p-3">
                                                <Skeleton className="size-9 rounded-full" />
                                                <div className="space-y-2 flex-1">
                                                    <Skeleton className="h-4 w-1/2" />
                                                    <Skeleton className="h-3 w-1/3" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <AnimatePresence mode='popLayout'>
                                        {filteredAssigned.map(student => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                key={student.id}
                                                onClick={() => toggleAssignedSort(student.id)}
                                                className={`group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border shadow-sm cursor-pointer transition-all ${selectedAssigned.includes(student.id) ? 'border-red-500 ring-1 ring-red-500' : 'border-primary/20'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAssigned.includes(student.id)}
                                                        readOnly
                                                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-red-500 focus:ring-red-500 dark:bg-slate-700 pointer-events-none"
                                                    />
                                                    <div className="size-9 bg-primary/10 rounded-full overflow-hidden">
                                                        <div className="size-full flex items-center justify-center text-primary bg-primary/5">
                                                            <span className="material-symbols-outlined text-lg">person</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{student.name}</span>
                                                        <span className="text-xs text-slate-400">{student.username || student.email}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
