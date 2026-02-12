import { Outlet, NavLink } from "react-router-dom"
import { Home, BookOpen, Trophy, Settings, Ghost, Menu } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: BookOpen, label: "Learn", href: "/dashboard/learn" },
    { icon: Trophy, label: "Leaderboard", href: "/dashboard/leaderboard" },
    { icon: Ghost, label: "Quests", href: "/dashboard/quests" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export default function DashboardLayout() {
    const [isSidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r-2 border-border transform transition-transform duration-200 ease-in-out lg:transform-none flex flex-col p-4 gap-4",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center px-4 py-2">
                    <h1 className="text-2xl font-extrabold text-primary tracking-tight">
                        LMS<span className="text-accent-foreground">Game</span>
                    </h1>
                </div>

                <nav className="flex-1 space-y-2">
                    {sidebarItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) => cn(
                                "flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800",
                                isActive && "bg-primary/10 text-primary border-primary/20",
                                !isActive && "text-muted-foreground"
                            )}
                        >
                            <item.icon className="w-6 h-6" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 bg-muted/30 rounded-2xl border-2 border-border/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">My Profile</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                            ME
                        </div>
                        <div>
                            <p className="text-sm font-bold">Student Name</p>
                            <p className="text-xs text-muted-foreground">Level 5</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen transition-all duration-200 ease-in-out">
                {/* Topbar */}
                <header className="h-16 px-4 lg:px-8 border-b-2 border-border flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-30">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </Button>

                    <div className="flex items-center gap-4 ml-auto">
                        {/* Gamification Stats */}
                        <div className="hidden md:flex items-center gap-6">
                            <div className="flex items-center gap-2 text-yellow-500 font-bold">
                                <Trophy className="w-5 h-5 fill-current" />
                                <span>1,204 XP</span>
                            </div>
                            <div className="flex items-center gap-2 text-rose-500 font-bold">
                                <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white">🔥</div>
                                <span>12 Day Streak</span>
                            </div>
                        </div>

                        <Button variant="game" size="sm">
                            Start Learning
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
