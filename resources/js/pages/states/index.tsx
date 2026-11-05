import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import BadgeUI from '@/components/badge-ui';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { FormField } from '@/types/crud';
import { router, usePage } from '@inertiajs/react';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface State {
    id: number;
    name: string;
    code: string;
    status: boolean;
    cities_count: number;
    country: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface Props {
    states: {
        data: State[];
        links: any[];
        meta: any;
        from: number;
        to: number;
        total: number;
    };
    countries: Array<{ id: number; name: string }>;
    filters: any;
    statusCounts: {
        all: number;
        active: number;
        inactive: number;
    };
}

export default function States() {
    const { t } = useTranslation();
    const { states, countries, filters: pageFilters = {}, statusCounts } = usePage().props as unknown as Props;

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [currentState, setCurrentState] = useState<State | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [stateToDelete, setStateToDelete] = useState<State | null>(null);

    const applyFilters = (newSearch = searchTerm, status = selectedStatus, perPage = pageFilters.per_page || 10) => {
        const params: any = { page: 1 };

        if (newSearch) {
            params.search = newSearch;
        }

        if (status && status !== 'all' && status !== '_empty_') {
            params.status = status;
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

        router.get(route('states.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(searchTerm);
    };

    const handleStatusFilter = (statusValue: string) => {
        const status = statusValue === '_empty_' ? 'all' : statusValue;
        setSelectedStatus(status);
        applyFilters(searchTerm, status);
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        const params: any = {
            sort_field: field,
            sort_direction: direction,
            page: 1,
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (selectedStatus && selectedStatus !== 'all') {
            params.status = selectedStatus;
        }

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(route('states.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handlePageChange = (url: string) => {
        const pageNum = new URL(url).searchParams.get('page') || '1';
        const params: any = {
            page: pageNum,
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (selectedStatus && selectedStatus !== 'all') {
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

        router.get(route('states.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');

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

        router.get(route('states.index'), params, { preserveState: true, preserveScroll: true });
    };

    // Form handlers
    const handleAddNew = () => {
        setCurrentState(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleAction = (action: string, item: State) => {
        if (action === 'edit') {
            setCurrentState(item);
            setFormMode('edit');
            setIsFormModalOpen(true);
        } else if (action === 'delete') {
            setStateToDelete(item);
            setIsDeleteModalOpen(true);
        }
    };

    const handleFormSubmit = (formData: any) => {
        let processedFormData = { ...formData };
        if (processedFormData.status === undefined) {
            processedFormData.status = false;
        }

        if (formMode === 'create') {
            toast.loading(t('Creating...'));
            router.post(route('states.store'), processedFormData, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    toast.success(t('State created successfully!'));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(t(`Failed to create state: ${Object.values(errors).join(', ')}`));
                },
            });
        } else {
            toast.loading(t('Updating...'));
            router.put(route('states.update', currentState!.id), processedFormData, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    toast.success(t('State updated successfully!'));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(t(`Failed to update state: ${Object.values(errors).join(', ')}`));
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (stateToDelete) {
            toast.loading(t('Deleting...'));
            router.delete(route('states.destroy', stateToDelete.id), {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setStateToDelete(null);
                    toast.dismiss();
                    toast.success(t('State deleted successfully!'));
                },
                onError: (errors: any) => {
                    toast.dismiss();
                    toast.error(errors?.error || t('Failed to delete state'));
                },
            });
        }
    };

    const pageActions = [
        {
            label: t('Add State'),
            icon: <PlusIcon className="h-4 w-4" />,
            variant: 'default' as const,
            onClick: handleAddNew,
        },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Location Management'), href: route('countries.index') },
        { title: t('States') },
    ];

    const stateFields: FormField[] = [
        {
            name: 'country_id',
            label: t('Country'),
            type: 'select',
            required: true,
            options: countries?.map((country: any) => ({ value: country.id.toString(), label: country.name })) || [],
        },
        { name: 'name', label: t('State Name'), type: 'text', required: true, placeholder: t('Enter state name') },
        { name: 'code', label: t('State Code'), type: 'text', required: false, placeholder: t('Enter state code') },
        { name: 'status', label: t('Status'), type: 'switch', defaultValue: true },
    ];

    const stateFormConfig = {
        fields: stateFields,
        modalSize: 'md',
    };

    // Status Filter tabs config
    const statusFilters = [
        {
            label: t('All'),
            value: '_empty_',
            count: statusCounts?.all || 0,
        },
        {
            label: t('Active'),
            value: '1',
            count: statusCounts?.active || 0,
        },
        {
            label: t('Inactive'),
            value: '0',
            count: statusCounts?.inactive || 0,
        },
    ];

    // CrudTable Columns config
    const tableColumns = [
        {
            key: 'name',
            label: t('Name'),
            sortable: true,
        },
        {
            key: 'code',
            label: t('Code'),
            sortable: true,
        },
        {
            key: 'country',
            label: t('Country'),
            sortable: false,
            render: (_: any, row: State) => row.country?.name || '-',
        },
        {
            key: 'cities_count',
            label: t('Cities'),
            sortable: true,
        },
        {
            key: 'status',
            label: t('Status'),
            sortable: true,
            render: (value: any) => (
                <BadgeUI className={value ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35' : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35'}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            ),
        },
    ];

    const tableActions = [
        {
            label: t('Edit'),
            icon: 'Edit' as const,
            action: 'edit',
            className: 'text-amber-500',
        },
        {
            label: t('Delete'),
            icon: 'Trash2' as const,
            action: 'delete',
            className: 'text-red-500',
        },
    ];

    // Form initial data mapping to match string select field inputs
    const stateInitialData = currentState
        ? {
              ...currentState,
              country_id: currentState.country?.id?.toString(),
          }
        : {};

    return (
        <PageTemplate title={t('States')} url="/states" description={t("Manage states for the system.")} actions={pageActions} breadcrumbs={breadcrumbs} noPadding>
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    searchPlaceholder={t('Search states...')}
                    filters={[]}
                    statusFilter={{
                        value: selectedStatus === 'all' ? '_empty_' : selectedStatus,
                        options: statusFilters,
                        onChange: handleStatusFilter,
                    }}
                    hasActiveFilters={() => selectedStatus !== 'all' || searchTerm !== ''}
                    activeFilterCount={() => (searchTerm ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0)}
                    onResetFilters={handleResetFilters}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    columns={tableColumns}
                    actions={tableActions}
                    data={states?.data || []}
                    from={states?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={[]}
                />

                <Pagination
                    from={states?.from || 0}
                    to={states?.to || 0}
                    total={states?.total || 0}
                    links={states?.links}
                    entityName={t('states')}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        applyFilters(searchTerm, selectedStatus, parseInt(value));
                    }}
                    onPageChange={handlePageChange}
                />
            </div>

            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={stateFormConfig}
                initialData={stateInitialData}
                title={formMode === 'create' ? t('Add State') : t('Edit State')}
                mode={formMode}
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={stateToDelete?.name || ''}
                entityName={t('State')}
            />
        </PageTemplate>
    );
}
