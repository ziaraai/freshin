import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import BadgeUI from '@/components/badge-ui';
import { Plus } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';
import { Toaster } from '@/components/ui/toaster';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';

interface CustomPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export default function CustomPagesIndex() {
  const { t } = useTranslation();
  const { pages, filters: pageFilters = {}, auth, globalSettings } = usePage<any>().props;
  const permissions = auth?.permissions || [];
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<CustomPage | null>(null);

  const handleEdit = (page: CustomPage) => {
    router.get(route('landing-page.custom-pages.edit', page.id));
  };

  const handleDeleteClick = (page: CustomPage) => {
    setPageToDelete(page);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (pageToDelete) {
      if (!globalSettings?.is_demo) {
        toast.loading(t('Deleting page...'));
      }

      router.delete(route('landing-page.custom-pages.destroy', pageToDelete.id), {
        onSuccess: (res: any) => {
          setIsDeleteModalOpen(false);
          setPageToDelete(null);
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          if (res?.props?.flash?.success) {
            toast.success(t(res.props.flash.success));
          } else {
            toast.success(t('Custom page deleted successfully!'));
          }
        },
        onError: () => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
          }
          toast.error(t('Failed to delete page'));
        }
      });
    }
  };

  const applyFilters = (newSearch = searchTerm, perPage = pageFilters.per_page || 10) => {
    const params: any = { page: 1 };
    
    if (newSearch) {
      params.search = newSearch;
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
    
    router.get(route('landing-page.custom-pages.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm);
  };

  const handleResetFilters = () => {
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

    router.get(route('landing-page.custom-pages.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: CustomPage) => {
    if (action === 'edit') {
      handleEdit(item);
    } else if (action === 'delete') {
      handleDeleteClick(item);
    }
  };

  const handlePageChange = (url: string) => {
    const pageNum = new URL(url).searchParams.get('page') || '1';
    const params: any = {
      page: pageNum,
    };

    if (searchTerm) {
      params.search = searchTerm;
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

    router.get(route('landing-page.custom-pages.index'), params, { preserveState: true, preserveScroll: true });
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
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }
    router.get(route('landing-page.custom-pages.index'), params, { preserveState: true, preserveScroll: true });
  };

  const columns = [
    { 
      key: 'title', 
      label: t('Title'), 
      sortable: true,
      render: (value: string) => (
        <div className="font-medium">{value}</div>
      )
    },
    { 
      key: 'slug', 
      label: t('Slug'),
      render: (value: string) => (
        <div className="font-mono text-sm text-blue-600">
          /page/{value}
        </div>
      )
    },
    { 
      key: 'content', 
      label: t('Content'),
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value.replace(/<[^>]*>/g, '')}>
          {value.replace(/<[^>]*>/g, '').substring(0, 80)}...
        </div>
      )
    },
    { 
      key: 'is_active', 
      label: t('Status'),
      render: (value: boolean) => (
        <BadgeUI className={value ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35' : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35'}>
          {value ? t('Active') : t('Inactive')}
        </BadgeUI>
      )
    },
    { 
      key: 'created_at', 
      label: t('Created'), 
      sortable: true,
      type: 'date',
      // render: (value: string) => window.appSettings.formatDateTime(value,false)
    }
  ];

  const actions = [
    { 
      label: t('Edit'), 
      icon: 'Edit', 
      action: 'edit', 
      className: 'text-amber-500 hover:text-amber-700'
    },
    { 
      label: t('Delete'), 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500 hover:text-red-700'
    }
  ];

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Landing Page'), href: route('landing-page.settings') },
    { title: t('Custom Pages') }
  ];

  return (
    <PageTemplate 
      title={t('Custom Pages')}
      description={t("View and manage all plan requests from companies")}
      url="/landing-page/custom-pages"
      breadcrumbs={breadcrumbs}
      actions={[
        {
          label: t('Add Page'),
          icon: <Plus className="w-4 h-4" />,
          variant: 'default',
          onClick: () => router.get(route('landing-page.custom-pages.create'))
        }
      ]}
      noPadding
    >
      {/* Search section */}
      <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          searchPlaceholder={t('Search pages...')}
          filters={[]}
          hasActiveFilters={() => !!searchTerm}
          activeFilterCount={() => (searchTerm ? 1 : 0)}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Table section */}
      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900">
        <CrudTable
          columns={columns}
          actions={actions}
          data={pages?.data || []}
          from={pages?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
        />

        {/* Pagination section */}
        <Pagination
          from={pages?.from || 0}
          to={pages?.to || 0}
          total={pages?.total || 0}
          links={pages?.links}
          entityName={t("pages")}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            applyFilters(searchTerm, parseInt(value));
          }}
          onPageChange={handlePageChange}
        />
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPageToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={pageToDelete?.title || ''}
        entityName={t('Custom Page')}
      />

      <Toaster />
    </PageTemplate>
  );
}