// pages/currencies/index.tsx
import { useEffect, useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';
import BadgeUI from '@/components/badge-ui';

export default function Currencies() {
  const { t } = useTranslation();
  const { auth, currencies, currencys, filters: pageFilters = {}, globalSettings } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const currencyData = currencys || currencies;

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  const handlePageChange = (url: string) => {
    const pageNum = new URL(url).searchParams.get('page') || '1';
    const params: any = { page: pageNum };
    if (searchTerm) params.search = searchTerm;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;
    router.get(route('currencies.index'), params, { preserveState: true, preserveScroll: true });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '';
  };

  // Count active filters
  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;
    router.get(route('currencies.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    const params: any = { sort_field: field, sort_direction: direction, page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('currencies.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    switch (action) {
      case 'view':
        setIsViewModalOpen(true);
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
    }
  };

  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    const processedFormData = { ...formData };
    if (processedFormData.is_default === undefined) {
      processedFormData.is_default = false;
    }

    if (formMode === 'create') {
      if (!globalSettings?.is_demo) {
        toast.loading(t('Creating currency...'));
      }

      router.post(route('currencies.store'), processedFormData, {
        onSuccess: (page: any) => {
          setIsFormModalOpen(false);
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (page?.props?.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page?.props?.flash?.error) {
            toast.error(t(page.props.flash.error));
          } else {
            toast.success(t('Currency created successfully!'));
          }
        },
        onError: (errors) => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (typeof errors === 'string') {
            toast.error(t(errors));
          } else {
            toast.error(t('Failed to create currency: {{errors}}', { errors: Object.values(errors).join(', ') }));
          }
        }
      });
    } else if (formMode === 'edit') {
      if (!globalSettings?.is_demo) {
        toast.loading(t('Updating currency...'));
      }

      router.put(route('currencies.update', currentItem.id), processedFormData, {
        onSuccess: (page: any) => {
          setIsFormModalOpen(false);
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (page?.props?.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page?.props?.flash?.error) {
            toast.error(t(page.props.flash.error));
          } else {
            toast.success(t('Currency updated successfully!'));
          }
        },
        onError: (errors) => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (typeof errors === 'string') {
            toast.error(t(errors));
          } else {
            toast.error(t('Failed to update currency: {{errors}}', { errors: Object.values(errors).join(', ') }));
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!globalSettings?.is_demo) {
      toast.loading(t('Deleting currency...'));
    }

    router.delete(route('currencies.destroy', currentItem.id), {
      onSuccess: (page: any) => {
        setIsDeleteModalOpen(false);
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Currency deleted successfully!'));
        }
      },
      onError: (errors: any) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to delete currency: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    router.get(route('currencies.index'));
  };

  // Define page actions
  const pageActions = [];

  // Add the "Add New Currency" button if user has permission
  if (hasPermission(permissions, 'manage-currencies') || hasPermission(permissions, 'create-currencies')) {
    pageActions.push({
      label: t('Add Currency'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Currency') }
  ];

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: t('Name'),
      sortable: true
    },
    {
      key: 'code',
      label: t('Code'),
      sortable: true
    },
    {
      key: 'symbol',
      label: t('Symbol'),
      sortable: true
    },
    {
      key: 'is_default',
      label: t('Default'),
      render: (value: boolean) => (
        <BadgeUI className={`${
          value
            ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35'
            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35'
        }`}>
          {value ? t('Yes') : t('No')}
        </BadgeUI>
      )
    }
  ];

  // Define table actions
  const actions = [
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: hasPermission(permissions, 'manage-currencies') ? 'manage-currencies' : 'view-currencies'
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: hasPermission(permissions, 'manage-currencies') ? 'manage-currencies' : 'edit-currencies'
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: hasPermission(permissions, 'manage-currencies') ? 'manage-currencies' : 'delete-currencies',
      condition: (row: any) => !row.is_default
    }
  ];

  return (
    <PageTemplate
      title={t("Currency")}
      url="/currencies"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      description={t("Manage your currencies.")}
      noPadding
    >
      {/* Search and filters section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[]}
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
          data={currencyData?.data || []}
          from={currencyData?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: hasPermission(permissions, 'manage-currencies') ? 'manage-currencies' : 'view-currencies',
            create: hasPermission(permissions, 'manage-currencies') ? 'manage-currencies' : 'create-currencies',
            edit: hasPermission(permissions, 'manage-currencies') ? 'manage-currencies' : 'edit-currencies',
            delete: hasPermission(permissions, 'manage-currencies') ? 'manage-currencies' : 'delete-currencies'
          }}
        />

        {/* Pagination section */}
        <Pagination
          from={currencyData?.from || 0}
          to={currencyData?.to || 0}
          total={currencyData?.total || 0}
          links={currencyData?.links}
          entityName={t("currencies")}
          onPageChange={handlePageChange}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            const params: any = { page: 1, per_page: parseInt(value) };
            if (searchTerm) params.search = searchTerm;
            if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
            if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;
            router.get(route('currencies.index'), params, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {currentItem && <ViewPopup record={currentItem} />}
      </Dialog>

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            {
              name: 'name',
              label: t('Currency Name'),
              type: 'text',
              required: true,
              placeholder: t('e.g. US Dollar, Euro, British Pound')
            },
            {
              name: 'code',
              label: t('Currency Code'),
              type: 'text',
              required: true,
              placeholder: t('e.g. USD, EUR, GBP')
            },
            {
              name: 'symbol',
              label: t('Currency Symbol'),
              type: 'text',
              required: true,
              placeholder: t('e.g. $, €, £')
            },
            {
              name: 'description',
              label: t('Description'),
              type: 'textarea',
              placeholder: t('Enter currency description...')
            },
            {
              name: 'is_default',
              label: t('Set as Default Currency'),
              type: 'checkbox'
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? t('Add New Currency')
            : formMode === 'edit'
              ? t('Edit Currency')
              : t('View Currency')
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="currency"
      />
    </PageTemplate>
  );
}
