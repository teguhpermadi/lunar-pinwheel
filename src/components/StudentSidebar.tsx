import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    History,
    GraduationCap,
    X,
    LogOut
} from 'lucide-react';

interface StudentSidebarProps {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

export default function StudentSidebar({ isCollapsed, isMobileOpen, onMobileClose }: StudentSidebarProps) {
    const location = useLocation();
    const { logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        // { icon: BookOpen, label: 'My Courses', path: '/courses' },
        { icon: GraduationCap, label: 'Exams', path: '/exams' },
        { icon: History, label: 'Exam History', path: '/exams/history' },
        // { icon: Star, label: 'Leaderboard', path: '/leaderboard' },
        // { icon: Award, label: 'Achievements', path: '/achievements' },
        // { icon: Settings, label: 'Profile', path: '/profile' },
    ];

    return (
        <aside
            className={cn(
                "bg-primary dark:bg-background-dark border-r border-primary/10 flex flex-col h-full transition-all duration-300 fixed lg:static z-40 lg:z-20",
                isCollapsed ? "w-[80px]" : "w-64",
                isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
        >
            <div className={cn(
                "p-6 flex items-center gap-3 sidebar-header transition-all",
                isCollapsed ? "px-0 justify-center" : ""
            )}>
                <div className="min-w-10 size-10 bg-white rounded-lg flex items-center justify-center shadow-lg shrink-0">
                    <GraduationCap className="size-6 text-primary" />
                </div>
                <div className={cn(
                    "logo-text overflow-hidden whitespace-nowrap transition-all duration-300",
                    isCollapsed ? "hidden w-0 opacity-0" : "w-auto opacity-100"
                )}>
                    <h1 className="text-white text-lg font-bold leading-tight uppercase tracking-wider">LMS Student</h1>
                    <p className="text-primary/30 text-xs font-medium">Learning Hub</p>
                </div>

                <button
                    onClick={onMobileClose}
                    className="lg:hidden ml-auto text-white/60 p-1 rounded-lg hover:bg-white/10"
                >
                    <X className="size-5" />
                </button>
            </div>

            <nav className={cn(
                "flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar",
                isCollapsed ? "px-3" : ""
            )}>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap overflow-hidden",
                            location.pathname === item.path
                                ? "bg-white/10 text-white font-medium"
                                : "text-white/60 hover:bg-white/5 hover:text-white",
                            isCollapsed ? "justify-center px-0" : ""
                        )}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <item.icon className="size-5 shrink-0" />
                        <span className={cn(
                            "nav-label overflow-hidden whitespace-nowrap transition-all duration-300",
                            isCollapsed ? "hidden w-0 opacity-0" : "block opacity-100"
                        )}>
                            {item.label}
                        </span>
                    </Link>
                ))}
            </nav>

            <div className={cn("p-4 mt-auto", isCollapsed ? "px-3" : "")}>
                {/* <div className={cn(
                    "bg-white/5 rounded-2xl p-4 mb-4 overflow-hidden transition-all",
                    isCollapsed ? "hidden" : "block"
                )}>
                    <p className="text-white/60 text-xs mb-2">Semester Progress</p>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                        <div className="bg-yellow-400 h-1.5 rounded-full w-3/4"></div>
                    </div>
                    <p className="text-white text-xs font-semibold">Level 14 • 12,450 XP</p>
                </div> */}
                <button
                    onClick={logout}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors w-full",
                        isCollapsed ? "justify-center px-0" : ""
                    )}>
                    <LogOut className="size-5 shrink-0" />
                    <span className={cn(
                        "nav-label overflow-hidden whitespace-nowrap transition-all duration-300",
                        isCollapsed ? "hidden w-0 opacity-0" : "block opacity-100"
                    )}>
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
}

