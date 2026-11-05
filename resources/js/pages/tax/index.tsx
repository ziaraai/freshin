import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import {
  Calculator,
  Edit,
  Trash2,
  Search,
  X,
  Lock,
  Eye,
  Download,
  Percent,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import BadgeUI from '@/components/badge-ui';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission } from '@/utils/permissions';
import { useLayout } from '@/contexts/LayoutContext';

export default function Tax() {
  const { t } = useTranslation();
  const {
    taxes,
    stats = { total: 0, active: 0, averageRate: 0, collected: 0 },
    filters: pageFilters = {},
    auth,
    currencySymbol = '$'
  } = usePage().props as any;

  const {position} = useLayout();

  const canCreate = hasPermission('create-tax', auth);
  const canEdit = hasPermission('edit-tax', auth);
  const canDelete = hasPermission('delete-tax', auth);
  const canExport = hasPermission('export-tax', auth);
  const canView = hasPermission('view-tax', auth);

  // ── Tax List & Normalization ──────────────────────────────────────────
  const taxList: any[] = Array.isArray(taxes)
    ? taxes
    : (taxes?.data || []);

  // ── Filter State ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(pageFilters.status || 'all');
  const [typeFilter, setTypeFilter] = useState(pageFilters.type || 'all');

  // ── UI State ───────────────────────────────────────────────────────────────
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // ── Form State ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    type: 'percentage',
    priority: '1',
    compound: 'no',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      rate: '',
      type: 'percentage',
      priority: '1',
      compound: 'no',
      status: 'active'
    });
    setFormErrors({});
    setFormMode('create');
    setCurrentItem(null);
  };

  const loadItemForEdit = (item: any) => {
    setFormData({
      name: item.name || '',
      rate: item.rate !== undefined && item.rate !== null ? String(item.rate) : '',
      type: item.type || 'percentage',
      priority: item.priority !== undefined && item.priority !== null ? String(item.priority) : '1',
      compound: item.compound ? 'yes' : 'no',
      status: item.is_active ? 'active' : 'inactive',
    });
    setFormMode('edit');
    setCurrentItem(item);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = t('Tax name is required');
    } else if (formData.name.trim().length > 255) {
      errors.name = t('Name must not exceed 255 characters');
    }

    if (formData.rate === '' || formData.rate === null || formData.rate === undefined) {
      errors.rate = t('Tax rate is required');
    } else if (isNaN(Number(formData.rate)) || Number(formData.rate) < 0) {
      errors.rate = t('Please enter a valid rate');
    } else if (formData.type === 'percentage' && Number(formData.rate) > 100) {
      errors.rate = t('Percentage rate cannot exceed 100%');
    }

    if (!['percentage', 'fixed'].includes(formData.type)) {
      errors.type = t('Please select a valid tax type');
    }

    if (formData.priority && (isNaN(Number(formData.priority)) || Number(formData.priority) < 1)) {
      errors.priority = t('Priority must be at least 1');
    }

    if (!['active', 'inactive'].includes(formData.status)) {
      errors.status = t('Please select a valid status');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Filters / Sort / Pagination ────────────────────────────────────────────
  const applyFilters = (overrides: Record<string, any> = {}) => {
    router.get(
      route('tax.index'),
      {
        page: 1,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        per_page: pageFilters.per_page || 10,
        sort_field: pageFilters.sort_field || undefined,
        sort_direction: pageFilters.sort_direction || undefined,
        ...overrides,
      },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const currentSortField = pageFilters.sort_field || 'priority';
  const currentSortDirection = pageFilters.sort_direction || 'asc';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    router.get(
      route('tax.index'),
      {
        page: 1,
        per_page: pageFilters.per_page || 10,
        sort_field: 'priority',
        sort_direction: 'asc',
      },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleSort = (field: string) => {
    const direction =
      currentSortField === field && currentSortDirection === 'asc'
        ? 'desc'
        : 'asc';
    applyFilters({ sort_field: field, sort_direction: direction });
  };

  // ── Form Submit (Create / Update) ──────────────────────────────────────────
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitPayload = {
      name: formData.name.trim(),
      rate: Number(formData.rate),
      type: formData.type,
      priority: Number(formData.priority) || 1,
      compound: formData.compound === 'yes',
      is_active: formData.status === 'active',
    };

    if (formMode === 'create') {
      if (!canCreate) return;
      toast.loading(t('Creating tax rule...'));
      router.post(route('tax.store'), submitPayload, {
        preserveState: true,
        preserveScroll: true,
        onSuccess: (page: any) => {
          toast.dismiss();
          if (page?.props?.flash?.success) toast.success(t(page.props.flash.success));
          else toast.success(t('Tax rule created successfully'));
          resetForm();
        },
        onError: (errors: any) => {
          toast.dismiss();
          setFormErrors(errors);
          toast.error(t('Please check the form for errors'));
        },
      });
    } else {
      if (!canEdit) return;
      toast.loading(t('Updating tax rule...'));
      router.put(route('tax.update', currentItem.id), submitPayload, {
        preserveState: true,
        preserveScroll: true,
        onSuccess: (page: any) => {
          toast.dismiss();
          if (page?.props?.flash?.success) toast.success(t(page.props.flash.success));
          else toast.success(t('Tax rule updated successfully'));
          resetForm();
        },
        onError: (errors: any) => {
          toast.dismiss();
          setFormErrors(errors);
          toast.error(t('Please check the form for errors'));
        },
      });
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = () => {
    if (!itemToDelete || !canDelete) return;

    toast.loading(t('Deleting tax rule...'));
    router.delete(route('tax.destroy', itemToDelete.id), {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page: any) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page?.props?.flash?.success) toast.success(t(page.props.flash.success));
        else if (page?.props?.flash?.error) toast.error(t(page.props.flash.error));
        else toast.success(t('Tax rule deleted successfully'));

        if (currentItem?.id === itemToDelete.id) {
          resetForm();
        }
        setItemToDelete(null);
      },
      onError: (errors: any) => {
        toast.dismiss();
        toast.error(typeof errors === 'string' ? t(errors) : t('Failed to delete tax rule'));
      },
    });
  };

  // ── Toggle Status ──────────────────────────────────────────────────────────
  const handleToggleStatus = (item: any) => {
    if (!canEdit) return;

    const newStatus = !item.is_active;
    toast.loading(newStatus ? t('Activating tax rule...') : t('Deactivating tax rule...'));

    router.put(
      route('tax.toggle-status', item.id),
      {},
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: (page: any) => {
          toast.dismiss();
          if (page?.props?.flash?.success) toast.success(t(page.props.flash.success));
          else if (page?.props?.flash?.error) toast.error(t(page.props.flash.error));
          else toast.success(t('Tax rule status updated successfully'));
        },
        onError: (errors: any) => {
          toast.dismiss();
          toast.error(typeof errors === 'string' ? t(errors) : t('Failed to update status'));
        },
      }
    );
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Product Management'), href: route('products.index') },
    { title: t('Tax') },
  ];

  const isFilterActive =
    !!searchTerm ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    Boolean(pageFilters.sort_field && pageFilters.sort_field !== 'priority');

  const SortIcon = ({ field }: { field: string }) =>
    currentSortField === field ? (
      <span>{currentSortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
    ) : (
      <span className="opacity-40">↕</span>
    );

  const pageActions = [
    ...(canExport
      ? [
        {
          label: t('Export'),
          icon: <Download className="h-4 w-4" />,
          variant: 'outline' as const,
          onClick: () => window.open(route('tax.export'), '_blank'),
        },
      ]
      : []),
  ];

  return (
    <PageTemplate
      title={t('Tax')}
      description={t('Manage your store tax rules and configurations')}
      url="/tax"
      breadcrumbs={breadcrumbs}
      actions={pageActions}
      noPadding
    >
      <style>{`
        main { max-width: 100vw; overflow-x: clip !important; }
        body { overflow-x: clip !important; }
      `}</style>

      <div className="space-y-6">
        {/* ── KPI Stats Cards ──────────────────────────────────────────────── */}
        {/* <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t('Total Tax Rules')}</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calculator className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{stats.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('All tax rules')}</p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t('Active Rules')}</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Calculator className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{stats.active ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('{{percent}}% active rate', {
                percent: stats.total > 0 ? Math.round(((stats.active || 0) / stats.total) * 100) : 0,
              })}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t('Average Tax Rate')}</span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Calculator className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{stats.averageRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">{t('Across all rules')}</p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t('Tax Collected')}</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Calculator className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{formatCurrency(stats.collected ?? 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('This month')}</p>
          </div>
        </div> */}

        {/* ── Main Two-Column Layout (Matching categories/index.tsx) ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Form ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-4">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formMode === 'create' ? t('Add New Tax Rule') : t('Edit Tax Rule')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formMode === 'create'
                    ? t('Fill in the details to create a new tax rule')
                    : t('Update the tax rule details below')}
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                {/* Tax Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="required">
                    {t('Tax Name')}
                  </Label>
                  <Input
                    required
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('Enter tax name')}
                    className={formErrors.name ? 'border-red-500' : ''}
                    disabled={!canCreate && !canEdit}
                  />
                  {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                </div>

                {/* Tax Type & Tax Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="required">
                      {t('Tax Type')}
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      disabled={!canCreate && !canEdit}
                      dir={position === 'right' ? 'rtl' : 'ltr'}
                    >
                      <SelectTrigger className={formErrors.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('Select tax type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">{t('Percentage')}</SelectItem>
                        <SelectItem value="fixed">{t('Fixed Amount')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.type && <p className="text-sm text-red-500">{formErrors.type}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate" className="required">
                      {t('Tax Rate')} ({formData.type === 'percentage' ? '%' : (currencySymbol || '$')})
                    </Label>
                    <Input
                      required
                      id="rate"
                      name="rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.type === 'percentage' ? 100 : undefined}
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      placeholder="0.00"
                      className={formErrors.rate ? 'border-red-500' : ''}
                      disabled={!canCreate && !canEdit}
                    />
                    {formErrors.rate && <p className="text-sm text-red-500">{formErrors.rate}</p>}
                  </div>
                </div>

                {/* Priority & Compound Tax */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">
                      {t('Priority')}
                    </Label>
                    <Input
                      id="priority"
                      name="priority"
                      type="number"
                      min="1"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      placeholder="1"
                      className={formErrors.priority ? 'border-red-500' : ''}
                      disabled={!canCreate && !canEdit}
                    />
                    {formErrors.priority && <p className="text-sm text-red-500">{formErrors.priority}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compound">
                      {t('Compound Tax')}
                    </Label>
                    <Select
                      value={formData.compound}
                      onValueChange={(value) => setFormData({ ...formData, compound: value })}
                      disabled={!canCreate && !canEdit}
                      dir={position === 'right' ? 'rtl' : 'ltr'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select compound option')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">{t('No')}</SelectItem>
                        <SelectItem value="yes">{t('Yes')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="required">
                    {t('Tax Status')}
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={!canCreate && !canEdit}
                    dir={position === 'right' ? 'rtl' : 'ltr'}
                  >
                    <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}>
                      <SelectValue placeholder={t('Select status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('Active')}</SelectItem>
                      <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.status && <p className="text-sm text-red-500">{formErrors.status}</p>}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {formMode === 'create' ? (
                    canCreate && (
                      <Button type="submit" className="w-full">
                        {t('Add Tax Rule')}
                      </Button>
                    )
                  ) : (
                    <div className="flex items-center gap-3">
                      {canEdit && (
                        <Button type="submit" className="flex-1">
                          {t('Update Tax Rule')}
                        </Button>
                      )}
                      <Button type="button" variant="outline" onClick={resetForm}>
                        {t('Cancel')}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ── Right: Search, Filter & Table ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={t('Search tax rules...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch} variant="default">
                    {t('Search')}
                  </Button>
                  {isFilterActive && (
                    <Button onClick={handleResetFilters} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      {t('Reset')}
                    </Button>
                  )}
                </div>

                {/* Status & Type Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All Statuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All Statuses')}</SelectItem>
                      <SelectItem value="active">{t('Active')}</SelectItem>
                      <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={typeFilter}
                    onValueChange={(val) => {
                      setTypeFilter(val);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All Types')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All Types')}</SelectItem>
                      <SelectItem value="percentage">{t('Percentage')}</SelectItem>
                      <SelectItem value="fixed">{t('Fixed Amount')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {taxList.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr className="bg-[#F0F0F1] hover:bg-[#F0F0F1] dark:border-gray-900 dark:bg-gray-900 border-t">
                            <th
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider cursor-pointer select-none dark:bg-gray-900"
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center gap-1">
                                {t('Name')} <SortIcon field="name" />
                              </div>
                            </th>
                            <th
                              className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider cursor-pointer select-none dark:bg-gray-900"
                              onClick={() => handleSort('rate')}
                            >
                              <div className="flex items-center gap-1">
                                {t('Rate')} <SortIcon field="rate" />
                              </div>
                            </th>
                            <th
                              className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider cursor-pointer select-none dark:bg-gray-900"
                              onClick={() => handleSort('type')}
                            >
                              <div className="flex items-center gap-1">
                                {t('Type')} <SortIcon field="type" />
                              </div>
                            </th>
                            <th
                              className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider cursor-pointer select-none dark:bg-gray-900"
                              onClick={() => handleSort('priority')}
                            >
                              <div className="flex items-center gap-1">
                                {t('Priority')} <SortIcon field="priority" />
                              </div>
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider dark:bg-gray-900">
                              {t('Compound')}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider dark:bg-gray-900">
                              {t('Status')}
                            </th>
                            <th className="px-4 py-3 rtl:text-center text-right text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider dark:bg-gray-900 pr-[50px]">
                              {t('Actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {taxList.map((item: any) => (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              {/* Name with Icon */}
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rtl:ml-2">
                                    <Calculator className="h-5 w-5" />
                                  </div>
                                  <div className="ml-3 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
                                      {item.name}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Rate */}
                              <td className="px-3 py-4">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {item.type === 'fixed' ? currencySymbol : ''}{item.rate}{item.type === 'percentage' ? '%' : ''}
                                </span>
                              </td>

                              {/* Type */}
                              <td className="px-3 py-4">
                                <BadgeUI
                                  className={item.type === 'percentage'
                                    ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-400 capitalize'
                                    : 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-400 capitalize'
                                  }
                                >
                                  {item.type === 'percentage' ? t('Percentage') : t('Fixed')}
                                </BadgeUI>
                              </td>

                              {/* Priority */}
                              <td className="px-3 py-4">
                                <BadgeUI className="bg-gray-100 text-gray-700 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300 font-mono">
                                  {item.priority ?? 1}
                                </BadgeUI>
                              </td>

                              {/* Compound */}
                              <td className="px-3 py-4">
                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                  {item.compound ? t('Yes') : t('No')}
                                </span>
                              </td>

                              {/* Status using BadgeUI */}
                              <td className="px-3 py-4">
                                <BadgeUI
                                  className={item.is_active
                                    ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/40 dark:text-green-400'
                                    : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400'
                                  }
                                >
                                  {item.is_active ? t('Active') : t('Inactive')}
                                </BadgeUI>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  {canView && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.visit(route('tax.show', item.id))}
                                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t('View')}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}

                                  {canEdit && (
                                    <>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => loadItemForEdit(item)}
                                              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{t('Edit')}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleToggleStatus(item)}
                                              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                            >
                                              <Lock className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{item.is_active ? t('Deactivate') : t('Activate')}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </>
                                  )}

                                  {canDelete && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setItemToDelete(item);
                                              setIsDeleteModalOpen(true);
                                            }}
                                            className="h-8 w-8 p-0 text-gray-500"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t('Delete')}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4 p-4">
                    {taxList.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                              <Calculator className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.type === 'fixed' ? currencySymbol : ''}{item.rate}{item.type === 'percentage' ? '%' : ''} • {item.type === 'percentage' ? t('Percentage') : t('Fixed')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            {canView && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.visit(route('tax.show', item.id))}
                                className="h-8 w-8 p-0 text-gray-500"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {canEdit && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => loadItemForEdit(item)}
                                  className="h-8 w-8 p-0 text-gray-500"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStatus(item)}
                                  className="h-8 w-8 p-0 text-gray-500"
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setItemToDelete(item);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-gray-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Status')}</p>
                            <BadgeUI
                              className={item.is_active
                                ? 'bg-green-50 text-green-700 ring-green-600/20'
                                : 'bg-red-50 text-red-700 ring-red-600/20'
                              }
                            >
                              {item.is_active ? t('Active') : t('Inactive')}
                            </BadgeUI>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Priority')}</p>
                            <BadgeUI className="bg-gray-100 text-gray-700 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300 font-mono">
                              {item.priority ?? 1}
                            </BadgeUI>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Compound')}</p>
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              {item.compound ? t('Yes') : t('No')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {taxes && !Array.isArray(taxes) && taxes?.total > (taxes?.per_page || 10) && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <Pagination
                        from={taxes?.from || 0}
                        to={taxes?.to || 0}
                        total={taxes?.total || 0}
                        links={taxes?.links}
                        entityName={t('tax rules')}
                        hidePerPage
                        onPageChange={(url) => {
                          const page = new URL(url, window.location.origin).searchParams.get('page');
                          router.get(
                            route('tax.index'),
                            {
                              page,
                              per_page: pageFilters.per_page || 10,
                              search: searchTerm || undefined,
                              status: statusFilter !== 'all' ? statusFilter : undefined,
                              type: typeFilter !== 'all' ? typeFilter : undefined,
                              sort_field: pageFilters.sort_field || undefined,
                              sort_direction: pageFilters.sort_direction || undefined,
                            },
                            { preserveState: true, preserveScroll: true }
                          );
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <Calculator className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('No tax rules found')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    {isFilterActive
                      ? t('No tax rules match your search criteria. Try adjusting your filters.')
                      : t('Create tax rules to configure taxes for your store products.')}
                  </p>
                  {!isFilterActive && canCreate && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('Use the form on the left to add your first tax rule.')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name || ''}
        entityName={t('tax rule')}
      />
    </PageTemplate>
  );
}