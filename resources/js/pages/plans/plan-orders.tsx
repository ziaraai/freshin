import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { planOrdersConfig } from '@/config/crud/plan-orders';
import { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, LayoutGrid, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/utils/image-helper';
import { useInitials } from '@/hooks/use-initials';
import { toast } from '@/components/custom-toast';

import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ViewPopup from './view';
import BadgeUI from '@/components/badge-ui';

export default function PlanOrdersPage() {
  const { t } = useTranslation();
  const { planOrders, filters: pageFilters = {}, auth, statusCounts = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(
    pageFilters.status && pageFilters.status !== 'all' ? pageFilters.status : '_empty_'
  );
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const getInitials = useInitials();

  const applyFilters = (newSearch = searchTerm, newStatus = selectedStatus) => {
    const params: any = { page: 1 };
    
    if (newSearch) {
      params.search = newSearch;
    }
    
    if (newStatus !== '_empty_') {
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
    
    router.get(route("plan-orders.index"), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    if (action === 'approve') {
      router.post(route("plan-orders.approve", item.id), {}, {
        onSuccess: (page) => {
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors) => {
          toast.error(t('Failed to approve plan order'));
        }
      });
    } else if (action === 'reject') {
      setSelectedOrder(item);
      setShowRejectDialog(true);
    } else if (action === 'show') {
      setSelectedOrder(item);
      setShowViewDialog(true);
    }
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      router.post(route("plan-orders.reject", selectedOrder.id), { notes: rejectionNotes }, {
        onSuccess: (page) => {
          setShowRejectDialog(false);
          setSelectedOrder(null);
          setRejectionNotes('');
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors) => {
          toast.error(t('Failed to reject plan order'));
        }
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedStatus);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    applyFilters(searchTerm, value);
  };

  const handleResetFilters = () => {
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

    router.get(route('plan-orders.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handlePageChange = (url: string) => {
    const pageNum = new URL(url).searchParams.get('page') || '1';
    const params: any = {
      page: pageNum,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedStatus !== '_empty_') {
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

    router.get(route('plan-orders.index'), params, { preserveState: true, preserveScroll: true });
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

    if (selectedStatus !== '_empty_') {
      params.status = selectedStatus;
    }

    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    router.get(route('plan-orders.index'), params, { preserveState: true, preserveScroll: true });
  };

  const hasActiveFilters = () => {
    return selectedStatus !== '_empty_' || searchTerm !== '';
  };

  const activeFilterCount = () => {
    return (selectedStatus !== '_empty_' ? 1 : 0) + (searchTerm ? 1 : 0);
  };

  const statusTabs = [
    { value: '_empty_', label: t('All'), icon: <LayoutGrid className="h-4 w-4" />, count: statusCounts.all ?? 0 },
    { value: 'pending', label: t('Pending'), icon: <Clock className="h-4 w-4" />, count: statusCounts.pending ?? 0 },
    { value: 'approved', label: t('Approved'), icon: <CheckCircle2 className="h-4 w-4" />, count: statusCounts.approved ?? 0 },
    { value: 'rejected', label: t('Rejected'), icon: <XCircle className="h-4 w-4" />, count: statusCounts.rejected ?? 0 },
  ];

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Plans'), href: route('plans.index') },
    { title: t('Plan Orders') }
  ];

  const customColumns = planOrdersConfig.table.columns.map(col => {
    if (col.key === 'user.name') {
      return {
        ...col,
        label: t(col.label),
        render: (_, row) => {
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={row.user?.avatar} />
                <AvatarFallback><img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={row.user?.name} className="object-cover rounded-full" /></AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{row.user?.name || '-'}</div>
                <div className="text-xs text-gray-500">{row.user?.email || ''}</div>
              </div>
            </div>
          );
        }
      };
    } else if(col.key === 'order_number') {
      return {
        ...col,
        label: t(col.label),
        render: (_, row) => {
          return (
            <div className="flex items-center gap-3 text-nowrap">
              <span>{row.order_number || '-'}</span>
            </div>
          );
        }
      };
    } else if (col.key === 'plan.name') {
      return {
        ...col,
        label: t(col.label),
        render: (_, row) => {
          const planName = row.plan?.name;
          if (!planName) return '-';
          return (
          <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/35 capitalize">
              {planName}
            </BadgeUI>
          );
        }
      };
    } else if (col.key === 'status') {
      return {
        ...col,
        label: t(col.label),
        render: (value) => {
          const statusColors: Record<string, string> = {
            pending:   'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/15 dark:text-yellow-400 dark:ring-yellow-500/35',
            approved:  'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35',
            rejected:  'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35',
            completed: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/35',
          };
          return (
            <BadgeUI className={`capitalize ${statusColors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/10 dark:text-gray-400 dark:ring-gray-400/20'}`}>
              {t(value)}
            </BadgeUI>
          );
        }
      };
    } else if (col.key === 'receipt') {
      return {
        ...col,
        label: t(col.label),
        render: (value) => {
          if (!value) return '-';
          return (
            <a href={getImageUrl('/storage/' + value)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:text-primary-800">
              <FileText className="w-4 h-4" />
            </a>
          );
        }
      };
    } else if (col.key === 'original_price') {
      return {
        ...col,
        label: t(col.label),
        render: (value, row) => <span className='font-mono'>{row.formatted_original_price}</span>
      };
    } else if (col.key === 'final_price') {
      return {
        ...col,
        label: t(col.label),
        render: (value, row) => <span className='font-mono'>{row.formatted_final_price}</span>
      };
    } else if (col.key === 'discount_amount') {
      return {
        ...col,
        label: t(col.label),
        render: (value, row) => row.discount_amount > 0 ? <span className='font-mono'>{row.formatted_discount_amount}</span> : '-'
      };
    } else {
      return { ...col, label: t(col.label) };
    }
  });

  const isSuperAdmin = auth?.user?.type === 'superadmin' || auth?.user?.type === 'super admin';
  const filteredActions = (planOrdersConfig.table.actions || []).filter(action => {
    if (!isSuperAdmin) return false;
    if (isSuperAdmin) return true;
    if (action.action === 'show') return true;
    if (action.action === 'approve') return permissions.includes('approve-plan-orders');
    if (action.action === 'reject') return permissions.includes('reject-plan-orders');
    return false;
  }).map(action => ({
    ...action,
    label: t(action.label)
  }));

  return (
    <PageTemplate 
      title={t('Plan Orders')} 
      description={t("View and manage all plan orders from companies.")}
      url="/plan-orders"
      breadcrumbs={breadcrumbs}
      noPadding
    >
      {/* Search and filters section */}
      <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          searchPlaceholder={t('Search plan orders...')}
          statusTabs={statusTabs}
          activeStatusTab={selectedStatus}
          onStatusTabChange={handleStatusFilter}
          filters={[]}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
        />
      </div>

      <style>{`
        .plan-orders-table-container table {
          min-width: 100% !important;
        }
      `}</style>

      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900 plan-orders-table-container">
        <CrudTable
          columns={customColumns}
          actions={filteredActions}
          data={planOrders?.data || []}
          from={planOrders?.from || 1}
          onAction={handleAction}
          permissions={permissions}
          entityPermissions={planOrdersConfig.entity.permissions}
          onSort={handleSort}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
        />

        {/* Pagination section */}
        <Pagination
          from={planOrders?.from || 0}
          to={planOrders?.to || 0}
          total={planOrders?.total || 0}
          links={planOrders?.links}
          entityName={t("plan orders")}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            const params: any = {
              page: 1,
              per_page: parseInt(value),
            };

            if (searchTerm) {
              params.search = searchTerm;
            }

            if (selectedStatus !== '_empty_') {
              params.status = selectedStatus;
            }

            if (pageFilters.sort_field) {
              params.sort_field = pageFilters.sort_field;
            }

            if (pageFilters.sort_direction) {
              params.sort_direction = pageFilters.sort_direction;
            }

            router.get(route('plan-orders.index'), params, { preserveState: true, preserveScroll: true });
          }}
          onPageChange={handlePageChange}
        />
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Reject Plan Order')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4">
            <div>
              <Label htmlFor="notes">{t('Rejection Reason')}</Label>
              <Textarea
                id="notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder={t('Enter reason for rejection (optional)...')}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowRejectDialog(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" variant="destructive">
                {t('Reject Order')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        {selectedOrder && !showRejectDialog && <ViewPopup record={selectedOrder} />}
      </Dialog>
    </PageTemplate>
  );
}