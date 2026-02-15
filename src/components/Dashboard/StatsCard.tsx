import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string;
    change: string;
    icon: string;
    colorClass: string; // e.g., 'bg-blue-500'
    iconBgClass: string; // e.g., 'bg-white/20'
    isLoading?: boolean;
}

export default function StatsCard({ title, value, change, icon, colorClass, iconBgClass, isLoading = false }: StatsCardProps) {
    if (isLoading) {
        return (
            <div className={cn("rounded-3xl p-6 shadow-xl relative overflow-hidden animate-pulse bg-gray-200 dark:bg-gray-800")}>
                <div className="flex flex-col gap-4">
                    <div className="size-10 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                    <div>
                        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="flex items-baseline gap-2">
                            <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            <div className="h-5 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group",
            colorClass
        )}>
            {/* Decorative circle */}
            <div className="absolute -right-4 -top-4 size-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>

            <div className="relative z-10 flex flex-col gap-4">
                <div className={cn("size-10 rounded-xl flex items-center justify-center", iconBgClass)}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div>
                    <p className="text-white/80 text-sm font-medium">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold">{value}</h3>
                        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{change}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
