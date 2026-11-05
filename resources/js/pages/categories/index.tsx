import React, { useState, useMemo, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import {
  Plus,
  Download,
  Folder,
  FolderTree,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Layers,
  Tag,
  GitFork,
  ArrowUpRight,
  Package,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  FolderPlus,
  CornerDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BadgeUI from '@/components/badge-ui';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Pagination } from '@/components/ui/pagination';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import { toast } from '@/components/custom-toast';
import { cn } from '@/lib/utils';

export default function Categories() {
  const { t } = useTranslation();
  const { categories = [], stats = { total: 0, active: 0, parent: 0, sub: 0 }, auth, globalSettings } = usePage().props as any;

  const permissions = auth?.permissions || [];
  const isSuperAdmin = auth?.user?.type === 'superadmin' || auth?.user?.type === 'super admin';
  const hasPermission = (permission: string): boolean => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  const rawCategories = useMemo(() => {
    return Array.isArray(categories) ? categories : (categories?.data || []);
  }, [categories]);

  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('_empty_');
  const [selectedParent, setSelectedParent] = useState<string>('_empty_');

  // Pagination state (paginates by Root categories)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Expanded root categories & subcategories state
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<number, boolean>>({});

  // Expand all by default on load
  useEffect(() => {
    const initialExpanded: Record<number, boolean> = {};
    const initialSubExpanded: Record<number, boolean> = {};
    rawCategories.forEach((cat: any) => {
      if (!cat.parent_id) {
        initialExpanded[cat.id] = true;
      } else {
        initialSubExpanded[cat.id] = true;
      }
    });
    setExpandedCategories(initialExpanded);
    setExpandedSubCategories(initialSubExpanded);
  }, [rawCategories]);

  const toggleExpand = (id: number) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSubExpand = (id: number) => {
    setExpandedSubCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    const allSubExpanded: Record<number, boolean> = {};
    rawCategories.forEach((cat: any) => {
      if (!cat.parent_id) {
        allExpanded[cat.id] = true;
      } else {
        allSubExpanded[cat.id] = true;
      }
    });
    setExpandedCategories(allExpanded);
    setExpandedSubCategories(allSubExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedCategories({});
    setExpandedSubCategories({});
  };

  // List of unique parent categories for filter dropdown
  const parentOptions = useMemo(() => {
    const parentIds = new Set(rawCategories.map((c: any) => c.parent_id).filter(Boolean));
    const parents = rawCategories.filter((c: any) => !c.parent_id || parentIds.has(c.id));
    return [
      { value: '_empty_', label: t('All Parent Categories') },
      ...parents.map((p: any) => ({ value: String(p.id), label: p.name })),
    ];
  }, [rawCategories, t]);

  // Construct filtered hierarchical tree with multi-level (root -> sub -> sub-sub)
  const categoryTreeData = useMemo(() => {
    const allRoots = rawCategories.filter((c: any) => !c.parent_id);
    const allSubs = rawCategories.filter((c: any) => !!c.parent_id);

    const matchesSearch = (item: any) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.slug?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    };

    const matchesStatus = (item: any) => {
      if (selectedStatus === 'all') return true;
      if (selectedStatus === 'active') return item.is_active;
      if (selectedStatus === 'inactive') return !item.is_active;
      return true;
    };

    const matchesLevel = (level: 'root' | 'sub' | 'subsub') => {
      if (selectedLevel === '_empty_') return true;
      if (selectedLevel === 'root') return level === 'root';
      if (selectedLevel === 'sub') return level === 'sub';
      if (selectedLevel === 'subsub') return level === 'subsub';
      return true;
    };

    const matchesParent = (item: any) => {
      if (!selectedParent || selectedParent === '_empty_') return true;
      return String(item.parent_id) === String(selectedParent);
    };

    const tree: any[] = [];

    allRoots.forEach((root: any) => {
      const rootMatchesSearch = matchesSearch(root);
      const rootMatchesStatus = matchesStatus(root);
      const rootMatchesLevel = matchesLevel('root');

      // Find children of this root (Level 2)
      const directChildren = allSubs.filter((sub: any) => sub.parent_id === root.id);

      const matchingChildren: any[] = [];

      directChildren.forEach((child: any) => {
        const childMatchesSearch = matchesSearch(child);
        const childMatchesStatus = matchesStatus(child);
        const childMatchesLevel = matchesLevel('sub');
        const childMatchesParent = matchesParent(child);

        // Find sub-sub children of this subcategory (Level 3)
        const subSubChildren = allSubs.filter((subsub: any) => subsub.parent_id === child.id);

        const matchingSubSubs = subSubChildren.filter((subsub: any) => {
          const subsubMatchesSearch = matchesSearch(subsub);
          const subsubMatchesStatus = matchesStatus(subsub);
          const subsubMatchesLevel = matchesLevel('subsub');
          const subsubMatchesParent = matchesParent(subsub);

          return subsubMatchesSearch && subsubMatchesStatus && subsubMatchesLevel && subsubMatchesParent;
        });

        const shouldIncludeChild =
          (childMatchesSearch && childMatchesStatus && childMatchesLevel && childMatchesParent) ||
          matchingSubSubs.length > 0;

        if (shouldIncludeChild) {
          matchingChildren.push({
            ...child,
            children: matchingSubSubs,
            hasDirectMatch: childMatchesSearch && childMatchesStatus && childMatchesLevel && childMatchesParent,
          });
        }
      });

      // Include this root if it matches or has matching children/grandchildren
      const shouldIncludeRoot =
        (rootMatchesSearch && rootMatchesStatus && rootMatchesLevel && (selectedParent === '_empty_' || !selectedParent)) ||
        matchingChildren.length > 0;

      if (shouldIncludeRoot) {
        tree.push({
          ...root,
          children: matchingChildren,
          hasDirectMatch: rootMatchesSearch && rootMatchesStatus && rootMatchesLevel,
        });
      }
    });

    // Check for orphan subcategories whose parent does not exist anywhere in the database
    const orphanSubs = allSubs.filter((sub: any) => {
      const parentExists = rawCategories.some((r: any) => r.id === sub.parent_id);
      return (
        !parentExists &&
        matchesSearch(sub) &&
        matchesStatus(sub) &&
        matchesParent(sub)
      );
    });

    const totalSubCount = tree.reduce((acc: number, item: any) => {
      const directSubs = item.children.length;
      const nestedSubSubs = item.children.reduce((subAcc: number, c: any) => subAcc + (c.children?.length || 0), 0);
      return acc + directSubs + nestedSubSubs;
    }, 0) + orphanSubs.length;

    return {
      tree,
      orphanSubs,
      totalRoots: tree.length,
      totalSubs: totalSubCount,
    };
  }, [rawCategories, searchTerm, selectedStatus, selectedLevel, selectedParent]);

  // Paginate by Root categories
  const totalRoots = categoryTreeData.tree.length;
  const totalPages = Math.ceil(totalRoots / perPage) || 1;
  const paginatedRoots = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return categoryTreeData.tree.slice(start, start + perPage);
  }, [categoryTreeData.tree, currentPage, perPage]);

  const from = totalRoots > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const to = Math.min(currentPage * perPage, totalRoots);

  // Pagination links structure
  const paginationLinks = useMemo(() => {
    const links = [];
    links.push({
      url: currentPage > 1 ? `?page=${currentPage - 1}` : null,
      label: '&laquo; ' + t('Previous'),
      active: false,
    });
    for (let p = 1; p <= totalPages; p++) {
      links.push({
        url: `?page=${p}`,
        label: p.toString(),
        active: p === currentPage,
      });
    }
    links.push({
      url: currentPage < totalPages ? `?page=${currentPage + 1}` : null,
      label: t('Next') + ' &raquo;',
      active: false,
    });
    return links;
  }, [currentPage, totalPages, t]);

  // Delete category handler
  const handleDeleteConfirm = () => {
    if (categoryToDelete && hasPermission('delete-categories')) {
      if (!globalSettings?.is_demo) {
        toast.loading(t('Deleting category...'));
      }

      router.delete(route('categories.destroy', categoryToDelete.id), {
        onSuccess: (page: any) => {
          setCategoryToDelete(null);
          if (!globalSettings?.is_demo) {
            toast.dismiss();
            if (page.props.flash?.success) {
              toast.success(t(page.props.flash.success));
            } else if (page.props.flash?.error) {
              toast.error(t(page.props.flash.error));
            } else {
              toast.success(t('Category deleted successfully'));
            }
          }
        },
        onError: () => {
          if (!globalSettings?.is_demo) {
            toast.dismiss();
            toast.error(t('Failed to delete category'));
          }
        },
      });
    }
  };

  // Status tabs configuration
  const statusTabs = [
    {
      value: 'all',
      label: t('All'),
      icon: <Layers className="h-4 w-4" />,
      count: stats.total || rawCategories.length,
    },
    {
      value: 'active',
      label: t('Active'),
      icon: <CheckCircle2 className="h-4 w-4" />,
      count: stats.active || 0,
    },
    {
      value: 'inactive',
      label: t('Inactive'),
      icon: <XCircle className="h-4 w-4" />,
      count: (stats.total || rawCategories.length) - (stats.active || 0),
    },
  ];

  // Secondary filters for SearchAndFilterBar
  const filterOptions = [
    {
      name: 'level',
      label: t('Category Level'),
      type: 'select' as const,
      options: [
        { value: '_empty_', label: t('All Levels') },
        { value: 'root', label: t('Root Categories') },
        { value: 'sub', label: t('Sub Categories') },
        { value: 'subsub', label: t('Sub-subcategories') },
      ],
      value: selectedLevel,
      onChange: (value: string) => {
        setSelectedLevel(value);
        setCurrentPage(1);
      },
    },
    {
      name: 'parent_id',
      label: t('Parent Category'),
      type: 'select' as const,
      options: parentOptions,
      value: selectedParent,
      onChange: (value: string) => {
        setSelectedParent(value);
        setCurrentPage(1);
      },
    },
  ];

  const hasActiveFilters = () => {
    return (
      searchTerm !== '' ||
      selectedStatus !== 'all' ||
      selectedLevel !== '_empty_' ||
      selectedParent !== '_empty_'
    );
  };

  const activeFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedStatus !== 'all') count++;
    if (selectedLevel !== '_empty_') count++;
    if (selectedParent !== '_empty_') count++;
    return count;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedLevel('_empty_');
    setSelectedParent('_empty_');
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Top Page Actions
  const pageActions = [];

  if (hasPermission('export-categories')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => window.open(route('categories.export'), '_blank'),
    });
  }

  if (hasPermission('create-categories')) {
    pageActions.push({
      label: t('Create Category'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => router.visit(route('categories.create')),
    });
  }

  const allAreExpanded = totalRoots > 0 && paginatedRoots.every((root: any) => expandedCategories[root.id]);

  return (
    <PageTemplate
      title={t('Categories')}
      description={t('Organize and manage your product catalog hierarchy with root, sub, and nested categories')}
      url="/categories"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Product Management'), href: route('products.index') },
        { title: t('Categories') },
      ]}
    >
      <div className="space-y-6">
        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Categories */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none dark:bg-blue-900/20" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Categories')}</p>
                <p className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">{stats.total || rawCategories.length}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('Complete store taxonomy')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 sm:p-3 dark:bg-blue-900/40">
                <FolderTree className="h-6 w-6 text-blue-600 sm:h-7 sm:w-7 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Card 2: Active Categories */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none dark:bg-emerald-950/20" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Active Categories')}</p>
                <p className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">{stats.active || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {rawCategories.length > 0
                      ? t('{{percent}}% active rate', {
                          percent: Math.round(((stats.active || 0) / rawCategories.length) * 100),
                        })
                      : t('No categories yet')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 sm:p-3 dark:bg-emerald-900/40">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Card 3: Root Categories */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-sky-50 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none dark:bg-sky-950/20" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Root Categories')}</p>
                <p className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">{stats.parent || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-sky-600 dark:text-sky-400">{t('Top-level navigation anchors')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-sky-100 p-2.5 sm:p-3 dark:bg-sky-900/40">
                <Layers className="h-6 w-6 text-sky-600 sm:h-7 sm:w-7 dark:text-sky-400" />
              </div>
            </div>
          </div>

          {/* Card 4: Subcategories */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none dark:bg-purple-950/20" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Subcategories')}</p>
                <p className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">{stats.sub || (rawCategories.length - (stats.parent || 0))}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{t('Nested child collections')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 sm:p-3 dark:bg-purple-900/40">
                <GitFork className="h-6 w-6 text-purple-600 sm:h-7 sm:w-7 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            onSearch={handleSearch}
            searchPlaceholder={t('Search categories by name, slug...')}
            statusTabs={statusTabs}
            activeStatusTab={selectedStatus}
            onStatusTabChange={(value: any) => {
              setSelectedStatus(value);
              setCurrentPage(1);
            }}
            filters={filterOptions}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Tree Controls & Summary Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderTree className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {t('Category Hierarchy Tree')}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-xs">
              {t('{{roots}} Root Categories, {{subs}} Sub & Nested Categories', {
                roots: categoryTreeData.totalRoots,
                subs: categoryTreeData.totalSubs,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={allAreExpanded ? handleCollapseAll : handleExpandAll}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              {allAreExpanded ? t('Collapse All') : t('Expand All')}
            </Button>
          </div>
        </div>

        {/* Main Tree Structure View */}
        <div className="space-y-4">
          {paginatedRoots.length > 0 ? (
            paginatedRoots.map((root: any) => {
              const isExpanded = !!expandedCategories[root.id];
              const hasChildren = root.children && root.children.length > 0;

              return (
                <div
                  key={root.id}
                  className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-sm"
                >
                  {/* Root Category Header Node */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 bg-card hover:bg-muted/20 transition-colors">
                    {/* Left: Expand Button, Thumbnail & Category Info */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Expand / Collapse Toggle Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(root.id)}
                        className="h-8 w-8 p-0 rounded-lg border border-border/80 bg-background hover:bg-accent shrink-0 text-muted-foreground hover:text-foreground"
                        title={isExpanded ? t('Collapse Subcategories') : t('Expand Subcategories')}
                      >
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 transition-transform duration-200 rtl:rotate-180',
                            isExpanded && 'rotate-90 rtl:rotate-90'
                          )}
                        />
                      </Button>

                      {/* Image Thumbnail */}
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/40 flex items-center justify-center shadow-2xs">
                        {root.image ? (
                          <img
                            src={getImageUrl(root.image)}
                            alt={root.name}
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                            <Layers className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Category Identity */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => router.visit(route('categories.show', root.id))}
                            className="text-base font-bold text-foreground hover:text-primary transition-colors text-left rtl:text-right truncate block"
                          >
                            {root.name}
                          </button>

                          <BadgeUI className="bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/30 dark:text-sky-300 font-medium gap-1.5">
                            <Layers className="h-3.5 w-3.5" />
                            {t('Root Category')}
                          </BadgeUI>

                          {hasChildren ? (
                            <BadgeUI className="bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/30 dark:text-purple-300 font-medium gap-1.5">
                              <GitFork className="h-3 w-3" />
                              {t('{{count}} Subcategories', { count: root.children.length })}
                            </BadgeUI>
                          ) : (
                            <BadgeUI className="bg-zinc-50 text-zinc-500 ring-zinc-500/20 dark:bg-zinc-800/60 dark:text-zinc-400 text-xs italic">
                              {t('No subcategories')}
                            </BadgeUI>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <BadgeUI className="font-mono bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400">
                            /{root.slug}
                          </BadgeUI>
                          {root.description && (
                            <span className="truncate max-w-xs text-muted-foreground/80 hidden md:inline">
                              • {root.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Metrics, Status & Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 ms-auto">
                      {/* Product Count Badge */}
                      <BadgeUI className="bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 gap-1.5 font-medium">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t('{{count}} Products', { count: root.products_count || 0 })}</span>
                      </BadgeUI>

                      {/* Sort Order */}
                      <BadgeUI
                        className="font-mono bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 hidden sm:inline-flex"
                        title={t('Display sort order')}
                      >
                        #{root.sort_order ?? 0}
                      </BadgeUI>

                      {/* Status Badge */}
                      <BadgeUI
                        className={
                          root.is_active
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium'
                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 font-medium'
                        }
                      >
                        {root.is_active ? t('Active') : t('Inactive')}
                      </BadgeUI>

                      {/* Add Subcategory Shortcut Button */}
                      {hasPermission('create-categories') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.visit(route('categories.create') + '?parent_id=' + root.id)}
                          className="h-8 gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t('Add Subcategory')}</span>
                        </Button>
                      )}

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-1 border-l border-border/70 pl-2 rtl:border-r rtl:border-l-0 rtl:pr-2 rtl:pl-0">
                        {hasPermission('view-categories') && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => router.visit(route('categories.show', root.id))}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('View Details')}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {hasPermission('edit-categories') && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => router.visit(route('categories.edit', root.id))}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('Edit Category')}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {hasPermission('delete-categories') && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => setCategoryToDelete(root)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('Delete Category')}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subcategories Branch Container (Expandable Tree Node) */}
                  {isExpanded && (
                    <div className="border-t border-border/70 bg-muted/20 p-4 sm:p-5">
                      {hasChildren ? (
                        <div className="relative ml-4 pl-6 rtl:mr-4 rtl:ml-0 rtl:pr-6 border-l-2 border-dashed border-primary/30 dark:border-primary/40 space-y-3 rtl:border-r-2 rtl:border-l-0">
                          {root.children.map((child: any) => {
                            const hasSubChildren = child.children && child.children.length > 0;
                            const isSubExpanded = !!expandedSubCategories[child.id];

                            return (
                              <div key={child.id} className="relative group">
                                {/* Horizontal elbow tree connector */}
                                <div className="absolute -left-6 rtl:-right-6 rtl:left-auto top-5 w-6 h-px border-t-2 border-dashed border-primary/30 dark:border-primary/40" />

                                {/* Subcategory Row Card */}
                                <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-xs flex flex-wrap items-center justify-between gap-3">
                                  {/* Subcategory Info */}
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Expand/Collapse toggle for Subcategory if it has sub-subchildren */}
                                    {hasSubChildren && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleSubExpand(child.id)}
                                        className="h-7 w-7 p-0 rounded-md border border-border/70 bg-background hover:bg-accent shrink-0 text-muted-foreground hover:text-foreground"
                                        title={isSubExpanded ? t('Collapse Sub-subcategories') : t('Expand Sub-subcategories')}
                                      >
                                        <ChevronRight
                                          className={cn(
                                            'h-3.5 w-3.5 transition-transform duration-200 rtl:rotate-180',
                                            isSubExpanded && 'rotate-90 rtl:rotate-90'
                                          )}
                                        />
                                      </Button>
                                    )}

                                    {/* Subcategory Icon / Image */}
                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                                      {child.image ? (
                                        <img
                                          src={getImageUrl(child.image)}
                                          alt={child.name}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                          }}
                                        />
                                      ) : (
                                        <GitFork className="h-4.5 w-4.5" />
                                      )}
                                    </div>

                                    <div className="min-w-0 space-y-0.5">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => router.visit(route('categories.show', child.id))}
                                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left rtl:text-right truncate block"
                                        >
                                          {child.name}
                                        </button>

                                        <BadgeUI className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 font-medium gap-1.5">
                                          <GitFork className="h-3 w-3" />
                                          {t('Subcategory')}
                                        </BadgeUI>

                                        {hasSubChildren && (
                                          <BadgeUI className="bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/30 dark:text-purple-300 font-medium gap-1 text-[11px]">
                                            <Tag className="h-2.5 w-2.5" />
                                            {t('{{count}} Sub-subcategories', { count: child.children.length })}
                                          </BadgeUI>
                                        )}

                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <CornerDownRight className="h-3 w-3 text-muted-foreground/60" />
                                          <span>{root.name}</span>
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <BadgeUI className="font-mono bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400">
                                          /{child.slug}
                                        </BadgeUI>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subcategory Metrics & Actions */}
                                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 ms-auto">
                                    <BadgeUI className="bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 gap-1.5 font-medium">
                                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>{t('{{count}} Products', { count: child.products_count || 0 })}</span>
                                    </BadgeUI>

                                    <BadgeUI
                                      className="font-mono bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 hidden sm:inline-flex"
                                      title={t('Display sort order')}
                                    >
                                      #{child.sort_order ?? 0}
                                    </BadgeUI>

                                    <BadgeUI
                                      className={
                                        child.is_active
                                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium'
                                          : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 font-medium'
                                      }
                                    >
                                      {child.is_active ? t('Active') : t('Inactive')}
                                    </BadgeUI>

                                    {/* Add Child under this subcategory */}
                                    {hasPermission('create-categories') && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit(route('categories.create') + '?parent_id=' + child.id)}
                                        className="h-7 gap-1 text-[11px] font-medium border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                        title={t('Add child category under {{name}}', { name: child.name })}
                                      >
                                        <Plus className="h-3 w-3" />
                                        <span className="hidden md:inline">{t('Add Child')}</span>
                                      </Button>
                                    )}

                                    <div className="flex items-center gap-1 border-l border-border/70 pl-2 rtl:border-r rtl:border-l-0 rtl:pr-2 rtl:pl-0">
                                      {hasPermission('view-categories') && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => router.visit(route('categories.show', child.id))}
                                              >
                                                <Eye className="h-3.5 w-3.5" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('View Details')}</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}

                                      {hasPermission('edit-categories') && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => router.visit(route('categories.edit', child.id))}
                                              >
                                                <Edit className="h-3.5 w-3.5" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('Edit Subcategory')}</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}

                                      {hasPermission('delete-categories') && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => setCategoryToDelete(child)}
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('Delete')}</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Level 3: Nested Sub-subcategories Branch */}
                                {hasSubChildren && isSubExpanded && (
                                  <div className="relative ml-6 pl-6 rtl:mr-6 rtl:ml-0 rtl:pr-6 border-l-2 border-dashed border-amber-500/30 dark:border-amber-500/40 space-y-2 mt-2 rtl:border-r-2 rtl:border-l-0">
                                    {child.children.map((subsub: any) => (
                                      <div key={subsub.id} className="relative group">
                                        {/* Horizontal elbow tree connector for level 3 */}
                                        <div className="absolute -left-6 rtl:-right-6 rtl:left-auto top-1/2 w-6 h-px border-t-2 border-dashed border-amber-500/30 dark:border-amber-500/40" />

                                        {/* Sub-subcategory Row Card */}
                                        <div className="rounded-lg border border-border/70 bg-card/90 hover:border-purple-500/40 p-2.5 sm:p-3 shadow-2xs transition-all duration-200 hover:shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                                          {/* Sub-sub Info */}
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border/80 bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs">
                                              {subsub.image ? (
                                                <img
                                                  src={getImageUrl(subsub.image)}
                                                  alt={subsub.name}
                                                  className="h-full w-full object-cover"
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                                  }}
                                                />
                                              ) : (
                                                <Tag className="h-4 w-4" />
                                              )}
                                            </div>

                                            <div className="min-w-0 space-y-0.5">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => router.visit(route('categories.show', subsub.id))}
                                                  className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors text-left rtl:text-right truncate block"
                                                >
                                                  {subsub.name}
                                                </button>

                                                <BadgeUI className="bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/30 dark:text-purple-300 text-[10px] font-medium gap-1 py-0 px-1.5">
                                                  <Tag className="h-2.5 w-2.5" />
                                                  {t('Sub-subcategory')}
                                                </BadgeUI>

                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                  <CornerDownRight className="h-2.5 w-2.5 text-muted-foreground/60" />
                                                  <span>{child.name}</span>
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <BadgeUI className="font-mono bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] py-0 px-1.5">
                                                  /{subsub.slug}
                                                </BadgeUI>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Sub-sub Metrics & Actions */}
                                          <div className="flex flex-wrap items-center gap-2 ms-auto">
                                            <BadgeUI className="bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 gap-1 text-[11px] font-medium py-0.5 px-2">
                                              <Package className="h-3 w-3 text-muted-foreground" />
                                              <span>{t('{{count}} Products', { count: subsub.products_count || 0 })}</span>
                                            </BadgeUI>

                                            <BadgeUI
                                              className="font-mono bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 hidden sm:inline-flex text-[10px] py-0.5 px-1.5"
                                              title={t('Display sort order')}
                                            >
                                              #{subsub.sort_order ?? 0}
                                            </BadgeUI>

                                            <BadgeUI
                                              className={
                                                subsub.is_active
                                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-[10px] py-0.5 px-1.5'
                                                  : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 font-medium text-[10px] py-0.5 px-1.5'
                                              }
                                            >
                                              {subsub.is_active ? t('Active') : t('Inactive')}
                                            </BadgeUI>

                                            <div className="flex items-center gap-0.5 border-l border-border/70 pl-1.5 rtl:border-r rtl:border-l-0 rtl:pr-1.5 rtl:pl-0">
                                              {hasPermission('view-categories') && (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                        onClick={() => router.visit(route('categories.show', subsub.id))}
                                                      >
                                                        <Eye className="h-3 w-3" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('View Details')}</TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}

                                              {hasPermission('edit-categories') && (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                        onClick={() => router.visit(route('categories.edit', subsub.id))}
                                                      >
                                                        <Edit className="h-3 w-3" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('Edit Sub-subcategory')}</TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}

                                              {hasPermission('delete-categories') && (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setCategoryToDelete(subsub)}
                                                      >
                                                        <Trash2 className="h-3 w-3" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('Delete')}</TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Empty State inside Root Category */
                        <div className="rounded-xl border border-dashed border-border/90 bg-card/60 p-4 text-center sm:flex sm:items-center sm:justify-between sm:text-left rtl:sm:text-right gap-3">
                          <div className="flex items-center gap-2.5">
                            <FolderPlus className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {t('No subcategories created under "{{name}}" yet.', { name: root.name })}
                            </span>
                          </div>
                          {hasPermission('create-categories') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.visit(route('categories.create') + '?parent_id=' + root.id)}
                              className="mt-2 sm:mt-0 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              {t('Add First Subcategory')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Complete Empty State when no categories match search/filters */
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <FolderTree className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold text-foreground">
                {t('No Categories Found')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                {hasActiveFilters()
                  ? t('No categories matched your active filters or search terms. Try resetting your filters.')
                  : t('Get started by creating your first root category to organize your products.')}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {hasActiveFilters() && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    {t('Clear Filters')}
                  </Button>
                )}
                {hasPermission('create-categories') && (
                  <Button size="sm" onClick={() => router.visit(route('categories.create'))} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    {t('Create Category')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Orphan Subcategories (if any subcategory exists with an unlinked parent) */}
          {categoryTreeData.orphanSubs.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <GitFork className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-bold text-foreground">
                  {t('Direct / Unlinked Subcategories ({{count}})', { count: categoryTreeData.orphanSubs.length })}
                </h4>
              </div>
              <div className="space-y-2">
                {categoryTreeData.orphanSubs.map((orphan: any) => (
                  <div
                    key={orphan.id}
                    className="rounded-xl border border-border/80 bg-card p-3 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <GitFork className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-semibold text-foreground block truncate">
                          {orphan.name}
                        </span>
                        <BadgeUI className="font-mono bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400">
                          /{orphan.slug}
                        </BadgeUI>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeUI
                        className={
                          orphan.is_active
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium'
                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 font-medium'
                        }
                      >
                        {orphan.is_active ? t('Active') : t('Inactive')}
                      </BadgeUI>
                      {hasPermission('edit-categories') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => router.visit(route('categories.edit', orphan.id))}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {totalRoots > perPage && (
          <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-sm text-muted-foreground">
              {t('Showing {{from}} to {{to}} of {{total}} root categories', {
                from,
                to,
                total: totalRoots,
              })}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              lastPage={totalPages}
              onPageChange={(pageOrUrl: any) => {
                if (typeof pageOrUrl === 'number') {
                  setCurrentPage(pageOrUrl);
                } else if (typeof pageOrUrl === 'string') {
                  const p = parseInt(new URL(pageOrUrl, window.location.origin).searchParams.get('page') || '1');
                  setCurrentPage(p);
                }
              }}
              links={paginationLinks}
            />
          </div>
        )}
      </div>

      {/* Delete Category Modal */}
      <CrudDeleteModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteConfirm}
        itemName={categoryToDelete?.name || ''}
        entityName={t('Category')}
      />
    </PageTemplate>
  );
}