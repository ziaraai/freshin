import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import BadgeUI from '@/components/badge-ui';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/types/crud';
import { router, usePage } from '@inertiajs/react';
import { PlusIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayout } from '@/contexts/LayoutContext';

const useIsRtl = () => {
    try {
        const layout = useLayout();
        if (layout?.position === 'right' || (layout as any)?.effectivePosition === 'right' || layout?.isRtl) {
            return true;
        }
    } catch {
        // ignore
    }
    if (typeof document !== 'undefined') {
        return (
            document.documentElement.dir === 'rtl' ||
            document.documentElement.getAttribute('dir') === 'rtl' ||
            document.body?.getAttribute('dir') === 'rtl' ||
            Boolean(document.querySelector('[dir="rtl"]'))
        );
    }
    return false;
};

interface City {
    id: number;
    name: string;
    status: boolean;
    state: {
        id: number;
        name: string;
        country: {
            id: number;
            name: string;
        };
    };
    created_at: string;
}

interface Props {
    cities: {
        data: City[];
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

const EMPTY_INITIAL_DATA = {};

export default function Cities() {
    const { t } = useTranslation();
    const isRtl = useIsRtl();
    const { cities, countries, filters: pageFilters = {}, statusCounts } = usePage().props as unknown as Props;

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [currentCity, setCurrentCity] = useState<City | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cityToDelete, setCityToDelete] = useState<City | null>(null);

    // Cascading states
    const [states, setStates] = useState<any[]>([]);
    const [statesLoading, setStatesLoading] = useState(false);

    const cityInitialData = useMemo(() => {
        if (!currentCity) return EMPTY_INITIAL_DATA;
        return {
            ...currentCity,
            country_id: currentCity.state.country.id.toString(),
            state_id: currentCity.state.id.toString(),
        };
    }, [currentCity]);

    const fetchStates = useCallback(async (countryId: string | number) => {
        if (!countryId) {
            setStates([]);
            return;
        }
        setStatesLoading(true);
        try {
            const response = await fetch(route('api.locations.states', countryId));
            const data = await response.json();
            setStates(Array.isArray(data) ? data : data.states || []);
        } catch (error) {
            console.error('Failed to fetch states:', error);
            setStates([]);
        } finally {
            setStatesLoading(false);
        }
    }, []);

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

        router.get(route('cities.index'), params, { preserveState: true, preserveScroll: true });
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

        router.get(route('cities.index'), params, { preserveState: true, preserveScroll: true });
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

        router.get(route('cities.index'), params, { preserveState: true, preserveScroll: true });
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

        router.get(route('cities.index'), params, { preserveState: true, preserveScroll: true });
    };

    // Form handlers
    const handleAddNew = () => {
        setCurrentCity(null);
        setStates([]);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleAction = (action: string, item: City) => {
        if (action === 'edit') {
            fetchStates(item.state.country.id);
            setCurrentCity(item);
            setFormMode('edit');
            setIsFormModalOpen(true);
        } else if (action === 'delete') {
            setCityToDelete(item);
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
            router.post(route('cities.store'), processedFormData, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    toast.success(t('City created successfully!'));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(t(`Failed to create city: ${Object.values(errors).join(', ')}`));
                },
            });
        } else {
            toast.loading(t('Updating...'));
            router.put(route('cities.update', currentCity!.id), processedFormData, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    toast.success(t('City updated successfully!'));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(t(`Failed to update city: ${Object.values(errors).join(', ')}`));
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (cityToDelete) {
            toast.loading(t('Deleting...'));
            router.delete(route('cities.destroy', cityToDelete.id), {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setCityToDelete(null);
                    toast.dismiss();
                    toast.success(t('City deleted successfully!'));
                },
                onError: (errors: any) => {
                    toast.dismiss();
                    toast.error(errors?.error || t('Failed to delete city'));
                },
            });
        }
    };

    const pageActions = [
        {
            label: t('Add City'),
            icon: <PlusIcon className="h-4 w-4" />,
            variant: 'default' as const,
            onClick: handleAddNew,
        },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Location Management'), href: route('countries.index') },
        { title: t('Cities') },
    ];

    const cityFields: FormField[] = useMemo(
        () => [
            {
                name: 'country_id',
                label: t('Country'),
                type: 'select',
                required: true,
                render: (field, formData, onChange) => {
                    const selectedCountry = countries?.find((country: any) => country.id.toString() === String(formData.country_id || ''));
                    const selectedCountryName = selectedCountry?.name || (currentCity?.state?.country?.id?.toString() === String(formData.country_id) ? currentCity?.state?.country?.name : undefined);

                    return (
                        <Select
                            dir={isRtl ? 'rtl' : 'ltr'}
                            value={String(formData.country_id || '')}
                            onValueChange={(value) => {
                                onChange('country_id', value);
                                onChange('state_id', ''); // Reset state when country changes
                                fetchStates(value);
                            }}
                        >
                            <SelectTrigger dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : ''}>
                                <SelectValue placeholder={t('Select Country')}>
                                    {selectedCountryName}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent dir={isRtl ? 'rtl' : 'ltr'} className="z-[60000]">
                                {countries?.map((country: any) => (
                                    <SelectItem key={country.id} value={country.id.toString()}>
                                        {country.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );
                },
            },
            {
                name: 'state_id',
                label: t('State'),
                type: 'select',
                required: true,
                render: (field, formData, onChange) => {
                    const selectedState = states?.find((state: any) => state.id.toString() === String(formData.state_id || ''));
                    const selectedStateName = selectedState?.name || (currentCity?.state?.id?.toString() === String(formData.state_id) ? currentCity?.state?.name : undefined);

                    return (
                        <Select
                            dir={isRtl ? 'rtl' : 'ltr'}
                            value={String(formData.state_id || '')}
                            onValueChange={(value) => onChange('state_id', value)}
                            disabled={!formData.country_id || statesLoading}
                        >
                            <SelectTrigger dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : ''}>
                                <SelectValue placeholder={statesLoading ? t('Loading...') : t('Select State')}>
                                    {selectedStateName}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent dir={isRtl ? 'rtl' : 'ltr'} className="z-[60000]">
                                {states.map((state: any) => (
                                    <SelectItem key={state.id} value={state.id.toString()}>
                                        {state.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );
                },
            },
            { name: 'name', label: t('City Name'), type: 'text', required: true, placeholder: t('Enter city name') },
            { name: 'status', label: t('Status'), type: 'switch', defaultValue: true },
        ],
        [t, countries, states, statesLoading, fetchStates, isRtl, currentCity],
    );

    const cityFormConfig = useMemo(
        () => ({
            fields: cityFields,
            modalSize: 'md',
        }),
        [cityFields],
    );

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
            key: 'state',
            label: t('State'),
            sortable: false,
            render: (_: any, row: City) => row.state?.name || '-',
        },
        {
            key: 'country',
            label: t('Country'),
            sortable: false,
            render: (_: any, row: City) => row.state?.country?.name || '-',
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
        <PageTemplate title={t('Cities')} url="/cities" description={t("Manage cities for the system.")} actions={pageActions} breadcrumbs={breadcrumbs} noPadding>
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    searchPlaceholder={t('Search cities...')}
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
                    data={cities?.data || []}
                    from={cities?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={[]}
                />

                <Pagination
                    from={cities?.from || 0}
                    to={cities?.to || 0}
                    total={cities?.total || 0}
                    links={cities?.links}
                    entityName={t('cities')}
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
                formConfig={cityFormConfig}
                initialData={cityInitialData}
                title={formMode === 'create' ? t('Add City') : t('Edit City')}
                mode={formMode}
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={cityToDelete?.name || ''}
                entityName={t('City')}
            />
        </PageTemplate>
    );
}
