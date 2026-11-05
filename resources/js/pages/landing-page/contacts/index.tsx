import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudTable } from '@/components/CrudTable';
import { Pagination } from '@/components/ui/pagination';
import UserInitials from '@/components/user-initials';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';

export default function ContactsIndex() {
  const { t } = useTranslation();
  const { contacts, filters: pageFilters = {}, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentContact, setCurrentContact] = useState<any>(null);
  
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
    
    router.get(route('landing-page.contacts.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm);
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
    
    router.get(route('landing-page.contacts.index'), params, { preserveState: true, preserveScroll: true });
  };
  
  const handleAction = (action: string, contact: any) => {
    setCurrentContact(contact);
    if (action === 'delete') {
      setIsDeleteModalOpen(true);
    } else if (action === 'view') {
      setShowViewDialog(true);
    }
  };
  
  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting contact...'));
    router.delete(route('landing-page.contacts.destroy', currentContact.id), {
      onSuccess: (page: any) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors: any) => {
        toast.dismiss();
        const errorMessage = (errors && Object.values(errors).join(', ')) || t('Failed to delete contact');
        toast.error(errorMessage);
      }
    });
  };

  const handleResetFilters = () => {
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

    router.get(route('landing-page.contacts.index'), params, { preserveState: true, preserveScroll: true });
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

    router.get(route('landing-page.contacts.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    window.location.href = route('landing-page.contacts.export') + '?' + params.toString();
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Landing Page'), href: route('landing-page') },
    { title: t('Contacts') }
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
      key: 'name', 
      label: t('Name'),
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <UserInitials name={row.name} />
          <div>
            <div className="font-semibold">{row.name}</div>
            <div className="text-sm text-muted-foreground">{row.email}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'subject', 
      label: t('Subject'),
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    { 
      key: 'created_at', 
      label: t('Date'),
      sortable: true,
      type: 'date',
      // render: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  const actions = [
    { 
      label: t('View'), 
      icon: 'Eye', 
      action: 'view', 
      className: 'text-blue-500 hover:text-blue-700'
    },
    { 
      label: t('Delete'), 
      icon: 'Trash2', 
      action: 'delete', 
      className: 'text-red-500 hover:text-red-700'
    }
  ];

  return (
    <PageTemplate 
      title={t("Contacts")} 
      description={t("Manage and review contact inquiries from users.")}
      url="/landing-page/contacts"
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
          searchPlaceholder={t("Search contacts...")}
          filters={[]}
          hasActiveFilters={() => searchTerm !== ''}
          activeFilterCount={() => searchTerm ? 1 : 0}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900">
        <CrudTable
          columns={columns}
          actions={actions}
          data={contacts?.data || []}
          from={contacts?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
        />

        {/* Pagination */}
        <Pagination
          from={contacts?.from || 0}
          to={contacts?.to || 0}
          total={contacts?.total || 0}
          links={contacts?.links}
          entityName={t("contacts")}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            applyFilters(searchTerm, parseInt(value));
          }}
          onPageChange={handlePageChange}
        />
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentContact?.name || ''}
        entityName={t("contact")}
      />

      {/* View Modal */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        {currentContact && <ViewPopup record={currentContact} />}
      </Dialog>
    </PageTemplate>
  );
}