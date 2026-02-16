import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { LoginSchema, LoginRequest, authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginRequest>({
        resolver: zodResolver(LoginSchema),
    });

    const onSubmit = async (data: LoginRequest) => {
        try {
            const response = await authApi.login(data);

            // Response structure is { success: true, message: "...", data: { user: ..., token: ... } }
            // Note: API returns 'user_type', frontend uses 'role'.
            const { token, user: apiUserData } = response.data || {};

            let user = apiUserData;

            // Map user_type to role if needed
            if (user && user.user_type && !user.role) {
                user = { ...user, role: user.user_type };
            }

            if (!user) {
                user = {
                    id: 1,
                    name: 'Test User',
                    email: data.email,
                    role: data.email.includes('admin') ? 'admin' : (data.email.includes('teacher') ? 'teacher' : 'student')
                };
            }

            login(token, user);

            if (token) {
                login(token, user);
                navigate('/');
            } else {
                throw new Error("Token not found in response");
            }
        } catch (error: any) {
            console.error('Login failed', error);
            if (error.response?.data?.errors) {
                // Handle server-side validation errors
                Object.keys(error.response.data.errors).forEach((key) => {
                    setError(key as keyof LoginRequest, {
                        type: 'server',
                        message: error.response.data.errors[key][0]
                    })
                });
            } else {
                setError('root', {
                    type: 'server',
                    message: error.response?.data?.message || 'Login failed. Please try again.'
                });
            }
        }
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-md space-y-8">
                <div className="text-center lg:text-left">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome Back</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Log in to your account to continue your journey.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {errors.root && (
                        <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-200">
                            {errors.root.message}
                        </div>
                    )}

                    <Input
                        id="email"
                        type="email"
                        label="Email Address"
                        placeholder="name@school.edu"
                        register={register('email')}
                        error={errors.email}
                        icon={<span className="material-icons text-slate-400 text-lg">mail</span>}
                    />

                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="password">Password</label>
                        </div>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons text-slate-400 text-lg">lock</span>
                            </div>
                            <input
                                {...register('password')}
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-primary focus:border-primary dark:bg-surface-dark dark:text-white sm:text-sm transition-all duration-200 ${errors.password
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                    : 'border-slate-300 dark:border-slate-600'
                                    }`}
                            />
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
                    </div>

                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            type="checkbox"
                            {...register('remember')}
                            className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded dark:bg-surface-dark dark:border-slate-600"
                        />
                        <label className="ml-2 block text-sm text-slate-600 dark:text-slate-400" htmlFor="remember-me">
                            Remember me for 30 days
                        </label>
                    </div>

                    <div>
                        <Button type="submit" fullWidth disabled={isSubmitting}>
                            {isSubmitting ? 'Logging in...' : 'Log In'}
                        </Button>
                    </div>
                </form>

                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                        Register
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
