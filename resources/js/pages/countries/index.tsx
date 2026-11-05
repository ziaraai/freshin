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

interface Country {
    id: number;
    name: string;
    code: string;
    status: boolean;
    states_count: number;
    created_at: string;
}

interface Props {
    countries: {
        data: Country[];
        links: any[];
        meta: any;
        from: number;
        to: number;
        total: number;
    };
    filters: any;
    statusCounts: {
        all: number;
        active: number;
        inactive: number;
    };
}

export default function Countries() {
    const { t } = useTranslation();
    const { countries, filters: pageFilters = {}, statusCounts } = usePage().props as unknown as Props;

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [countryToDelete, setCountryToDelete] = useState<Country | null>(null);

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

        router.get(route('countries.index'), params, { preserveState: true, preserveScroll: true });
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

        router.get(route('countries.index'), params, { preserveState: true, preserveScroll: true });
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

        router.get(route('countries.index'), params, { preserveState: true, preserveScroll: true });
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

        router.get(route('countries.index'), params, { preserveState: true, preserveScroll: true });
    };

    // Form handlers
    const handleAddNew = () => {
        setCurrentCountry(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleAction = (action: string, item: Country) => {
        if (action === 'edit') {
            setCurrentCountry(item);
            setFormMode('edit');
            setIsFormModalOpen(true);
        } else if (action === 'delete') {
            setCountryToDelete(item);
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
            router.post(route('countries.store'), processedFormData, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    toast.success(t('Country created successfully!'));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(t(`Failed to create country: ${Object.values(errors).join(', ')}`));
                },
            });
        } else {
            toast.loading(t('Updating...'));
            router.put(route('countries.update', currentCountry!.id), processedFormData, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    toast.success(t('Country updated successfully!'));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(t(`Failed to update country: ${Object.values(errors).join(', ')}`));
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (countryToDelete) {
            toast.loading(t('Deleting...'));
            router.delete(route('countries.destroy', countryToDelete.id), {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setCountryToDelete(null);
                    toast.dismiss();
                    toast.success(t('Country deleted successfully!'));
                },
                onError: (errors: any) => {
                    toast.dismiss();
                    toast.error(errors?.error || t('Failed to delete country'));
                },
            });
        }
    };

    const pageActions = [
        {
            label: t('Add Country'),
            icon: <PlusIcon className="h-4 w-4" />,
            variant: 'default' as const,
            onClick: handleAddNew,
        },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Location Management'), href: route('countries.index') },
        { title: t('Countries') },
    ];

    const countryFields: FormField[] = [
        { name: 'name', label: t('Country Name'), type: 'text', required: true, placeholder: t('Enter country name') },
        { name: 'code', label: t('Country Code'), type: 'text', required: true, placeholder: t('Enter country code (e.g. US)') },
        { name: 'status', label: t('Status'), type: 'switch', defaultValue: true },
    ];

    const countryFormConfig = {
        fields: countryFields,
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
            key: 'states_count',
            label: t('States'),
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

    return (
        <PageTemplate title={t('Countries')} url="/countries" description={t("Manage countries for the system.")} actions={pageActions} breadcrumbs={breadcrumbs} noPadding>
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    searchPlaceholder={t('Search countries...')}
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
                    data={countries?.data || []}
                    from={countries?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={[]}
                />

                <Pagination
                    from={countries?.from || 0}
                    to={countries?.to || 0}
                    total={countries?.total || 0}
                    links={countries?.links}
                    entityName={t('countries')}
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
                formConfig={countryFormConfig}
                initialData={currentCountry || {}}
                title={formMode === 'create' ? t('Add Country') : t('Edit Country')}
                mode={formMode}
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={countryToDelete?.name || ''}
                entityName={t('Country')}
            />
        </PageTemplate>
    );
}
