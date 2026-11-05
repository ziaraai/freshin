import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Mail, Shield, Monitor, Globe, Clock, Cpu, Smartphone, MapPin, Wifi, Building2, Link, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { getImageUrl } from '@/utils/image-helper';

export default function AllUserLogs() {
  const { t } = useTranslation();
  const { auth, loginHistories, userTypes, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedUserType, setSelectedUserType] = useState(
    pageFilters.user_type && pageFilters.user_type !== 'all' && pageFilters.user_type !== '_empty_'
      ? pageFilters.user_type
      : '_empty_'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '' || (selectedUserType !== '_empty_' && selectedUserType !== 'all');
  };
  
  // Count active filters
  const activeFilterCount = () => {
    return (searchTerm !== '' ? 1 : 0) + ((selectedUserType !== '_empty_' && selectedUserType !== 'all') ? 1 : 0);
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    ...(auth?.user?.type === 'superadmin' 
      ? [{ title: t('Companies'), href: route('companies.index') }]
      : [{ title: t('Users'), href: route('users.index') }]
    ),
    { title: t('Login History') }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (selectedUserType !== '_empty_' && selectedUserType !== 'all') params.user_type = selectedUserType;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('users.all-logs'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    const params: any = { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1,
      per_page: pageFilters.per_page
    };
    if (searchTerm) params.search = searchTerm;
    if (selectedUserType !== '_empty_' && selectedUserType !== 'all') params.user_type = selectedUserType;

    router.get(route('users.all-logs'), params, { preserveState: true, preserveScroll: true });
  };
  
  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    
    switch (action) {
      case 'view':
        setIsViewModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
    }
  };

  const handleDeleteConfirm = () => {
    router.delete(route('login-history.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to delete login history: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUserType('_empty_');
    setShowFilters(false);

    router.get(route('users.all-logs'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      applyFilters();
    }
  }, [selectedUserType]);

  // Define table actions
  const actions = [
    { 
      label: t('View'), 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500'
    },
    ...(hasPermission(permissions, 'delete-login-history') || auth?.user?.type === 'superadmin' || auth?.user?.type === 'company' ? [{ 
      label: t('Delete'), 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500'
    }] : [])
  ];

  // Define table columns
  const columns = [
    { 
      key: 'user.name', 
      label: t('User'),
      render: (_: any, row: any) => {
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={row.user?.avatar} />
                <AvatarFallback>
                  <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={row.user?.name}/>
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{row.user?.name}</div>
                <div className="text-sm text-muted-foreground">{row.user?.email}</div>
              </div>
            </div>
          );
        }
    },
    { 
      key: 'user.type', 
      label: t('User Type'),
      render: (_: any, row: any) => {
        const userType = row.user?.type || '-';
        return userType.charAt(0).toUpperCase() + userType.slice(1);
      }
    },
    { 
      key: 'ip', 
      label: t('IP Address'),
      sortable: true,
      render: (_: any, row: any) => row.ip || '::1'
    },
    { 
      key: 'created_at', 
      label: t('Login Date'),
      sortable: true,
      type: 'date',
      // render: (_: any, row: any) => {
      //   const date = row.created_at ? new Date(row.created_at) : null;
      //   return date ? (window.appSettings?.formatDateTime(date,false) || date.toLocaleString()) : '-';
      // }
    },
    {
      key: 'details',
      label: t('Details'),
      render: (_: any, row: any) => {
        let details = row.details || {};
        if (typeof details === 'string') {
          try {
            details = JSON.parse(details);
          } catch (e) {
            details = {};
          }
        }
        return (
          <div className="text-xs">
            <div>{details.browser || details.browser_name || '-'}</div>
            <div className="text-gray-500">{details.os || details.os_name || '-'}</div>
            <div className="text-gray-500">{details.device || details.device_type || '-'}</div>
          </div>
        );
      }
    }
  ];

  const pageActions = [
    {
      label: t('Back'),
      onClick: () => {
        if (auth?.user?.type === 'superadmin') {
          router.get(route('companies.index'));
        } else {
          router.get(route('users.index'));
        }
      },
      variant: 'outline',
      icon: <ArrowLeft className="h-4 w-4" />
    }
  ];

  return (
    <PageTemplate
      title={t("User Logs")}
      url="/login-history"
      breadcrumbs={breadcrumbs}
      noPadding
      actions={pageActions}
      description={t('Track all user login activities and system access.')}
    >

      {/* Search and filters section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            // {
            //   name: 'user_type',
            //   label: t('User Type'),
            //   type: 'select',
            //   value: selectedUserType,
            //   onChange: (val) => setSelectedUserType(val),
            //   options: [
            //     { value: '_empty_', label: t('All Types') },
            //     ...(userTypes || []).map((type: string) => ({
            //       value: type,
            //       label: type.charAt(0).toUpperCase() + type.slice(1)
            //     }))
            //   ]
            // }
          ]}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={loginHistories?.data || []}
          from={loginHistories?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{}}
        />

        {/* Pagination section */}
        <Pagination
          from={loginHistories?.from || 0}
          to={loginHistories?.to || 0}
          total={loginHistories?.total || 0}
          links={loginHistories?.links}
          entityName={t("login records")}
          onPageChange={(url) => {
              const urlObj = new URL(url, window.location.origin);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
              if (pageFilters.user_type && pageFilters.user_type !== 'all' && pageFilters.user_type !== '_empty_') {
                urlObj.searchParams.set('user_type', pageFilters.user_type);
              } else {
                urlObj.searchParams.delete('user_type');
              }
              if (pageFilters.sort_field) urlObj.searchParams.set('sort_field', pageFilters.sort_field);
              if (pageFilters.sort_direction) urlObj.searchParams.set('sort_direction', pageFilters.sort_direction);
              router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
          }}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            const params: any = { page: 1, per_page: parseInt(value) };
            if (searchTerm) params.search = searchTerm;
            if (selectedUserType !== '_empty_' && selectedUserType !== 'all') params.user_type = selectedUserType;
            if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
            if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

            router.get(route('users.all-logs'), params, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`${currentItem?.user?.name || ''}`}
        entityName={t('login history')}
      />

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl max-h-[90vh] p-0 rounded-lg overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-lg font-semibold text-foreground truncate">{t('Login Details')}</DialogTitle>
            </div>
          </DialogHeader>

          {currentItem && (() => {
            let details: Record<string, any> = {};
            try {
              details = typeof currentItem.details === 'string' ? JSON.parse(currentItem.details) : (currentItem.details || {});
            } catch { details = {}; }

            const iconMap: Record<string, any> = {
              browser: Monitor, browser_name: Monitor,
              os: Cpu, os_name: Cpu,
              device: Smartphone, device_type: Smartphone,
              country: MapPin, city: MapPin,
              timezone: Clock,
              isp: Wifi,
              org: Building2, organization: Building2,
              referrer_host: Link, referer_host: Link,
              referrer_path: Link, referer_path: Link,
            };

            const labelMap: Record<string, string> = {
              browser: t('Browser'), browser_name: t('Browser'),
              os: t('Operating System'), os_name: t('Operating System'),
              device: t('Device Type'), device_type: t('Device Type'),
              country: t('Country'), city: t('City'),
              timezone: t('Timezone'),
              isp: t('ISP'),
              org: t('Organization'), organization: t('Organization'),
              referrer_host: t('Referrer Host'), referer_host: t('Referrer Host'),
              referrer_path: t('Referrer Path'), referer_path: t('Referrer Path'),
            };

            const Field = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
              <div className="min-w-0">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </label>
                <p className="text-sm font-medium text-foreground break-all">{value || '-'}</p>
              </div>
            );

            return (
              <div className="max-h-[75vh] overflow-y-auto px-6 py-4 space-y-4">
                {/* Fixed fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={User}  label={t('User Name')}  value={currentItem.user?.name} />
                  <Field icon={Mail}  label={t('Email')}      value={currentItem.user?.email} />
                  <Field icon={Clock} label={t('Login Time')} value={currentItem.created_at ? (window.appSettings?.formatDateTime(currentItem.created_at) || new Date(currentItem.created_at).toLocaleString()) : '-'} />
                  <Field icon={Globe} label={t('IP Address')} value={currentItem.ip || '::1'} />
                </div>

                {/* Dynamic details fields */}
                {Object.keys(details).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {Object.entries(details).map(([key, value]) => {
                      const Icon = iconMap[key] || Globe;
                      const label = labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                      return <Field key={key} icon={Icon} label={label} value={String(value ?? '')} />;
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}

