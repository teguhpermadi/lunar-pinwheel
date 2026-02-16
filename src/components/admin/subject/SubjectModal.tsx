import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/ui/modal';
import { Subject, teacherApi, academicYearApi, classroomApi, Teacher, AcademicYear, Classroom } from '@/lib/api';
import { useEffect, useState } from 'react';

const subjectSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Code must be at least 2 characters"),
    description: z.string().optional(),
    color: z.string().optional(),
    class_name: z.string().optional(),
    user_id: z.number().min(1, "Teacher is required"),
    academic_year_id: z.number().min(1, "Academic year is required"),
    classroom_id: z.number().min(1, "Classroom is required"),
    image_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    logo_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface SubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    subject?: Subject | null;
    onSave: (data: SubjectFormData) => Promise<void>;
}

export default function SubjectModal({ isOpen, onClose, subject, onSave }: SubjectModalProps) {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SubjectFormData>({
        resolver: zodResolver(subjectSchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
            color: '#6366f1',
            class_name: '',
            user_id: 0,
            academic_year_id: 0,
            classroom_id: 0,
            image_url: '',
            logo_url: '',
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
            const [teachersRes, academicYearsRes, classroomsRes] = await Promise.all([
                teacherApi.getTeachers({ per_page: 100 }),
                academicYearApi.getAcademicYears({ per_page: 100 }),
                classroomApi.getClassrooms({ per_page: 100 })
            ]);

            if (teachersRes.success && teachersRes.data) {
                setTeachers(teachersRes.data.data || teachersRes.data);
            }
            if (academicYearsRes.success && academicYearsRes.data) {
                setAcademicYears(academicYearsRes.data.data || academicYearsRes.data);
            }
            if (classroomsRes.success && classroomsRes.data) {
                setClassrooms(classroomsRes.data.data || classroomsRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch dropdown data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (subject) {
            reset({
                name: subject.name,
                code: subject.code,
                description: subject.description || '',
                color: subject.color || '#6366f1',
                class_name: subject.class_name || '',
                user_id: subject.user_id,
                academic_year_id: subject.academic_year_id,
                classroom_id: subject.classroom_id,
                image_url: subject.image_url || '',
                logo_url: subject.logo_url || '',
            });
        } else {
            reset({
                name: '',
                code: '',
                description: '',
                color: '#6366f1',
                class_name: '',
                user_id: 0,
                academic_year_id: 0,
                classroom_id: 0,
                image_url: '',
                logo_url: '',
            });
        }
    }, [subject, isOpen, reset]);

    const onSubmit = async (data: SubjectFormData) => {
        // Clean up empty URLs
        const cleanedData = {
            ...data,
            image_url: data.image_url || undefined,
            logo_url: data.logo_url || undefined,
        };

        try {
            await onSave(cleanedData as SubjectFormData);
            onClose();
        } catch (error: any) {
            console.error("Submission failed", error);
            if (error.response?.data?.errors) {
                Object.keys(error.response.data.errors).forEach((key) => {
                    const fieldName = key as keyof SubjectFormData;
                    if (['name', 'code', 'description', 'color', 'class_name', 'user_id', 'academic_year_id', 'classroom_id', 'image_url', 'logo_url'].includes(fieldName)) {
                        setError(fieldName, {
                            type: 'server',
                            message: error.response.data.errors[key][0]
                        });
                    }
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
        <Modal isOpen={isOpen} onClose={onClose} title={subject ? "Edit Subject" : "Add Subject"}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && (
                    <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-200">
                        {errors.root.message}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                        <input
                            {...register('name')}
                            type="text"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="Mathematics"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code *</label>
                        <input
                            {...register('code')}
                            type="text"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="MATH101"
                        />
                        {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Subject description..."
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class Name</label>
                        <input
                            {...register('class_name')}
                            type="text"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="10A"
                        />
                        {errors.class_name && <p className="text-red-500 text-xs mt-1">{errors.class_name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color</label>
                        <input
                            {...register('color')}
                            type="color"
                            className="w-full h-10 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                        {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher *</label>
                        <select
                            {...register('user_id', { valueAsNumber: true })}
                            disabled={isLoadingData}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                        >
                            <option value={0}>Select Teacher</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={parseInt(teacher.id)}>
                                    {teacher.name}
                                </option>
                            ))}
                        </select>
                        {errors.user_id && <p className="text-red-500 text-xs mt-1">{errors.user_id.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year *</label>
                        <select
                            {...register('academic_year_id', { valueAsNumber: true })}
                            disabled={isLoadingData}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                        >
                            <option value={0}>Select Year</option>
                            {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.year} - Semester {year.semester}
                                </option>
                            ))}
                        </select>
                        {errors.academic_year_id && <p className="text-red-500 text-xs mt-1">{errors.academic_year_id.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Classroom *</label>
                        <select
                            {...register('classroom_id', { valueAsNumber: true })}
                            disabled={isLoadingData}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                        >
                            <option value={0}>Select Classroom</option>
                            {classrooms.map((classroom) => (
                                <option key={classroom.id} value={classroom.id}>
                                    {classroom.name}
                                </option>
                            ))}
                        </select>
                        {errors.classroom_id && <p className="text-red-500 text-xs mt-1">{errors.classroom_id.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
                        <input
                            {...register('image_url')}
                            type="url"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="https://example.com/image.jpg"
                        />
                        {errors.image_url && <p className="text-red-500 text-xs mt-1">{errors.image_url.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo URL</label>
                        <input
                            {...register('logo_url')}
                            type="url"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="https://example.com/logo.svg"
                        />
                        {errors.logo_url && <p className="text-red-500 text-xs mt-1">{errors.logo_url.message}</p>}
                    </div>
                </div>

                {isLoadingData && (
                    <div className="text-sm text-slate-500 text-center">
                        Loading dropdown data...
                    </div>
                )}

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
                        {isSubmitting ? 'Saving...' : 'Save Subject'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
