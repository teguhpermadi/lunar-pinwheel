import { Outlet } from "react-router-dom"

export default function GuestLayout() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-primary tracking-tight">
                        LMS<span className="text-accent-foreground">Game</span>
                    </h1>
                    <p className="mt-2 text-muted-foreground">Level up your learning journey.</p>
                </div>

                <div className="bg-card text-card-foreground shadow-xl rounded-3xl border-2 border-border p-8 backdrop-blur-sm">
                    <Outlet />
                </div>
            </div>

            {/* Background decorations */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        </div>
    )
}
