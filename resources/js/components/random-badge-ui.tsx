import React from 'react';
import { cn } from "@/lib/utils";

interface RandomBadgeUIProps {
    name: string;
    className?: string;
}

const badgePalettes = [
    { bg: 'bg-orange-50 text-orange-700 ring-orange-600/10 dark:bg-orange-500/15 dark:text-orange-400 dark:ring-orange-500/35' },
    { bg: 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/35' },
    { bg: 'bg-yellow-50 text-yellow-800 ring-yellow-600/10 dark:bg-yellow-500/15 dark:text-yellow-400 dark:ring-yellow-500/35' },
    { bg: 'bg-lime-50 text-lime-700 ring-lime-600/10 dark:bg-lime-500/15 dark:text-lime-400 dark:ring-lime-500/35' },
    { bg: 'bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35' },
    { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/35' },
    { bg: 'bg-teal-50 text-teal-700 ring-teal-600/10 dark:bg-teal-500/15 dark:text-teal-400 dark:ring-teal-500/35' },
    { bg: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10 dark:bg-cyan-500/15 dark:text-cyan-400 dark:ring-cyan-500/35' },
    { bg: 'bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-500/15 dark:text-sky-400 dark:ring-sky-500/35' },
    { bg: 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/35' },
    { bg: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-500/15 dark:text-indigo-400 dark:ring-indigo-500/35' },
    { bg: 'bg-violet-50 text-violet-700 ring-violet-600/10 dark:bg-violet-500/15 dark:text-violet-400 dark:ring-violet-500/35' },
    { bg: 'bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-500/15 dark:text-purple-400 dark:ring-purple-500/35' },
    { bg: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/10 dark:bg-fuchsia-500/15 dark:text-fuchsia-400 dark:ring-fuchsia-500/35' },
    { bg: 'bg-pink-50 text-pink-700 ring-pink-600/10 dark:bg-pink-500/15 dark:text-pink-400 dark:ring-pink-500/35' },
    { bg: 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/35' }
];

export default function RandomBadgeUI({ name, className }: RandomBadgeUIProps) {
    const trimmedName = (name || '').trim();

    // Hash name to get a stable color selection
    let hash = 0;
    for (let i = 0; i < trimmedName.length; i++) {
        hash = trimmedName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % badgePalettes.length;
    const palette = badgePalettes[colorIndex];

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                palette.bg,
                className
            )}
        >
            {trimmedName || '-'}
        </span>
    );
}
