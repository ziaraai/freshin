import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from '@inertiajs/react';
import { Fragment } from 'react';

export function Breadcrumbs({
  items,
  breadcrumbs,
}: {
  items?: Array<{ label: string; href?: string }>;
  breadcrumbs?: Array<{ title?: string; label?: string; href?: string }>;
}) {
  const displayItems =
    items ||
    breadcrumbs?.map((b) => ({
      label: b.label || b.title || '',
      href: b.href,
    })) ||
    [];

  if (!displayItems || displayItems.length === 0) return null;

  const firstItem = displayItems[0];
  const lastItem = displayItems[displayItems.length - 1];
  const middleItems = displayItems.length > 2 ? displayItems.slice(1, displayItems.length - 1) : [];
  const hasMiddleItems = middleItems.length > 0;

  return (
    <Breadcrumb className="hidden md:block overflow-hidden">
      {/* 1440px and above: Show all breadcrumb items */}
      <BreadcrumbList className={hasMiddleItems ? "hidden min-[1440px]:flex flex-nowrap" : "flex flex-nowrap"}>
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          return (
            <Fragment key={index}>
              <BreadcrumbItem className={isLast ? "min-w-0 max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[320px] min-[1440px]:max-w-none truncate" : "shrink-0"}>
                {isLast ? (
                  <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href || '#'} className="whitespace-nowrap">{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="shrink-0" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>

      {/* 768px to 1439px (including 768px and 1024px): Collapse middle items into Ellipsis if items > 2 */}
      {hasMiddleItems && (
        <BreadcrumbList className="flex flex-nowrap min-[1440px]:hidden">
          {/* First Item */}
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink asChild>
              <Link href={firstItem.href || '#'} className="whitespace-nowrap">{firstItem.label}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbSeparator className="shrink-0" />

          {/* Ellipsis for middle navigation items */}
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbEllipsis className="h-4 w-4" />
          </BreadcrumbItem>

          <BreadcrumbSeparator className="shrink-0" />

          {/* Current / Last Item */}
          <BreadcrumbItem className="min-w-0 max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[260px] truncate">
            <BreadcrumbPage className="truncate">{lastItem.label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      )}
    </Breadcrumb>
  );
}
