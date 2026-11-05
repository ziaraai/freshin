import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { FloatingChatGpt } from '@/components/FloatingChatGpt';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export interface PageAction {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick?: () => void;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
}

export interface PageTemplateProps {
  title: string;
  description?: string;
  url?: string;
  actions?: PageAction[];
  children: ReactNode;
  noPadding?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  backUrl?: string;
}

export function PageTemplate({ 
  title,
  description, 
  url, 
  actions, 
  children, 
  noPadding = false,
  breadcrumbs,
  backUrl
}: PageTemplateProps) {
  const { t } = useTranslation();
  // Default breadcrumbs if none provided
  const pageBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    {
      title,
      href: url,
    },
  ];

  return (
    <AppLayout breadcrumbs={pageBreadcrumbs}>
      <Head title={title} />
      
      {/* <div className="flex h-full flex-1 flex-col gap-4 p-4"> */}
      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:pt-4 lg:px-[50px] lg:pb-[50px]">
        {/* Header with action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {/* <h1 className="min-w-0 break-words text-lg font-semibold sm:text-xl">{title}</h1> */}
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {backUrl && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 h-8 px-2.5 md:px-3 cursor-pointer whitespace-nowrap"
                    onClick={() => router.visit(backUrl)}
                  >
                    <ArrowLeft className="h-4 w-4 text-neutral-500" />
                    <span className="hidden md:inline">{t('Back')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  <p>{t('Back')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {actions && actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => {
                const hasLabel = action.label && action.label.trim() !== '';
                const explicitTooltip = action.tooltip && action.tooltip.trim() !== '';
                const tooltipText = explicitTooltip ? action.tooltip : (hasLabel ? action.label : '');
                
                const buttonElement = (
                  <Button
                    variant={action.variant || 'outline'}
                    size={hasLabel ? 'sm' : 'icon'}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`cursor-pointer whitespace-nowrap ${action.className || ''}`}
                  >
                    {action.icon && !hasLabel && action.icon}
                    {action.icon && hasLabel && action.icon}
                    {hasLabel && <span className="hidden md:inline ml-1.5">{action.label}</span>}
                  </Button>
                );

                // Wrap with tooltip if tooltip text exists
                if (tooltipText) {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        {buttonElement}
                      </TooltipTrigger>
                      <TooltipContent className={explicitTooltip ? '' : 'md:hidden'}>
                        <p>{tooltipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                // Return button without tooltip
                return <span key={index}>{buttonElement}</span>;
              })}
            </div>
          )}
          </div>
        </div>

        {/* Content */}
        <div className={noPadding ? "" : "rounded-xl border p-2.5 sm:p-6"}>
          {children}
        </div>
      </div>
      <FloatingChatGpt />
    </AppLayout>
  );
}