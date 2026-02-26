import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface StudentSidebarProps {
    isCollapsed: boolean;
}

export default function StudentSidebar({ isCollapsed }: StudentSidebarProps) {
    const location = useLocation();
    const { logout } = useAuth();

    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/' },
        // { icon: 'menu_book', label: 'My Courses', path: '/courses' },
        { icon: 'quiz', label: 'Exams', path: '/exams' },
        // { icon: 'emoji_events', label: 'Leaderboard', path: '/leaderboard' },
        // { icon: 'military_tech', label: 'Achievements', path: '/achievements' },
        // { icon: 'settings', label: 'Profile', path: '/profile' },
    ];

    return (
        <aside
            className={cn(
                "bg-primary dark:bg-background-dark border-r border-primary/10 flex flex-col h-full transition-all duration-300 relative z-20",
                isCollapsed ? "w-[80px]" : "w-64"
            )}
        >
            <div className={cn(
                "p-6 flex items-center gap-3 sidebar-header transition-all",
                isCollapsed ? "px-0 justify-center" : ""
            )}>
                <div className="min-w-10 size-10 bg-white rounded-lg flex items-center justify-center shadow-lg shrink-0">
                    <span className="material-symbols-outlined text-primary text-2xl">school</span>
                </div>
                <div className={cn(
                    "logo-text overflow-hidden whitespace-nowrap transition-all duration-300",
                    isCollapsed ? "hidden w-0 opacity-0" : "w-auto opacity-100"
                )}>
                    <h1 className="text-white text-lg font-bold leading-tight uppercase tracking-wider">LMS Student</h1>
                    <p className="text-primary/30 text-xs font-medium">Learning Hub</p>
                </div>
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
                        <span className="material-symbols-outlined shrink-0">{item.icon}</span>
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
                    <span className="material-symbols-outlined shrink-0">logout</span>
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

