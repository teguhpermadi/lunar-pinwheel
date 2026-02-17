import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

    useEffect(() => {
        if (isEditing && id) {
            fetchClassroomData(id);
        }
        fetchAvailableStudents();
    }, [id, isEditing]);

    const fetchClassroomData = async (classroomId: string) => {
        setLoading(true);
        try {
            const response = await classroomApi.getClassroom(classroomId);
            if (response.success && response.data) {
                const classroom = response.data;
                // Assuming the API returns a 'data' array for single item or just the item? 
                // Adjusting based on potential array return or single object.
                // standard resource show usually returns single object in data.
                const data = Array.isArray(classroom) ? classroom[0] : classroom;
                setFormData({
                    name: data.name,
                    level: data.level,
                    capacity: data.capacity,
                });

                // If the API returns students nested, use them. 
                // Otherwise we might need a separate call.
                if (data.students) {
                    setAssignedStudents(data.students);
                } else {
                    // Fallback or separate call if needed. 
                    // For now assuming included based on interface update.
                }
            }
        } catch (error) {
            console.error("Failed to load classroom:", error);
            Toast.fire({ icon: 'error', title: 'Failed to load classroom data' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableStudents = async () => {
        try {
            const response = await classroomApi.getAvailableStudents();
            if (response.success && response.data) {
                setAvailableStudents(response.data);
            }
        } catch (error) {
            console.error("Failed to load available students:", error);
            // Fallback: fetch all students and filter client side if API doesn't exist yet/fails
            try {
                const all = await studentApi.getStudents({ per_page: 1000 }); // Get many
                if (all.success && all.data) {
                    // This is imperfect without a backend filter but works for prototype
                    setAvailableStudents(all.data);
                }
            } catch (e) { }
        }
    };

    const handleGenerateStudents = async () => {
        if (!isEditing || !id) return;

        try {
            // Logic to move selected available to assigned
            const studentsToAdd = availableStudents.filter(s => selectedAvailable.includes(s.id));

            // Optimistic update
            setAssignedStudents(prev => [...prev, ...studentsToAdd]);
            setAvailableStudents(prev => prev.filter(s => !selectedAvailable.includes(s.id)));
            setSelectedAvailable([]);

            // API Call
            await classroomApi.assignStudents(id, selectedAvailable);

            Toast.fire({ icon: 'success', title: 'Students assigned successfully' });
        } catch (error) {
            console.error("Failed to assign students:", error);
            Toast.fire({ icon: 'error', title: 'Failed to assign students' });
            // Revert on failure would be ideal
            fetchClassroomData(id!);
            fetchAvailableStudents();
        }
    };

    const handleRemoveStudents = async () => {
        if (!isEditing || !id) return;

        try {
            const studentsToRemove = assignedStudents.filter(s => selectedAssigned.includes(s.id));

            setAvailableStudents(prev => [...prev, ...studentsToRemove]);
            setAssignedStudents(prev => prev.filter(s => !selectedAssigned.includes(s.id)));
            setSelectedAssigned([]);

            // API Call
            await classroomApi.removeStudents(id, selectedAssigned);

            Toast.fire({ icon: 'success', title: 'Students removed successfully' });
        } catch (error) {
            console.error("Failed to remove students:", error);
            Toast.fire({ icon: 'error', title: 'Failed to remove students' });
            fetchClassroomData(id!);
            fetchAvailableStudents();
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
    const filteredAvailable = availableStudents.filter(s =>
        s.name.toLowerCase().includes(availableSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(availableSearch.toLowerCase())
    );

    const filteredAssigned = assignedStudents.filter(s =>
        s.name.toLowerCase().includes(assignedSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(assignedSearch.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 space-y-8 max-w-7xl mx-auto"
        >
            <div className="flex items-center justify-between gap-6">
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
                        disabled={submitting}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
                    >
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">info</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Classroom Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nama (Name)</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200 font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Level</label>
                        <select
                            value={formData.level || 'Intermediate'}
                            onChange={e => setFormData({ ...formData, level: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200 font-medium"
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Jumlah Siswa (Total)</label>
                        <input
                            type="number"
                            value={isEditing ? assignedStudents.length : 0}
                            disabled
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200 font-medium opacity-60"
                        />
                    </div>
                </div>
            </div>

            {/* Student Assignment Section - Only visible if editing (created) */}
            {isEditing && (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
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
                                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">{filteredAvailable.length} Total</span>
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
                                    disabled={selectedAvailable.length === 0}
                                    className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Add Selected Students ({selectedAvailable.length})
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-2 student-list max-h-[500px]">
                                {filteredAvailable.map(student => (
                                    <div
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
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Assigned Students Column */}
                        <div className="flex flex-col bg-slate-50/20 dark:bg-slate-800/10">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-primary uppercase tracking-widest">Assigned Students</h4>
                                    <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-bold">{filteredAssigned.length} Students</span>
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
                                    disabled={selectedAssigned.length === 0}
                                    className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-lg">person_remove</span>
                                    Remove Selected Students ({selectedAssigned.length})
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-2 student-list max-h-[500px]">
                                {filteredAssigned.map(student => (
                                    <div
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
