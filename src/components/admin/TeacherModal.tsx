import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/ui/modal'; // Assuming Modal is default export
import { Teacher } from '@/lib/api';
import { useEffect } from 'react';

const teacherSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().optional(),
}).refine((data) => {
    // If we can't easily distinguish create/edit in schema, we might validte in component or make password always required but handle 'edit' logic separately. 
    // Easier approach: Use a separate schema for create vs edit OR make password optional in Zod but check availability in component onSubmit.
    // Actually, let's keep it simple: generic schema, refinements handled or just basic string constraints.
    // For now, let's just enforce min length if provided.
    if (data.password && data.password.length < 8) return false;
    return true;
}, {
    message: "Password must be at least 8 characters",
    path: ["password"],
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface TeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher?: Teacher | null;
    onSave: (data: TeacherFormData) => Promise<void>;
}

export default function TeacherModal({ isOpen, onClose, teacher, onSave }: TeacherModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<TeacherFormData>({
        resolver: zodResolver(teacherSchema),
        defaultValues: {
            name: '',
            email: '',
            username: '',
            password: '',
        },
    });

    useEffect(() => {
        if (teacher) {
            reset({
                name: teacher.name,
                email: teacher.email,
                username: teacher.username || '',
                password: '', // Don't fill password on edit
            });
        } else {
            reset({
                name: '',
                email: '',
                username: '',
                password: '',
            });
        }
    }, [teacher, isOpen, reset]);

    const onSubmit = async (data: TeacherFormData) => {
        // validation for creation
        if (!teacher && !data.password) {
            setError('password', { type: 'manual', message: 'Password is required for new teachers' });
            return;
        }

        // Filter out empty password on update
        const payload = { ...data };
        if (!payload.password) delete payload.password;

        try {
            await onSave(payload as TeacherFormData);
            onClose(); // Close only on success
        } catch (error: any) {
            console.error("Submission failed", error);
            if (error.response?.data?.errors) {
                Object.keys(error.response.data.errors).forEach((key) => {
                    const fieldName = key as keyof TeacherFormData;
                    if (['name', 'email', 'username', 'password'].includes(fieldName)) {
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
        <Modal isOpen={isOpen} onClose={onClose} title={teacher ? "Edit Teacher" : "Add Teacher"}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && (
                    <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-200">
                        {errors.root.message}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                    <input
                        {...register('name')}
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                        {...register('email')}
                        type="email"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                    <input
                        {...register('username')}
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="johndoe"
                    />
                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Password {teacher && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
                    </label>
                    <input
                        {...register('password')}
                        type="password"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
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
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Teacher'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
