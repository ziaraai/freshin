
import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { couponsConfig } from '@/config/crud/coupons';
import { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { PlusIcon, LayoutGrid, CheckCircle2, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/custom-toast';

const CopyableCodeCell = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleCopy}
        className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors font-mono text-sm cursor-pointer"
      >
        {value}
      </button>
      {copied && (
        <span className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium ml-3">
          {t('Copied!')}
        </span>
      )}
    </div>
  );
};

export default function CouponsPage() {
  const { t } = useTranslation();
  const { coupons, filters: pageFilters = {}, auth, statusCounts = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [config, setConfig] = useState(couponsConfig);
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedType, setSelectedType] = useState(
    pageFilters.type && pageFilters.type !== 'all' ? pageFilters.type : '_empty_'
  );
  const [selectedStatus, setSelectedStatus] = useState(
    pageFilters.status && pageFilters.status !== 'all' ? pageFilters.status : '_empty_'
  );
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  // Customize the config with translations and hooks
  useEffect(() => {
    setConfig({
      ...couponsConfig,
      table: {
        ...couponsConfig.table,
        actions: couponsConfig.table.actions.map(action => ({
          ...action,
          label: t(action.label)
        })),
        columns: couponsConfig.table.columns.map(col => {
          if (col.key === 'code') {
            return {
              ...col,
              label: t(col.label),
              render: (val: any) => <CopyableCodeCell value={val} />
            };
          }
          if (col.key === 'status') {
            return {
              ...col,
              label: t(col.label),
              render: (value: any, row: any) => (
                <div className="flex items-center justify-center">
                  <Switch
                    checked={!!value}
                    onCheckedChange={() => handleToggleStatus(row)}
                  />
                </div>
              )
            };
          }
          return {
            ...col,
            label: t(col.label)
          };
        })
      },
      form: {
        ...couponsConfig.form,
        fields: couponsConfig.form.fields.map(field => ({
          ...field,
          label: t(field.label),
          placeholder: field.placeholder ? t(field.placeholder) : undefined,
          options: field.options ? field.options.map(opt => ({
            ...opt,
            label: t(opt.label)
          })) : undefined
        }))
      },
      filters: couponsConfig.filters?.map(filter => ({
        ...filter,
        label: t(filter.label),
        options: filter.options ? filter.options.map(opt => ({
          ...opt,
          label: t(opt.label)
        })) : undefined
      })),
      hooks: {
        beforeCreate: (data: any) => {
          // Set default values
          if (!data.code_type) data.code_type = 'manual';
          if (data.status === undefined || data.status === null) data.status = true;
          // Ensure numeric fields are properly formatted
          if (data.minimum_spend) data.minimum_spend = parseFloat(data.minimum_spend);
          if (data.maximum_spend) data.maximum_spend = parseFloat(data.maximum_spend);
          if (data.discount_amount) data.discount_amount = parseFloat(data.discount_amount);
          if (data.use_limit_per_coupon) data.use_limit_per_coupon = parseInt(data.use_limit_per_coupon);
          if (data.use_limit_per_user) data.use_limit_per_user = parseInt(data.use_limit_per_user);
          return data;
        },
        beforeUpdate: (data: any) => {
          // Ensure boolean values are properly set
          if (data.status === undefined || data.status === null) data.status = true;
          // Ensure numeric fields are properly formatted
          if (data.minimum_spend) data.minimum_spend = parseFloat(data.minimum_spend);
          if (data.maximum_spend) data.maximum_spend = parseFloat(data.maximum_spend);
          if (data.discount_amount) data.discount_amount = parseFloat(data.discount_amount);
          if (data.use_limit_per_coupon) data.use_limit_per_coupon = parseInt(data.use_limit_per_coupon);
          if (data.use_limit_per_user) data.use_limit_per_user = parseInt(data.use_limit_per_user);
          return data;
        }
      } as any
    });
  }, [t]);

  const applyFilters = (newSearch = searchTerm, newType = selectedType, newStatus = selectedStatus) => {
    const params: any = { page: 1 };
    
    if (newSearch) {
      params.search = newSearch;
    }
    
    if (newType && newType !== '_empty_') {
      params.type = newType;
    }

    if (newStatus && newStatus !== '_empty_') {
      params.status = newStatus;
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
    
    router.get(route("coupons.index"), params, { preserveState: true, preserveScroll: true });
  };

  const handleToggleStatus = (coupon: any) => {
    router.put(
      route('coupons.toggle-status', coupon.id),
      {},
      {
        onSuccess: (page: any) => {
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors) => {
          toast.error(t('Error updating status'));
        }
      }
    );
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    
    switch (action) {
      case 'view-details':
      case 'view':
        router.get(route('coupons.show', item.id));
        break;
      case 'toggle-status':
        handleToggleStatus(item);
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    let processedFormData = { ...formData };
    
    if (formMode === 'create') {
      if ((config.hooks as any)?.beforeCreate) {
        processedFormData = (config.hooks as any).beforeCreate(processedFormData);
      }
      
      toast.loading(t('Creating...'));
      
      router.post(route('coupons.store'), processedFormData, {
        onSuccess: (page: any) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          }
          if (config.hooks?.afterCreate) {
            config.hooks.afterCreate(formData, page.props[config.entity.name]);
          }
        },
        onError: (errors) => {
          toast.dismiss();
          toast.error(t(`Failed to create coupon: ${Object.values(errors).join(', ')}`));
        }
      });
    } else if (formMode === 'edit') {
      if ((config.hooks as any)?.beforeUpdate) {
        processedFormData = (config.hooks as any).beforeUpdate(processedFormData);
      }
      
      toast.loading(t('Updating...'));
      
      router.put(route('coupons.update', currentItem.id), processedFormData, {
        onSuccess: (page: any) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          }
          if (config.hooks?.afterUpdate) {
            config.hooks.afterUpdate(formData, page.props[config.entity.name]);
          }
        },
        onError: (errors) => {
          toast.dismiss();
          toast.error(t(`Failed to update coupon: ${Object.values(errors).join(', ')}`));
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting...'));
    
    router.delete(route('coupons.destroy', currentItem.id), {
      onSuccess: (page: any) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
        if (config.hooks?.afterDelete) {
          config.hooks.afterDelete(currentItem.id);
        }
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(t(`Failed to delete coupon: ${Object.values(errors).join(', ')}`));
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedType, selectedStatus);
  };

  const handleResetFilters = () => {
    setSelectedType('_empty_');
    setSelectedStatus('_empty_');
    setSearchTerm('');
    
    const params: any = {
      page: 1,
      per_page: pageFilters.per_page,
    };

    if (pageFilters.sort_field) {
      params.sort_field = pageFilters.sort_field;
    }

    if (pageFilters.sort_direction) {
      params.sort_direction = pageFilters.sort_direction;
    }

    router.get(route('coupons.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    applyFilters(searchTerm, selectedType, value);
  };

  const handlePageChange = (url: string) => {
    const pageNum = new URL(url).searchParams.get('page') || '1';
    const params: any = {
      page: pageNum,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedType && selectedType !== '_empty_') {
      params.type = selectedType;
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

    router.get(route('coupons.index'), params, { preserveState: true, preserveScroll: true });
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

    if (selectedType && selectedType !== '_empty_') {
      params.type = selectedType;
    }

    if (selectedStatus && selectedStatus !== '_empty_') {
      params.status = selectedStatus;
    }

    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    router.get(route('coupons.index'), params, { preserveState: true, preserveScroll: true });
  };

  const hasActiveFilters = () => {
    return (selectedType && selectedType !== '_empty_') || (selectedStatus && selectedStatus !== '_empty_') || searchTerm !== '';
  };

  const activeFilterCount = () => {
    return ((selectedType && selectedType !== '_empty_') ? 1 : 0) + ((selectedStatus && selectedStatus !== '_empty_') ? 1 : 0) + (searchTerm ? 1 : 0);
  };

  const filterOptions = [
    {
      name: 'type',
      label: t('Type'),
      type: 'select' as const,
      options: [
        { value: '_empty_', label: t('All Types') },
        { value: 'percentage', label: t('Percentage') },
        { value: 'flat', label: t('Flat Amount') },
      ],
      value: selectedType,
      onChange: (value: string) => {
        setSelectedType(value);
        applyFilters(searchTerm, value, selectedStatus);
      },
    },
  ];

  const statusTabs = [
    { value: '_empty_', label: t('All'), icon: <LayoutGrid className="h-4 w-4" />, count: statusCounts.all ?? 0 },
    { value: '1', label: t('Active'), icon: <CheckCircle2 className="h-4 w-4" />, count: statusCounts.active ?? 0 },
    { value: '0', label: t('Inactive'), icon: <XCircle className="h-4 w-4" />, count: statusCounts.inactive ?? 0 },
  ];

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Coupons'), href: route('coupons.index') }
  ];

  const pageActions = [];
  if (permissions.includes(config.entity.permissions.create)) {
    pageActions.push({
      label: t('Add New Coupon'),
      icon: <PlusIcon className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: handleAddNew
    });
  }

  return (
    <PageTemplate 
      title={t('Coupons')} 
      description={t("Manage your coupons and discounts.")}
      url="/coupons"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      {/* Search and filters section */}
      <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          searchPlaceholder={t('Search coupons...')}
          statusTabs={statusTabs}
          activeStatusTab={selectedStatus}
          onStatusTabChange={handleStatusFilter}
          filters={filterOptions}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
        />
      </div>

      <style>{`
        .coupon-table-container table {
          min-width: 100% !important;
        }
      `}</style>

      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900 coupon-table-container">
        <CrudTable
          columns={config.table.columns}
          actions={config.table.actions}
          data={coupons?.data || []}
          from={coupons?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={config.entity.permissions}
        />

        {/* Pagination section */}
        <Pagination
          from={coupons?.from || 0}
          to={coupons?.to || 0}
          total={coupons?.total || 0}
          links={coupons?.links}
          entityName={t("coupons")}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            const params: any = {
              page: 1,
              per_page: parseInt(value),
            };

            if (searchTerm) {
              params.search = searchTerm;
            }

            if (selectedType && selectedType !== '_empty_') {
              params.type = selectedType;
            }

            if (selectedStatus && selectedStatus !== '_empty_') {
              params.status = selectedStatus;
            }

            if (pageFilters.sort_field) {
              params.sort_field = pageFilters.sort_field;
            }

            if (pageFilters.sort_direction) {
              params.sort_direction = pageFilters.sort_direction;
            }

            router.get(route('coupons.index'), params, { preserveState: true, preserveScroll: true });
          }}
          onPageChange={handlePageChange}
        />
      </div>

      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          ...config.form,
          modalSize: config.modalSize || config.form.modalSize
        }}
        initialData={currentItem}
        title={
          formMode === 'create' 
            ? t('Add New Coupon')
            : formMode === 'edit' 
              ? t('Edit Coupon')
              : t('View Coupon')
        }
        mode={formMode}
        description={config.description}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName={t('coupon')}
      />
    </PageTemplate>
  );
}