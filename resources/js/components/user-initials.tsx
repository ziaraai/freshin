import { useInitials } from '@/hooks/use-initials';
import { Avatar, AvatarFallback } from './ui/avatar';

const COLORS = [
    'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
    'bg-lime-50 text-lime-700 border-lime-300 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-800',
    'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    'bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    'bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    'bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
    'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-300 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800',
    'bg-pink-50 text-pink-700 border-pink-300 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800',
    'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
];

function pickColor(name: string) {
    const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return COLORS[hash % COLORS.length];
}

const UserInitials = ({ name }: { name?: string }) => {
    const getInitials = useInitials();
    return (
        <Avatar className="size-9 rounded-full">
            <AvatarFallback
                className={`rounded-full border text-sm font-semibold ${name ? pickColor(name) : 'border-gray-300 bg-gray-50 text-gray-700'}`}
            >
                {getInitials(name || 'A N')}
            </AvatarFallback>
        </Avatar>
    );
};

export default UserInitials;
