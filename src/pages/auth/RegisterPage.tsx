import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterSchema, RegisterRequest, authApi } from '@/lib/api';
import AuthLayout from '@/layouts/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<RegisterRequest>({
        resolver: zodResolver(RegisterSchema),
    });

    const onSubmit = async (data: RegisterRequest) => {
        try {
            await authApi.register(data);
            // Assuming successful registration logs the user in or redirects to login
            // For now, let's redirect to login with a success message (conceptually)
            navigate('/login');
        } catch (error: any) {
            console.error('Registration failed', error);
            if (error.response?.data?.errors) {
                Object.keys(error.response.data.errors).forEach((key) => {
                    // Mapping API error keys to form fields if necessary
                    const fieldName = key as keyof RegisterRequest;
                    if (['name', 'email', 'password', 'password_confirmation'].includes(fieldName)) {
                        setError(fieldName, {
                            type: 'server',
                            message: error.response.data.errors[key][0]
                        });
                    }
                });
            } else {
                setError('root', {
                    type: 'server',
                    message: error.response?.data?.message || 'Registration failed. Please try again.'
                });
            }
        }
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-md space-y-8">
                <div className="text-center lg:text-left">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Create an Account</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Join us and start your learning journey today.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {errors.root && (
                        <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-200">
                            {errors.root.message}
                        </div>
                    )}

                    <Input
                        id="name"
                        type="text"
                        label="Full Name"
                        placeholder="John Doe"
                        register={register('name')}
                        error={errors.name}
                        icon={<span className="material-icons text-slate-400 text-lg">person</span>}
                    />

                    <Input
                        id="email"
                        type="email"
                        label="Email Address"
                        placeholder="name@school.edu"
                        register={register('email')}
                        error={errors.email}
                        icon={<span className="material-icons text-slate-400 text-lg">mail</span>}
                    />

                    <Input
                        id="password"
                        type="password"
                        label="Password"
                        placeholder="••••••••"
                        register={register('password')}
                        error={errors.password}
                        icon={<span className="material-icons text-slate-400 text-lg">lock</span>}
                    />

                    <Input
                        id="password_confirmation"
                        type="password"
                        label="Confirm Password"
                        placeholder="••••••••"
                        register={register('password_confirmation')}
                        error={errors.password_confirmation}
                        icon={<span className="material-icons text-slate-400 text-lg">lock</span>}
                    />

                    <div>
                        <Button type="submit" fullWidth disabled={isSubmitting}>
                            {isSubmitting ? 'Creating Account...' : 'Register'}
                        </Button>
                    </div>
                </form>

                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                        Log In
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
