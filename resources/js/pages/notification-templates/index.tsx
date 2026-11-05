import { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { PageTemplate } from '@/components/page-template'
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar'
import { CrudTable } from '@/components/CrudTable'
import { Pagination } from '@/components/ui/pagination'
import BadgeUI from '@/components/badge-ui'
import { useTranslation } from 'react-i18next'

interface NotificationTemplate {
    id: number
    type: string
    action: string
    status: 'on' | 'off'
    template_langs: Array<{
        id: number
        lang: string
        content: string
    }>
}

interface Props {
    notifications: {
        data: NotificationTemplate[]
        from: number
        to: number
        total: number
        links: Array<{
            url: string | null
            label: string
            active: boolean
        }>
    } | NotificationTemplate[]
    filters?: {
        search?: string
        sort_field?: string
        sort_direction?: string
        per_page?: number
    }
}

export default function NotificationTemplatesIndex({ notifications, filters: pageFilters = {} }: Props) {
    const { t } = useTranslation()
    const { auth } = usePage().props as any
    const permissions = auth?.permissions || []

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '')

    // Handle paginated or array fallback gracefully
    const isPaginated = !Array.isArray(notifications) && notifications?.data !== undefined
    const items = isPaginated ? notifications.data : (Array.isArray(notifications) ? notifications : [])
    const from = isPaginated ? (notifications.from || 0) : 1
    const to = isPaginated ? (notifications.to || 0) : items.length
    const total = isPaginated ? (notifications.total || 0) : items.length
    const links = isPaginated ? notifications.links : []

    const handleAction = (action: string, item: NotificationTemplate) => {
        if (action === 'view') {
            router.visit(route('notification-templates.show', item.id))
        }
    }

    const applyFilters = (newSearch = searchTerm, perPage = pageFilters.per_page || 10) => {
        const params: any = { page: 1 }

        if (newSearch) {
            params.search = newSearch
        }

        if (perPage) {
            params.per_page = perPage
        }

        if (pageFilters.sort_field) {
            params.sort_field = pageFilters.sort_field
        }

        if (pageFilters.sort_direction) {
            params.sort_direction = pageFilters.sort_direction
        }

        router.get(route('notification-templates.index'), params, { preserveState: true, preserveScroll: true })
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        applyFilters(searchTerm)
    }

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc'

        const params: any = {
            sort_field: field,
            sort_direction: direction,
            page: 1,
        }

        if (searchTerm) {
            params.search = searchTerm
        }

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page
        }

        router.get(route('notification-templates.index'), params, { preserveState: true, preserveScroll: true })
    }

    const handlePageChange = (url: string) => {
        const pageNum = new URL(url).searchParams.get('page') || '1'
        const params: any = {
            page: pageNum,
        }

        if (searchTerm) {
            params.search = searchTerm
        }

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page
        }

        if (pageFilters.sort_field) {
            params.sort_field = pageFilters.sort_field
        }

        if (pageFilters.sort_direction) {
            params.sort_direction = pageFilters.sort_direction
        }

        router.get(route('notification-templates.index'), params, { preserveState: true, preserveScroll: true })
    }

    const handleResetFilters = () => {
        setSearchTerm('')

        const params: any = {
            page: 1,
            per_page: pageFilters.per_page,
        }

        if (pageFilters.sort_field) {
            params.sort_field = pageFilters.sort_field
        }

        if (pageFilters.sort_direction) {
            params.sort_direction = pageFilters.sort_direction
        }

        router.get(route('notification-templates.index'), params, { preserveState: true, preserveScroll: true })
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Notification Templates') },
    ]

    const columns = [
        {
            key: 'action',
            label: t('Template Name'),
            sortable: true,
            render: (value: any) => <span className="font-semibold">{value || '-'}</span>,
        },
        {
            key: 'status',
            label: t('Status'),
            sortable: true,
            render: (value: any) => (
                <BadgeUI
                    className={
                        value === 'on'
                            ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35'
                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35'
                    }
                >
                    {value === 'on' ? t('Active') : t('Inactive')}
                </BadgeUI>
            ),
        },
    ]

    const actions = [
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500 hover:text-blue-700',
            href: (row: any) => route('notification-templates.show', row.id),
        },
    ]

    return (
        <PageTemplate
            title={t('Notification Templates')}
            description={t("Manage your notifications templates.")}
            url="/notification-templates"
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Head title={t('Notification Templates')} />

            {/* Search section */}
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    searchPlaceholder={t('Search templates...')}
                    filters={[]}
                    hasActiveFilters={() => searchTerm !== ''}
                    activeFilterCount={() => (searchTerm ? 1 : 0)}
                    onResetFilters={handleResetFilters}
                />
            </div>

            {/* Content section */}
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={items}
                    from={from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={(pageFilters.sort_direction as 'asc' | 'desc') || 'asc'}
                    onSort={handleSort}
                    permissions={permissions}
                />

                {/* Pagination section */}
                <Pagination
                    from={from}
                    to={to}
                    total={total}
                    links={links}
                    entityName={t('templates')}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        applyFilters(searchTerm, parseInt(value))
                    }}
                    onPageChange={handlePageChange}
                />
            </div>
        </PageTemplate>
    )
}