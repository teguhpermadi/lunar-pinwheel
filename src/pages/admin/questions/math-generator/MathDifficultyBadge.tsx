interface MathDifficultyBadgeProps {
    difficulty: string;
    level?: number;
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
    mudah: {
        label: 'Mudah',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    sedang: {
        label: 'Sedang',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    sulit: {
        label: 'Sulit',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
};

export default function MathDifficultyBadge({ difficulty, level }: MathDifficultyBadgeProps) {
    const config = difficultyConfig[difficulty] || difficultyConfig.sedang;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
            {level && <span className="ml-1 opacity-70">Lv.{level}</span>}
        </span>
    );
}
