import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function SettingsSection({ title, description, children, action }: SettingsSectionProps) {
  return (
    <Card className="mb-6 w-full min-w-0">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1.5">
                {description}
              </CardDescription>
            )}
          </div>
          {action && (
            <div className="flex items-center shrink-0 w-full sm:w-auto justify-end sm:justify-end shrink-0 [&>*]:w-full sm:[&>*]:w-auto [&_button]:w-full sm:[&_button]:w-auto">
              {action}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="w-full min-w-0">
        {children}
      </CardContent>
    </Card>
  );
}