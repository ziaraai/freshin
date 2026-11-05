import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { 
  Plus, 
  Download, 
  Users, 
  UserCheck, 
  UserPlus, 
  TrendingUp, 
  Mail, 
  Phone, 
  ShoppingBag, 
  Globe, 
  Crown, 
  Briefcase, 
  User, 
  UserX 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';
import { CrudTable } from '@/components/CrudTable';
import BadgeUI from '@/components/badge-ui';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/components/custom-toast';

export default function Customers() {
  const { t } = useTranslation();
  const { customers, stats = {}, auth } = usePage().props as any;

  // Helper for URL parameters
  const getUrlParam = (param: string, defaultValue: string = '') => {
    if (typeof window === 'undefined') return defaultValue;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || defaultValue;
  };

  // State Management
  const [searchTerm, setSearchTerm] = useState(() => getUrlParam('search', ''));
  const [selectedStatus, setSelectedStatus] = useState<string>(
    () => getUrlParam('status', 'all')
  );
  const [selectedGroup, setSelectedGroup] = useState<string>(
    () => getUrlParam('group', '_empty_')
  );
  const [currentPage, setCurrentPage] = useState(() => parseInt(getUrlParam('page', '1'), 10));
  const [perPage, setPerPage] = useState(() => parseInt(getUrlParam('per_page', '10'), 10));

  // Sorting
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);

  // Normalize customer data: supports array or paginated object
  const allCustomers: any[] = useMemo(() => {
    if (Array.isArray(customers)) return customers;
    if (customers?.data && Array.isArray(customers.data)) return customers.data;
    return [];
  }, [customers]);

  // Pre-filter by search and group
  const searchAndGroupFiltered = useMemo(() => {
    let list = [...allCustomers];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((c: any) => {
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const customFullName = (c.full_name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const group = (c.customer_group || 'regular').toLowerCase();
        const lang = (c.preferred_language || 'en').toLowerCase();
        const orders = String(c.total_orders ?? '');
        const spent = String(c.total_spent ?? '');

        return (
          fullName.includes(q) ||
          customFullName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          group.includes(q) ||
          lang.includes(q) ||
          orders.includes(q) ||
          spent.includes(q)
        );
      });
    }

    if (selectedGroup && selectedGroup !== '_empty_') {
      list = list.filter((c: any) => {
        const grp = (c.customer_group || 'regular').toLowerCase();
        return grp === String(selectedGroup).toLowerCase();
      });
    }

    return list;
  }, [allCustomers, searchTerm, selectedGroup]);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: searchAndGroupFiltered.length,
      active: searchAndGroupFiltered.filter((c: any) => Boolean(c.is_active)).length,
      inactive: searchAndGroupFiltered.filter((c: any) => !c.is_active).length,
    };
  }, [searchAndGroupFiltered]);

  // Apply status filter
  const filteredCustomers = useMemo(() => {
    let list = searchAndGroupFiltered;
    if (selectedStatus === 'active') {
      list = list.filter((c: any) => Boolean(c.is_active));
    } else if (selectedStatus === 'inactive') {
      list = list.filter((c: any) => !c.is_active);
    }
    return list;
  }, [searchAndGroupFiltered, selectedStatus]);

  // Multi-type sorting logic
  const sortedCustomers = useMemo(() => {
    const list = [...filteredCustomers];
    if (!sortField) return list;

    list.sort((a, b) => {
      // 1. Customer Name Sorting
      if (sortField === 'customer' || sortField === 'full_name' || sortField === 'name') {
        const nameA = (a.full_name || `${a.first_name || ''} ${a.last_name || ''}`).trim().toLowerCase();
        const nameB = (b.full_name || `${b.first_name || ''} ${b.last_name || ''}`).trim().toLowerCase();
        if (nameA < nameB) return sortDirection === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      // 2. Contact & Language Sorting
      if (sortField === 'contact') {
        const valA = (a.phone || a.email || a.preferred_language || '').toLowerCase();
        const valB = (b.phone || b.email || b.preferred_language || '').toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      // 3. Customer Group Sorting
      if (sortField === 'customer_group' || sortField === 'group') {
        const grpA = (a.customer_group || 'regular').toLowerCase();
        const grpB = (b.customer_group || 'regular').toLowerCase();
        if (grpA < grpB) return sortDirection === 'asc' ? -1 : 1;
        if (grpA > grpB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      // 4. Total Orders Sorting
      if (sortField === 'total_orders' || sortField === 'orders') {
        const countA = Number(a.total_orders ?? a.orders_count ?? 0);
        const countB = Number(b.total_orders ?? b.orders_count ?? 0);
        return sortDirection === 'asc' ? countA - countB : countB - countA;
      }

      // 5. Total Spent Sorting
      if (sortField === 'total_spent' || sortField === 'spent') {
        const spentA = parseFloat(a.total_spent ?? 0);
        const spentB = parseFloat(b.total_spent ?? 0);
        return sortDirection === 'asc' ? spentA - spentB : spentB - spentA;
      }

      // 6. Active Status Sorting
      if (sortField === 'is_active' || sortField === 'status') {
        const actA = a.is_active ? 1 : 0;
        const actB = b.is_active ? 1 : 0;
        return sortDirection === 'asc' ? actA - actB : actB - actA;
      }

      // 7. Joined Date Sorting
      if (sortField === 'created_at' || sortField === 'joined') {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      // Generic fallback
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (!isNaN(Number(aVal)) && !isNaN(Number(bVal)) && aVal !== '' && bVal !== '') {
        return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredCustomers, sortField, sortDirection]);

  // Client-side pagination calculations
  const total = sortedCustomers.length;
  const totalPages = Math.ceil(total / perPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const from = total > 0 ? (safeCurrentPage - 1) * perPage + 1 : 0;
  const to = Math.min(safeCurrentPage * perPage, total);

  const paginatedCustomers = useMemo(() => {
    const start = (safeCurrentPage - 1) * perPage;
    return sortedCustomers.slice(start, start + perPage);
  }, [sortedCustomers, safeCurrentPage, perPage]);

  // Generate pagination links
  const paginationLinks = useMemo(() => {
    const links: any[] = [];

    // Previous link
    links.push({
      url: safeCurrentPage > 1 ? `?page=${safeCurrentPage - 1}` : null,
      label: '&laquo; ' + t('Previous'),
      active: false,
    });

    // Page number links
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= safeCurrentPage - 2 && i <= safeCurrentPage + 2)
      ) {
        links.push({
          url: `?page=${i}`,
          label: i.toString(),
          active: i === safeCurrentPage,
        });
      } else if (
        (i === safeCurrentPage - 3 && i > 1) ||
        (i === safeCurrentPage + 3 && i < totalPages)
      ) {
        links.push({
          url: null,
          label: '...',
          active: false,
        });
      }
    }

    // Next link
    links.push({
      url: safeCurrentPage < totalPages ? `?page=${safeCurrentPage + 1}` : null,
      label: t('Next') + ' &raquo;',
      active: false,
    });

    return links;
  }, [safeCurrentPage, totalPages, t]);

  // Sync state to URL parameters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedGroup && selectedGroup !== '_empty_') params.set('group', selectedGroup);
      if (safeCurrentPage !== 1) params.set('page', safeCurrentPage.toString());
      if (perPage !== 10) params.set('per_page', perPage.toString());

      const newSearch = params.toString();
      const currentSearch = window.location.search.replace(/^\?/, '');
      if (newSearch !== currentSearch) {
        const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;
        window.history.replaceState(null, '', newUrl);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedStatus, selectedGroup, safeCurrentPage, perPage]);

  // Reset page when search or filters change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedGroup]);

  // Filter helpers
  const hasActiveFilters = () => {
    return (
      selectedStatus !== 'all' ||
      searchTerm !== '' ||
      (selectedGroup !== '_empty_' && selectedGroup !== '')
    );
  };

  const activeFilterCount = () => {
    return (
      (selectedStatus !== 'all' ? 1 : 0) +
      (searchTerm ? 1 : 0) +
      (selectedGroup !== '_empty_' && selectedGroup !== '' ? 1 : 0)
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleGroupFilter = (value: string) => {
    setSelectedGroup(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedGroup('_empty_');
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Action Handlers
  const handleActionClick = (actionName: string, permission: string, customer: any) => {
    if (!checkPermission(permission, auth)) return;

    if (actionName === 'view') {
      router.visit(route('customers.show', customer.id));
    } else if (actionName === 'edit') {
      router.visit(route('customers.edit', customer.id));
    } else if (actionName === 'delete') {
      setCustomerToDelete(customer);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (!customerToDelete) return;

    router.delete(route('customers.destroy', customerToDelete.id), {
      onSuccess: (page: any) => {
        setIsDeleteDialogOpen(false);
        setCustomerToDelete(null);
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors: any) => {
        const errorMessage = (errors && Object.values(errors).join(', ')) || t('Failed to delete customer');
        toast.error(errorMessage);
      }
    });
  };

  // Customer Group Styling Helper
  const renderCustomerGroupBadge = (group: string) => {
    const normalized = (group || 'regular').toLowerCase();
    switch (normalized) {
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Crown className="h-3 w-3" />
            {t('VIP')}
          </span>
        );
      case 'wholesale':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <Briefcase className="h-3 w-3" />
            {t('Wholesale')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
            <User className="h-3 w-3" />
            {t('Regular')}
          </span>
        );
    }
  };

  // CrudTable Columns Configuration
  const columns = [
    {
      key: 'customer',
      label: t('Customer'),
      sortable: true,
      render: (_: any, row: any) => {
        const fullName = row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || t('Unnamed Customer');
        const initials = row.initials || (fullName.charAt(0) || 'C').toUpperCase();
        const avatarSrc = row.avatar ? getImageUrl(row.avatar) : '';

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0 border border-zinc-200 dark:border-zinc-800">
              <AvatarImage src={avatarSrc} alt={fullName} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={fullName} className="object-cover rounded-full" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              {hasPermission('view-customers') ? (
                <a
                  href={route('customers.show', row.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    router.visit(route('customers.show', row.id));
                  }}
                  className="font-semibold text-sm text-zinc-900 hover:text-primary dark:text-white dark:hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-xs"
                  title={fullName}
                >
                  {fullName}
                </a>
              ) : (
                <span className="font-semibold text-sm text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                  {fullName}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{row.email || t('No email')}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'contact',
      label: t('Contact & Lang'),
      sortable: true,
      render: (_: any, row: any) => {
        return (
          <div className="flex flex-col text-xs space-y-1">
            {row.phone ? (
              <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                <span dir="ltr">{row.phone}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs italic">{t('No phone')}</span>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="uppercase text-[11px] font-medium tracking-wider">
                {row.preferred_language || 'EN'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'customer_group',
      label: t('Group'),
      sortable: true,
      render: (value: string) => renderCustomerGroupBadge(value),
    },
    {
      key: 'total_orders',
      label: t('Orders'),
      sortable: true,
      render: (value: number) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
          <ShoppingBag className="h-3 w-3 mr-1 text-muted-foreground rtl:mr-0 rtl:ml-1" />
          {value || 0}
        </span>
      ),
    },
    {
      key: 'total_spent',
      label: t('Total Spent'),
      sortable: true,
      render: (value: number) => (
        <span className="font-mono font-semibold text-sm text-zinc-900 dark:text-white">
          {formatCurrency(value || 0)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: t('Status'),
      sortable: true,
      render: (value: boolean) => (
        <BadgeUI
          className={
            value
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs'
              : 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20 font-medium text-xs'
          }
        >
          {value ? t('Active') : t('Inactive')}
        </BadgeUI>
      ),
    },
    {
      key: 'created_at',
      label: t('Joined'),
      sortable: true,
      type: 'date',
      // render: (value: string) => {
      //   if (!value) return '-';
      //   return (
      //     <span className="text-xs text-muted-foreground whitespace-nowrap">
      //       {window.appSettings?.formatDateTime(value,false)}
      //     </span>
      //   );
      // },
    },
  ];

  // CrudTable Actions
  const tableActions = [
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      color: 'primary',
      permission: 'view-customers',
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      color: 'secondary',
      permission: 'edit-customers',
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      color: 'destructive',
      permission: 'delete-customers',
    },
  ];

  // Status Tabs Configuration
  const statusTabs = [
    {
      value: 'all',
      label: t('All'),
      icon: <Users className="h-4 w-4" />,
      count: statusCounts.all,
    },
    {
      value: 'active',
      label: t('Active'),
      icon: <UserCheck className="h-4 w-4" />,
      count: statusCounts.active,
    },
    {
      value: 'inactive',
      label: t('Inactive'),
      icon: <UserX className="h-4 w-4" />,
      count: statusCounts.inactive,
    },
  ];

  // Group filter options
  const groupOptions = [
    { value: '_empty_', label: t('All Groups') },
    { value: 'regular', label: t('Regular') },
    { value: 'vip', label: t('VIP') },
    { value: 'wholesale', label: t('Wholesale') },
  ];

  // Page Header Actions
  const pageActions = [
    ...(hasPermission('export-customers') ? [{
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => window.open(route('customers.export'), '_blank'),
    }] : []),
    ...(hasPermission('create-customers') ? [{
      label: t('Create Customer'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => router.visit(route('customers.create')),
    }] : [])
  ];

  // Dynamic stats calculation
  const totalCustomersStat = stats.totalCustomers ?? allCustomers.length;
  const activeCustomersStat = stats.activeCustomers ?? allCustomers.filter((c: any) => c.is_active).length;
  const newThisMonthStat = stats.newThisMonth ?? 0;
  const avgOrderValueStat = stats.avgOrderValue ?? 0;

  return (
    <PageTemplate
      title={t('Customer Management')}
      url="/customers"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Customer Management') },
      ]}
      description={t('View, filter, manage customer profiles, addresses, and order histories.')}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* 1. TOP KPI STATS CARDS */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Customers */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Total Customers')}
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                  {totalCustomersStat}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {t('All registered profiles')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 2: Active Customers */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Active Customers')}
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                  {activeCustomersStat}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {t('{{percent}}% active rate', {
                      percent: totalCustomersStat > 0 
                        ? Math.round((activeCustomersStat / totalCustomersStat) * 100) 
                        : 0,
                    })}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 3: New This Month */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 dark:bg-amber-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('New This Month')}
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                  {newThisMonthStat}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {totalCustomersStat > 0
                      ? t('{{percent}}% monthly growth', {
                          percent: Math.round((newThisMonthStat / totalCustomersStat) * 100),
                        })
                      : t('Fresh sign-ups')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/40 sm:p-3">
                <UserPlus className="h-6 w-6 text-amber-600 dark:text-amber-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 4: Avg. Order Value */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Avg. Order Value')}
                </p>
                <p className="text-xl font-bold font-mono text-zinc-900 dark:text-white sm:text-2xl">
                  {formatCurrency(avgOrderValueStat)}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    {t('Revenue per order')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/40 sm:p-3">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. SEARCH, STATUS TABS & FILTER BAR */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
            searchPlaceholder={t('Search customers by name, email, phone...')}
            statusTabs={statusTabs}
            activeStatusTab={selectedStatus}
            onStatusTabChange={handleStatusFilter}
            filters={[
              {
                name: 'group',
                label: t('Customer Group'),
                type: 'select',
                value: selectedGroup,
                onChange: handleGroupFilter,
                options: groupOptions,
              },
            ]}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* 3. CUSTOMER DATA TABLE */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <CrudTable
            columns={columns}
            actions={tableActions}
            data={paginatedCustomers}
            from={from}
            onAction={(action: string, row: any) => handleActionClick(action, `${action}-customers`, row)}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            permissions={auth?.permissions || []}
            entityPermissions={{
              view: 'view-customers',
              edit: 'edit-customers',
              delete: 'delete-customers',
            }}
          />

          {/* 4. PAGINATION */}
          <Pagination
            from={from}
            to={to}
            total={total}
            links={paginationLinks}
            entityName={t('customers')}
            perPageOptions={[10, 25, 50, 100]}
            currentPerPage={perPage.toString()}
            onPerPageChange={(val) => {
              setPerPage(parseInt(val, 10));
              setCurrentPage(1);
            }}
            onPageChange={(url) => {
              if (!url) return;
              const match = url.match(/[?&]page=(\d+)/);
              if (match && match[1]) {
                setCurrentPage(parseInt(match[1], 10));
              }
            }}
          />
        </div>
      </div>

      {/* 5. CRUD DELETE MODAL */}
      <CrudDeleteModal
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        entityName={t('Customer')}
        itemName={customerToDelete ? (customerToDelete.full_name || `${customerToDelete.first_name || ''} ${customerToDelete.last_name || ''}`).trim() : ''}
      />
    </PageTemplate>
  );
}