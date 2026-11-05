import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { LayoutGrid, CheckCircle2, XCircle, Download } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import BadgeUI from '@/components/badge-ui';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';
import { Pagination } from '@/components/ui/pagination';

export default function NewslettersIndex() {
  const { t } = useTranslation();
  const { newsletters, filters: pageFilters = {}, auth, stats = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(
    pageFilters.status && pageFilters.status !== 'all' ? pageFilters.status : '_empty_'
  );
  
  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentSubscriber, setCurrentSubscriber] = useState<any>(null);
  
  const hasActiveFilters = () => {
    return (selectedStatus && selectedStatus !== '_empty_') || searchTerm !== '';
  };
  
  const activeFilterCount = () => {
    return ((selectedStatus && selectedStatus !== '_empty_') ? 1 : 0) + (searchTerm ? 1 : 0);
  };
  
  const applyFilters = (newSearch = searchTerm, newStatus = selectedStatus, perPage = pageFilters.per_page || 10) => {
    const params: any = { page: 1 };
    
    if (newSearch) {
      params.search = newSearch;
    }
    
    if (newStatus && newStatus !== '_empty_') {
      params.status = newStatus;
    }
    
    if (perPage) {
      params.per_page = perPage;
    }

    if (pageFilters.sort_field) {
      params.sort_field = pageFilters.sort_field;
    }

    if (pageFilters.sort_direction) {
      params.sort_direction = pageFilters.sort_direction;
    }
    
    router.get(route('landing-page.subscribers.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedStatus);
  };
  
  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    applyFilters(searchTerm, value);
  };
  
  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    
    const params: any = { 
      sort_field: field, 
      sort_direction: direction, 
      page: 1 
    };
    
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    if (selectedStatus && selectedStatus !== '_empty_') {
      params.status = selectedStatus;
    }
    
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }
    
    router.get(route('landing-page.subscribers.index'), params, { preserveState: true, preserveScroll: true });
  };
  
  const handleAction = (action: string, subscriber: any) => {
    setCurrentSubscriber(subscriber);
    
    switch (action) {
      case 'toggle-status':
        handleToggleStatus(subscriber);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
    }
  };
  
  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting subscriber...'));
    
    router.delete(route("landing-page.subscribers.destroy", currentSubscriber.id), {
      onSuccess: (page: any) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        const errorMessage = Object.values(errors).join(', ') || t('Failed to delete subscriber');
        toast.error(errorMessage);
      }
    });
  };
  
  const handleToggleStatus = (subscriber: any) => {
    toast.loading(t('Updating status...'));
    
    router.put(route('landing-page.subscribers.update', subscriber.id), {
      status: subscriber.status === 'active' ? 'unsubscribed' : 'active'
    }, {
      onSuccess: () => {
        toast.dismiss();
        toast.success(t('Status updated successfully'));
      },
      onError: (errors) => {
        toast.dismiss();
        const errorMessage = Object.values(errors).join(', ') || t('Failed to update status');
        toast.error(errorMessage);
      }
    });
  };
  
  const handleResetFilters = () => {
    setSelectedStatus('_empty_');
    setSearchTerm('');
    
    const params: any = {
      page: 1,
      per_page: pageFilters.per_page
    };

    if (pageFilters.sort_field) {
      params.sort_field = pageFilters.sort_field;
    }

    if (pageFilters.sort_direction) {
      params.sort_direction = pageFilters.sort_direction;
    }

    router.get(route('landing-page.subscribers.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handlePageChange = (url: string) => {
    const pageNum = new URL(url).searchParams.get('page') || '1';
    const params: any = {
      page: pageNum,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedStatus && selectedStatus !== '_empty_') {
      params.status = selectedStatus;
    }

    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    if (pageFilters.sort_field) {
      params.sort_field = pageFilters.sort_field;
    }

    if (pageFilters.sort_direction) {
      params.sort_direction = pageFilters.sort_direction;
    }

    router.get(route('landing-page.subscribers.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedStatus && selectedStatus !== '_empty_') params.append('status', selectedStatus);
    window.location.href = route('landing-page.subscribers.export') + '?' + params.toString();
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Landing Page') },
    { title: t('Subscribers') }
  ];

  const pageActions = [
    {
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => handleExport()
    }
  ];

  const columns = [
    { 
      key: 'email', 
      label: t('Email'), 
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    { 
      key: 'status', 
      label: t('Status'),
      render: (value: string) => (
        <BadgeUI className={value === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35' : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35'}>
          {value === 'active' ? t('Subscribed') : t('Unsubscribed')}
        </BadgeUI>
      )
    },
    { 
      key: 'created_at', 
      label: t('Subscribed At'), 
      sortable: true,
      type: 'date',
      // render: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  const actions = [
    {
      label: t('Unsubscribe'),
      icon: 'XCircle',
      action: 'toggle-status',
      className: 'text-red-500 hover:text-red-700',
      condition: (row: any) => row.status === 'active'
    },
    {
      label: t('Reactivate'),
      icon: 'CheckCircle2',
      action: 'toggle-status',
      className: 'text-green-500 hover:text-green-700',
      condition: (row: any) => row.status !== 'active'
    },
    { 
      label: t('Delete'), 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500 hover:text-red-700'
    }
  ];

  const statusTabs = [
    { value: '_empty_', label: t('All'), icon: <LayoutGrid className="h-4 w-4" />, count: stats.all ?? 0 },
    { value: 'active', label: t('Subscribed'), icon: <CheckCircle2 className="h-4 w-4" />, count: stats.active ?? 0 },
    { value: 'unsubscribed', label: t('Unsubscribed'), icon: <XCircle className="h-4 w-4" />, count: stats.unsubscribed ?? 0 },
  ];

  return (
    <PageTemplate 
      title={t("Subscribers")} 
      description={t("Manage your newsletter subscriptions.")}
      url="/landing-page/newsletters"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      {/* Search and filters */}
      <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          searchPlaceholder={t("Search by email...")}
          statusTabs={statusTabs}
          activeStatusTab={selectedStatus}
          onStatusTabChange={handleStatusFilter}
          filters={[]}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900">
        <CrudTable
          columns={columns}
          actions={actions}
          data={newsletters?.data || []}
          from={newsletters?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
        />

        {/* Pagination */}
        <Pagination
          from={newsletters?.from || 0}
          to={newsletters?.to || 0}
          total={newsletters?.total || 0}
          links={newsletters?.links}
          entityName={t("subscribers")}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            applyFilters(searchTerm, selectedStatus, parseInt(value));
          }}
          onPageChange={handlePageChange}
        />
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentSubscriber?.email || ''}
        entityName={t("subscriber")}
      />
    </PageTemplate>
  );
}