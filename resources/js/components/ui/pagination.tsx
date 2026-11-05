/**
 * Pagination component with dark mode support
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface PaginationProps {
    from?: number;
    to?: number;
    total?: number;
    links?: any[];
    currentPage?: number;
    lastPage?: number;
    entityName?: string;
    onPageChange?: (url: string) => void;
    className?: string;
    perPageOptions?: number[];
    currentPerPage?: string;
    onPerPageChange?: (value: string) => void;
    hidePerPage?: boolean;
}

export function Pagination({
    from = 0,
    to = 0,
    total = 0,
    links = [],
    currentPage: propCurrentPage,
    lastPage: propLastPage,
    entityName = 'results',
    perPageOptions = [10, 25, 50, 100],
    hidePerPage = false,
    currentPerPage,
    onPerPageChange,
    onPageChange,
    className = '',
}: PaginationProps) {
    const { t } = useTranslation();

    const handlePageChange = (url: string) => {
        if (onPageChange) {
            onPageChange(url);
        } else if (url) {
            window.location.href = url;
        }
    };

    // Extract current page and total page count from links if available, else props
    let currentPage = propCurrentPage || 1;
    let totalPages = propLastPage || 1;

    const prevLink = links?.find(
        (l: any) => l.label === '&laquo; Previous' || l.label?.includes('Previous')
    );
    const nextLink = links?.find(
        (l: any) => l.label === 'Next &raquo;' || l.label?.includes('Next')
    );

    if (links && links.length > 0) {
        const activeLink = links.find((l: any) => l.active);
        if (activeLink && !isNaN(Number(activeLink.label))) {
            currentPage = Number(activeLink.label);
        }
        const numericLinks = links.filter((l: any) => !isNaN(Number(l.label)));
        if (numericLinks.length > 0) {
            totalPages = Math.max(...numericLinks.map((l: any) => Number(l.label)));
        }
    }

    // Helper map for link URLs by page number
    const getPageUrl = (pageNumber: number) => {
        if (links && links.length > 0) {
            const found = links.find((l: any) => Number(l.label) === pageNumber);
            if (found && found.url) return found.url;
        }
        return `?page=${pageNumber}`;
    };

    // Generate responsive items for screen width < 991px
    const renderResponsiveLinks = () => {
        if (totalPages <= 1) return null;

        let items: Array<number | 'ellipsis'> = [];

        if (totalPages <= 2) {
            for (let i = 1; i <= totalPages; i++) items.push(i);
        } else if (currentPage <= 2) {
            // First 2 page numbers showing (1, 2) followed by ellipsis, without last page number
            items = [1, 2, 'ellipsis'];
        } else if (currentPage >= totalPages - 1) {
            // Last 2 page numbers showing (e.g. 9, 10) preceded by ellipsis
            items = ['ellipsis', totalPages - 1, totalPages];
        } else {
            // Middle pages: showing only the single current page number with ellipsis on both sides
            items = ['ellipsis', currentPage, 'ellipsis'];
        }

        return (
            <div className="flex items-center gap-1">
                {/* Previous Button */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage <= 1 || (prevLink && !prevLink.url)}
                    onClick={() => {
                        const url = prevLink?.url || getPageUrl(currentPage - 1);
                        if (url) handlePageChange(url);
                    }}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Items */}
                {items.map((item, index) => {
                    if (item === 'ellipsis') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-1.5 py-1 text-sm text-muted-foreground select-none"
                            >
                                ...
                            </span>
                        );
                    }

                    const pageNum = item as number;
                    const isActive = pageNum === currentPage;

                    return (
                        <Button
                            key={`resp-page-${pageNum}`}
                            variant={isActive ? 'default' : 'outline'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePageChange(getPageUrl(pageNum))}
                        >
                            {pageNum}
                        </Button>
                    );
                })}

                {/* Next Button */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage >= totalPages || (nextLink && !nextLink.url)}
                    onClick={() => {
                        const url = nextLink?.url || getPageUrl(currentPage + 1);
                        if (url) handlePageChange(url);
                    }}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    return (
        <div className={cn(
            "p-4 border-t flex flex-wrap gap-3 items-center justify-center min-[991px]:justify-between",
            className
        )}>
            <div className="text-sm text-muted-foreground dark:text-gray-300 text-center min-[991px]:text-left">
                {t("Showing")} <span className="font-medium dark:text-white">{from}</span> {t("to")}{" "}
                <span className="font-medium dark:text-white">{to}</span> {t("of")}{" "}
                <span className="font-medium dark:text-white">{total}</span> {t('results')}
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-center">
                {!hidePerPage && onPerPageChange && (
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">{t("Rows per page:")}</Label>
                        <Select
                            value={currentPerPage || "10"}
                            onValueChange={onPerPageChange}
                        >
                            <SelectTrigger className="w-16 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {perPageOptions.map(option => (
                                    <SelectItem key={option} value={option.toString()}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Mobile / Screen < 991px Pagination */}
                <div className="block min-[991px]:hidden">
                    {renderResponsiveLinks()}
                </div>

                {/* Desktop / Screen >= 991px Pagination */}
                <div className="hidden min-[991px]:flex flex-wrap gap-1 items-center">
                    {links && links.length > 0 ? (
                        links.map((link: any, i: number) => {
                            const isTextLink = link.label === "&laquo; Previous" || link.label === "Next &raquo;";

                            return (
                                <Button
                                    key={`pagination-${i}-${link.label}`}
                                    variant={link.active ? 'default' : 'outline'}
                                    size={isTextLink ? "sm" : "icon"}
                                    className={isTextLink ? "px-3" : "h-8 w-8"}
                                    disabled={!link.url}
                                    onClick={() => link.url && handlePageChange(link.url)}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            );
                        })
                    ) : (
                        currentPage && totalPages && totalPages > 1 && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => handlePageChange(`?page=${currentPage - 1}`)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-3 py-1 dark:text-white">
                                    {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => handlePageChange(`?page=${currentPage + 1}`)}
                                >
                                    {t("Next")} <ChevronRight className="h-4 w-4" />
                                </Button>
                            </>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}