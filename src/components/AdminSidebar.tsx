import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    Calendar,
    Book,
    BookOpen,
    Library,
    FileText,
    X,
    LogOut
} from 'lucide-react';

interface AdminSidebarProps {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

export default function AdminSidebar({ isCollapsed, isMobileOpen, onMobileClose }: AdminSidebarProps) {
    const location = useLocation();
    const { logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: GraduationCap, label: 'Teachers', path: '/admin/teachers' },
        { icon: Users, label: 'Students', path: '/admin/students' },
        { icon: Calendar, label: 'Academic Years', path: '/admin/academic-years' },
        { icon: Book, label: 'Subjects', path: '/admin/subjects' },
        { icon: BookOpen, label: 'Classrooms', path: '/admin/classrooms' },
        { icon: Library, label: 'Question Bank', path: '/admin/question-banks' },
        { icon: FileText, label: 'Exams', path: '/admin/exams' },
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
                    <h1 className="text-white text-lg font-bold leading-tight uppercase tracking-wider">LMS Admin</h1>
                    <p className="text-primary/30 text-xs font-medium">Core Management</p>
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
                <button
                    onClick={logout}
                    className={cn(
                        "logout-btn flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors w-full",
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

