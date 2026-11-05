import { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { PageTemplate } from '@/components/page-template'
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar'
import { CrudTable } from '@/components/CrudTable'
import { Pagination } from '@/components/ui/pagination'
import { useTranslation } from 'react-i18next'

interface EmailTemplate {
  id: number
  name: string
  from: string
  created_at: string
  email_template_langs: Array<{
    id: number
    lang: string
    subject: string
  }>
}

interface Props {
  templates: {
    data: EmailTemplate[]
    from: number
    to: number
    total: number
    links: Array<{
      url: string | null
      label: string
      active: boolean
    }>
  }
  filters: {
    search?: string
    sort_field?: string
    sort_direction?: string
    per_page?: number
  }
}

export default function EmailTemplatesIndex({ templates, filters: pageFilters = {} }: Props) {
  const { t } = useTranslation()
  const { auth } = usePage().props as any
  const permissions = auth?.permissions || []
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '')

  const handleAction = (action: string, item: EmailTemplate) => {
    if (action === 'view') {
      router.visit(route('email-templates.show', item.id))
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

    router.get(route('email-templates.index'), params, { preserveState: true, preserveScroll: true })
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

    router.get(route('email-templates.index'), params, { preserveState: true, preserveScroll: true })
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

    router.get(route('email-templates.index'), params, { preserveState: true, preserveScroll: true })
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

    router.get(route('email-templates.index'), params, { preserveState: true, preserveScroll: true })
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Email Templates') },
  ]

  const columns = [
    {
      key: 'name',
      label: t('Name'),
      sortable: true,
      render: (value: any) => <span className="font-semibold">{value || '-'}</span>,
    },
  ]

  const actions = [
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500 hover:text-blue-700',
      href: (row: any) => route('email-templates.show', row.id),
    },
  ]

  return (
    <PageTemplate
      title={t('Email Templates')}
      description={t("Manage your email templates.")}
      url="/email-templates"
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <Head title={t('Email Templates')} />

      {/* Search and filters section */}
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
          data={templates?.data || []}
          from={templates?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction as 'asc' | 'desc' | undefined}
          onSort={handleSort}
          permissions={permissions}
        />

        {/* Pagination section */}
        <Pagination
          from={templates?.from || 0}
          to={templates?.to || 0}
          total={templates?.total || 0}
          links={templates?.links}
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