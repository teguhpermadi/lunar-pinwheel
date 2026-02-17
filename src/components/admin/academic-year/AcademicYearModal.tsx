import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/ui/modal';
import { AcademicYear, teacherApi, Teacher } from '@/lib/api';
import { useEffect, useState } from 'react';

const academicYearSchema = z.object({
    year: z.string().min(4, "Year is required (e.g. 2023/2024)"),
    semester: z.string().min(1, "Semester is required"),
    user_id: z.string().min(1, "Headmaster (Teacher) is required"),
});

type AcademicYearFormData = z.infer<typeof academicYearSchema>;

interface AcademicYearModalProps {
    isOpen: boolean;
    onClose: () => void;
    academicYear?: AcademicYear | null;
    onSave: (data: AcademicYearFormData) => Promise<void>;
}

export default function AcademicYearModal({ isOpen, onClose, academicYear, onSave }: AcademicYearModalProps) {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setError,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<AcademicYearFormData>({
        resolver: zodResolver(academicYearSchema),
        defaultValues: {
            year: '',
            semester: '1',
            user_id: '',
        },
    });

    // Fetch dropdown data when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchDropdownData();
        }
    }, [isOpen]);

    const fetchDropdownData = async () => {
        setIsLoadingData(true);
        try {
            const teachersRes = await teacherApi.getTeachers({ per_page: 100 });
            if (teachersRes.success && teachersRes.data) {
                setTeachers(teachersRes.data.data || teachersRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch teachers:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Reset form when modal opens or academicYear changes
    useEffect(() => {
        if (isOpen) {
            if (academicYear) {
                // Fallback: If user_id is missing, try to get it from the user object
                const userId = academicYear.user_id
                    ? String(academicYear.user_id)
                    : (academicYear.user && academicYear.user.id)
                        ? String(academicYear.user.id)
                        : '';

                reset({
                    year: academicYear.year,
                    semester: academicYear.semester,
                    user_id: userId,
                });
            } else {
                reset({
                    year: '',
                    semester: '1',
                    user_id: '',
                });
            }
        }
    }, [isOpen, academicYear, reset]);

    // Ensure user_id is set correctly when teachers are loaded
    useEffect(() => {
        if (isOpen && academicYear && teachers.length > 0) {
            // Fallback: If user_id is missing, try to get it from the user object
            const targetId = academicYear.user_id
                ? String(academicYear.user_id)
                : (academicYear.user && academicYear.user.id)
                    ? String(academicYear.user.id)
                    : '';

            // Verify if the ID exists in the loaded teachers
            const teacherExists = teachers.some(t => String(t.id) === targetId);
            if (teacherExists) {
                setValue('user_id', targetId);
            }
        }
    }, [teachers, isOpen, academicYear, setValue]);

    const onSubmit = async (data: AcademicYearFormData) => {
        try {
            await onSave(data);
            onClose();
        } catch (error: any) {
            console.error("Submission failed", error);
            if (error.response?.data?.errors) {
                Object.keys(error.response.data.errors).forEach((key) => {
                    const fieldName = key as keyof AcademicYearFormData;
                    setError(fieldName, {
                        type: 'server',
                        message: error.response.data.errors[key][0]
                    });
                });
            } else {
                setError('root', {
                    type: 'server',
                    message: error.response?.data?.message || 'An error occurred. Please try again.'
                });
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={academicYear ? "Edit Academic Year" : "Add Academic Year"}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && (
                    <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-200">
                        {errors.root.message}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year *</label>
                    <input
                        {...register('year')}
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g. 2023/2024"
                    />
                    {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester *</label>
                    <select
                        {...register('semester')}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                        <option value="1">Ganjil</option>
                        <option value="2">Genap</option>
                    </select>
                    {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Headmaster *</label>
                    <select
                        {...register('user_id')}
                        disabled={isLoadingData}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                    >
                        <option value="">Select Headmaster</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={String(teacher.id)}>
                                {teacher.name}
                            </option>
                        ))}
                    </select>
                    {isLoadingData && <p className="text-xs text-slate-500 mt-1">Loading teachers...</p>}
                    {errors.user_id && <p className="text-red-500 text-xs mt-1">{errors.user_id.message}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isLoadingData}
                        className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Academic Year'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
