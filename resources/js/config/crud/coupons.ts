// config/crud/coupons.ts
import React from 'react';
import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/columnRenderers';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/custom-toast';
import { t } from '@/utils/i18n';
import { formatCurrency } from '@/utils/currency-helper';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';

const StatusSwitch = ({ value, rowId }: { value: any; rowId: any }) => {
  const [isChecked, setIsChecked] = React.useState(!!value);
  
  React.useEffect(() => {
    setIsChecked(!!value);
  }, [value]);

  const handleToggle = async () => {
    const originalChecked = isChecked;
    setIsChecked(!originalChecked);
    router.put(route('coupons.toggle-status', rowId), {}, {
      onSuccess: (page: any) => {
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        setIsChecked(originalChecked);
        toast.error(t('Error updating status'));
      }
    });
  };

  return React.createElement('div', { className: 'flex items-center justify-center' }, [
    React.createElement(Switch, {
      key: 'status-switch',
      checked: isChecked,
      onCheckedChange: handleToggle
    })
  ]);
};

export const couponsConfig: CrudConfig = {
  entity: {
    name: 'coupons',
    endpoint: route('coupons.index'),
    permissions: {
      view: 'view-coupons',
      create: 'create-coupons',
      edit: 'create-coupons',
      delete: 'delete-coupons'
    }
  },
  modalSize: '4xl',
  description: t('Manage discount coupons and promotional codes'),
  table: {
    columns: [
      { key: 'name', label: t('Name'), sortable: true },
      {
        key: 'code',
        label: t('Code'),
        sortable: true,
        render: (value) => React.createElement(Badge, {
          variant: 'outline',
          className: 'cursor-pointer hover:bg-neutral-100 font-mono transition-colors',
          onClick: () => {
            navigator.clipboard.writeText(value);
            toast.success(t('Coupon code copied to clipboard'));
          }
        }, value)
      },
      { 
        key: 'type', 
        label: t('Type'), 
        sortable: true,
        render: (value) => {
          const className = value === 'percentage' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800';
          return value === 'percentage' ? t('Percentage') : t('Flat Amount');
        }
      },
      { 
        key: 'minimum_spend', 
        label: t('Min Spend'), 
        render: (value) => value ? React.createElement('span', { className: 'font-mono' }, formatCurrency(parseFloat(value))) : '-'
      },
      { 
        key: 'maximum_spend', 
        label: t('Max Spend'), 
        render: (value) => value ? React.createElement('span', { className: 'font-mono' }, formatCurrency(parseFloat(value))) : '-'
      },
      { 
        key: 'discount_amount', 
        label: t('Discount'), 
        render: (value, row) => {
          const amount = parseFloat(value);
          return row.type === 'percentage' 
            ? `${amount}%` 
            : React.createElement('span', { className: 'font-mono' }, formatCurrency(amount));
        }
      },
      { key: 'use_limit_per_coupon', label: t('Coupon Limit'), render: (value) => value || t('Unlimited') },
      { key: 'use_limit_per_user', label: t('User Limit'), render: (value) => value || t('Unlimited') },
      { 
        key: 'expiry_date', 
        label: t('Expiry Date'), 
        sortable: true, 
        type: 'date'
        // render: columnRenderers.date() 
      },
      { 
        key: 'status', 
        label: t('Status'), 
        render: (value, row) => React.createElement(StatusSwitch, { value, rowId: row.id })
      }
    ],
    actions: [
      { 
        label: t('View Details'), 
        icon: 'Eye', 
        action: 'view-details', 
        className: 'text-blue-500'
      },
      { 
        label: t('Edit'), 
        icon: 'Edit', 
        action: 'edit', 
        className: 'text-amber-500'
      },
      { 
        label: t('Delete'), 
        icon: 'Trash2', 
        action: 'delete', 
        className: 'text-red-500'
      }
    ]
  },
  search: {
    enabled: true,
    placeholder: t('Search coupons...'),
    fields: ['name', 'code']
  },
  filters: [
    {
      key: 'type',
      label: t('Type'),
      type: 'select',
      options: [
        { value: 'all', label: t('All Types') },
        { value: 'percentage', label: t('Percentage') },
        { value: 'flat', label: t('Flat Amount') }
      ]
    },
    {
      key: 'status',
      label: t('Status'),
      type: 'select',
      options: [
        { value: 'all', label: t('All Status') },
        { value: '1', label: t('Active') },
        { value: '0', label: t('Inactive') }
      ]
    }
  ],
  form: {
    layout: 'grid',
    columns: 12,
    fields: [
      { 
        name: 'name', 
        label: t('Coupon Name'), 
        type: 'text', 
        required: true,
        colSpan: 6,
        placeholder: t('Enter coupon name')
      },
      {
        name: 'type',
        label: t('Discount Type'),
        type: 'select',
        required: true,
        colSpan: 6,
        options: [
          { value: 'percentage', label: t('Percentage (%)') },
          { value: 'flat', label: t('Fixed Amount ($)') }
        ]
      },      
      {
        name: 'discount_amount',
        label: t('Discount Value'),
        type: 'number',
        required: true,
        colSpan: 6,
        min: 0,
        max: 99,
        step: 0.01,
        placeholder: t('Enter value')
      },
      { 
        name: 'use_limit_per_coupon', 
        label: t('Total Usage Limit'), 
        type: 'number', 
        colSpan: 6,
        min: 1,
        placeholder: t('Leave empty for unlimited')
      },
      { 
        name: 'code_type', 
        label: t('Code Generation'), 
        type: 'radio', 
        required: true,
        colSpan: 6,
        options: [
          { value: 'manual', label: t('Manual Entry') },
          { value: 'auto', label: t('Auto Generate') }
        ],
        defaultValue: 'manual'
      },
      { 
        name: 'code', 
        label: t('Coupon Code'), 
        type: 'custom',
        required: true,
        colSpan: 6,
        render: (field: any, formData: any, onChange: any) => {
          const generateCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 10; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            onChange('code', result);
          };

          const isAuto = formData.code_type === 'auto';

          return React.createElement('div', { className: 'space-y-2' }, [
            React.createElement('div', { 
              className: isAuto ? 'flex flex-col sm:flex-row gap-2' : '', 
              key: 'input-group' 
            }, isAuto ? [
              React.createElement('input', {
                key: 'code-input',
                type: 'text',
                value: formData.code || '',
                onChange: (e: any) => onChange('code', e.target.value.toUpperCase()),
                placeholder: t('Click generate to create code'),
                className: 'flex-1 min-w-0 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              }),
              React.createElement('button', {
                key: 'generate-btn',
                type: 'button',
                onClick: generateCode,
                className: 'shrink-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2'
              }, t('Generate'))
            ] : [
              React.createElement('input', {
                key: 'code-input-manual',
                type: 'text',
                value: formData.code || '',
                onChange: (e: any) => onChange('code', e.target.value.toUpperCase()),
                placeholder: t('Enter coupon code'),
                className: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              })
            ])
          ]);
        }
      },
      { 
        name: 'minimum_spend', 
        label: t('Minimum Spend ($)'), 
        type: 'number', 
        colSpan: 6,
        min: 0,
        step: 0.01,
        placeholder: t('Optional')
      },
      { 
        name: 'maximum_spend', 
        label: t('Maximum Spend ($)'), 
        type: 'number', 
        colSpan: 6,
        min: 0,
        step: 0.01,
        placeholder: t('Optional')
      },
      { 
        name: 'use_limit_per_user', 
        label: t('Usage Limit Per User'), 
        type: 'number', 
        colSpan: 6,
        min: 1,
        placeholder: t('Leave empty for unlimited')
      },
      {
        name: 'expiry_date',
        label: t('Expiry Date'),
        type: 'date',
        colSpan: 6
      },
      // { 
      //   name: 'status', 
      //   label: t('Status'), 
      //   type: 'switch', 
      //   colSpan: 6,
      //   defaultValue: true,
      //   placeholder: t('Enable or disable this coupon')
      // }
    ]
  }
};