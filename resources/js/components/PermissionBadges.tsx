// components/PermissionBadges.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import BadgeUI from '@/components/badge-ui';

interface Permission {
  id: number | string;
  name: string;
  label: string;
}

interface PermissionBadgesProps {
  permissions: Permission[];
  maxDisplay?: number;
}

export function PermissionBadges({ permissions = [], maxDisplay = 3 }: PermissionBadgesProps) {
  const { t } = useTranslation();
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    return <span className="text-sm text-gray-500">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {permissions.slice(0, maxDisplay).map((permission, index) => (
        <BadgeUI 
          key={index} 
          className="bg-primary/10 text-primary ring-primary/30 dark:bg-primary/15 dark:text-primary dark:ring-primary/35"
        >
          {permission.label || permission.name}
        </BadgeUI>
      ))}
      {permissions.length > maxDisplay && (
        <BadgeUI className="bg-gray-50 text-gray-600 ring-gray-600/20 dark:bg-gray-500/15 dark:text-gray-400 dark:ring-gray-500/35">
          +{permissions.length - maxDisplay} {t("more")}
        </BadgeUI>
      )}
    </div>
  );
}