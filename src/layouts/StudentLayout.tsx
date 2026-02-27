import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentLayout() {
    const { user } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            {/* Mobile Sidebar Backdrop */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <StudentSidebar
                isCollapsed={isSidebarCollapsed}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark/50 transition-all duration-300">
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4 flex-1">
                        {/* Desktop Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="hidden lg:flex cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            <span className={`material-symbols-outlined toggle-icon block transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                                menu_open
                            </span>
                        </button>

                        {/* Mobile Toggle */}
                        <button
                            onClick={toggleMobileSidebar}
                            className="lg:hidden cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            <span className="material-symbols-outlined font-icon">
                                menu
                            </span>
                        </button>

                        <label className="relative w-full max-w-xs md:max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 scale-90 md:scale-100">
                                <span className="material-symbols-outlined">search</span>
                            </span>
                            <input
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/50 transition-all text-sm outline-none"
                                placeholder="Search courses, lessons, or exams..."
                                type="text"
                            />
                        </label>
                    </div>
                    <div className="flex items-center gap-2 md:gap-6">
                        <div className="flex items-center gap-1 md:gap-2">
                            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 relative">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-background-dark"></span>
                            </button>
                            <button className="hidden sm:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-outlined">workspace_premium</span>
                            </button>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user?.name ?? 'Student'}</p>
                                <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
                            </div>
                            <div className="size-10 rounded-full border-2 border-primary/20 p-0.5">
                                <img
                                    alt="Student Profile Avatar"
                                    className="rounded-full size-full object-cover"
                                    src={user?.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.name ?? 'S')}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
}
