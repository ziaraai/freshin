// components/CrudTable.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TableAction, TableColumn } from '@/types/crud';
import { hasPermission } from '@/utils/authorization';
import { Link } from '@inertiajs/react';
import * as LucidIcons from 'lucide-react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CrudTableProps {
    columns: TableColumn[];
    actions: TableAction[];
    data: any[];
    from: number;
    onAction: (action: string, row: any) => void;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (field: string) => void;
    statusColors?: Record<string, string>;
    permissions: string[];
    entityPermissions?: {
        view: string;
        edit: string;
        delete: string;
    };
    showActionsAsIcons?: boolean;
    maxHeight?: string;
}

export function CrudTable({
    columns,
    actions = [],
    data,
    from,
    onAction,
    sortField,
    sortDirection,
    onSort,
    statusColors = {},
    permissions,
    entityPermissions,
    maxHeight = 'calc(100vh - 280px)',
}: CrudTableProps) {
    const { t } = useTranslation();
    const renderSortIcon = (column: TableColumn) => {
        if (!column.sortable) return null;

        if (sortField === column.key) {
            return sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />;
        }

        return <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />;
    };

    const handleSort = (column: TableColumn) => {
        if (!column.sortable || !onSort) return;
        onSort(column.key);
    };

    const renderActionButtons = (row: any) => {
        return (
            <div className="flex items-center justify-end space-x-2">
                {actions.map((action, index) => {
                    // Skip if user doesn't have permission
                    const permissionKey =
                        action.requiredPermission ||
                        (entityPermissions &&
                            (action.action === 'view'
                                ? entityPermissions.view
                                : action.action === 'edit'
                                  ? entityPermissions.edit
                                  : action.action === 'delete'
                                    ? entityPermissions.delete
                                    : action.permission));

                    if (permissionKey && !hasPermission(permissions, permissionKey)) {
                        return null;
                    }

                    // Skip if condition function returns false
                    if (action.condition && !action.condition(row, permissions)) {
                        return null;
                    }

                    const iconValue = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                    const IconComponent = typeof iconValue === 'string' ? (LucidIcons as any)[iconValue] || LucidIcons.HelpCircle : iconValue;

                    // Handle link actions
                    if (action.href) {
                        const href = typeof action.href === 'function' ? action.href(row) : action.href.replace(':id', row.id);

                        return (
                            <TooltipProvider key={index}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href={href} target={action.openInNewTab ? '_blank' : undefined}>
                                            <Button variant="ghost" size="icon" className={cn('h-8 w-8 text-gray-500')}>
                                                <IconComponent size={16} />
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{action.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    // Handle regular action buttons
                    return (
                        <TooltipProvider key={index}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn('h-8 w-8 text-gray-500')}
                                        onClick={() => onAction(action.action, row)}
                                    >
                                        <IconComponent size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{action.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        );
    };

    // Helper function to get nested property value using dot notation
    const getNestedValue = (obj: any, path: string) => {
        if (!obj || !path) return null;

        const keys = path.split('.');
        return keys.reduce((acc, key) => {
            return acc && acc[key] !== undefined ? acc[key] : null;
        }, obj);
    };

    const renderCellContent = (row: any, col: TableColumn) => {
        // Get value using dot notation for nested properties
        const value = getNestedValue(row, col.key);

        // If column has custom render function, use it
        if (col.render) {
            return col.render(value, row);
        }

        // Handle different column types
        switch (col.type) {
            case 'badge':
                return <Badge className={cn('capitalize', statusColors[value])}>{value}</Badge>;

            case 'image':
                if (!value) {
                    return <div className="text-center text-gray-400">{t('No image')}</div>;
                }
                return (
                    <div className="flex justify-center">
                        <img
                            src={value.startsWith && value.startsWith('http') ? value : `/storage/${value}`}
                            alt={row.name || 'Image'}
                            className={col.className || 'h-16 w-20 rounded-md object-cover shadow-sm'}
                            onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/200x150?text=Image+Not+Found';
                            }}
                        />
                    </div>
                );

            case 'date':
                // return value ? <span className="text-sm">{new Date(value).toLocaleDateString()}</span> : <span>-</span>;
                return (
                    <div className="flex items-left gap-2 whitespace-nowrap overflow-hidden text-ellipsis text-gray-500">
                        {value && <LucidIcons.Calendar className="h-4 w-4" />}
                        <span>{window.appSettings?.formatDateTime(value, false) || '-'}</span>
                    </div>
                )

            case 'currency':
                return (
                    <span className="text-sm font-mono">
                        {typeof value === 'number' ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : value}
                    </span>
                );

            case 'boolean':
                return <span className="text-sm">{value ? 'Yes' : 'No'}</span>;

            case 'link':
                if (!value) return <span>-</span>;

                const href = col.href ? (typeof col.href === 'function' ? col.href(row) : col.href.replace(':id', row.id)) : '#';

                return (
                    <Link
                        href={href}
                        className={col.linkClassName || 'text-blue-600 hover:underline'}
                        target={col.openInNewTab ? '_blank' : undefined}
                    >
                        {value}
                    </Link>
                );

            default:
                return <span className="text-sm font-medium">{value || '-'}</span>;
        }
    };

    const isScrollable = data && data.length > 10 && maxHeight !== 'none';

    // Keep this a real table on small screens instead of squeezing columns unreadably thin.
    // The Table primitive already scrolls horizontally on its own (overflow-auto), so this
    // only affects the table's own scroll area, never the page.
    const minTableWidth = Math.max(560, (columns.length + (actions && actions.length > 0 ? 2 : 1)) * 140);

    return (
        <div className="border-collapse">
            <div
                className={cn(
                    'w-full',
                    isScrollable &&
                        'max-h-[calc(100vh-280px)] overflow-auto bg-[linear-gradient(to_bottom,#F0F0F1_49px,transparent_49px)] dark:bg-[linear-gradient(to_bottom,#1f2937_49px,transparent_49px)] [&_div]:overflow-visible [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-[#F0F0F1] dark:[&_th]:bg-gray-800 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-[#F0F0F1] dark:[&_thead]:bg-gray-800',
                )}
                style={isScrollable && maxHeight && maxHeight !== 'none' ? { maxHeight } : undefined}
            >
                <Table style={{ minWidth: `${minTableWidth}px` }}>
                    <TableHeader>
                        {/* <TableRow className="bg-gray-50 border-b"> */}
                        <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                            <TableHead className="w-12 bg-[#F0F0F1] py-2.5 font-semibold dark:bg-gray-800">#</TableHead>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={cn(
                                        'bg-[#F0F0F1] py-2.5 font-semibold dark:bg-gray-800',
                                        column.sortable && 'cursor-pointer select-none',
                                        column.className,
                                    )}
                                    onClick={() => handleSort(column)}
                                >
                                    <div className="flex items-center">
                                        {column.label}
                                        {renderSortIcon(column)}
                                    </div>
                                </TableHead>
                            ))}
                            {actions && actions.length > 0 && (
                                <TableHead className="w-24 bg-[#F0F0F1] py-2.5 text-right font-semibold dark:bg-gray-800">{t('Actions')}</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((row, index) => (
                                <TableRow key={row.id || index} className="border-b hover:bg-gray-50">
                                    <TableCell className="py-2.5 font-medium">{from + index}</TableCell>
                                    {columns.map((col) => (
                                        <TableCell key={col.key} className={cn('py-2.5', col.className)}>
                                            {renderCellContent(row, col)}
                                        </TableCell>
                                    ))}
                                    {actions && actions.length > 0 && <TableCell className="py-2.5 text-right">{renderActionButtons(row)}</TableCell>}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions && actions.length > 0 ? 2 : 1)}
                                    className="text-muted-foreground h-24 text-center"
                                >
                                    {t('No results found.')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
