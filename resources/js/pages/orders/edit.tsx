import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { ArrowLeft, ArrowRight, Check, Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { toast } from '@/components/custom-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLayout } from '@/contexts/LayoutContext';

interface EditOrderProps {
  order: {
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    customer: {
      id: number;
      name: string;
      email: string;
      phone: string;
    };
    shippingAddress: {
      address: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    items: Array<{
      id: number;
      productId: number;
      name: string;
      quantity: number;
      price: number;
      variants?: any;
    }>;
    summary: {
      subtotal: number;
      shipping: number;
      tax: number;
      total: number;
    };
    shippingMethodId: number;
    trackingNumber?: string;
    notes?: string;
  };
  customers: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  products: Array<{
    id: number;
    name: string;
    price: number;
    variants?: Array<{
      name: string;
      values: string[];
    }>;
  }>;
  shippingMethods: Array<{
    id: number;
    name: string;
    cost: number;
  }>;
}

export default function EditOrder({ order, customers, products, shippingMethods }: EditOrderProps) {
  const { errors } = usePage().props as any;
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const {position} = useLayout();

  const [orderItems, setOrderItems] = useState(
    order.items && order.items.length > 0
      ? order.items.map(item => ({
          ...item,
          variants: item.variants || {}
        }))
      : [{ id: Date.now(), productId: 0, name: '', quantity: 1, price: 0, variants: {} }]
  );

  const [formData, setFormData] = useState({
    status: order.status || 'pending',
    payment_status: order.paymentStatus || 'pending',
    tracking_number: order.trackingNumber || '',
    notes: order.notes || '',
    items: orderItems,
  });

  const [customerDetails, setCustomerDetails] = useState({
    id: order.customer?.id?.toString() || '',
    name: order.customer?.name || '',
    email: order.customer?.email || '',
    phone: order.customer?.phone || '',
  });

  const combinedErrors = { ...errors, ...localErrors };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!orderItems || orderItems.length === 0) {
        e.items = t('At least one item is required in the order');
      } else {
        orderItems.forEach((item, index) => {
          if (!item.productId || item.productId === 0) {
            e[`item_${index}_product`] = t('Product is required');
          }
          if (item.quantity === ('' as any) || item.quantity === undefined || item.quantity === null || Number(item.quantity) <= 0 || isNaN(Number(item.quantity))) {
            e[`item_${index}_quantity`] = t('Quantity must be greater than 0');
          }
          if (item.price === ('' as any) || item.price === undefined || item.price === null || isNaN(Number(item.price)) || Number(item.price) < 0) {
            e[`item_${index}_price`] = t('Price is required');
          }
        });
      }
    }
    if (s === 3) {
      if (!formData.status) {
        e.status = t('Order status is required');
      }
    }
    setLocalErrors(e);
    return Object.keys(e).length === 0;
  };

  const STEP_FIELDS: Record<number, string[]> = {
    0: ['customer_name', 'customer_email', 'notes'],
    1: ['items'],
    2: ['shipping_address', 'tracking_number'],
    3: ['status', 'payment_status'],
  };

  const stepHasError = (i: number) => {
    if (i === 1) {
      if (combinedErrors.items) return true;
      return Object.keys(combinedErrors).some(k => k.startsWith('item_'));
    }
    const fields = STEP_FIELDS[i] || [];
    return fields.some(f => combinedErrors[f]);
  };

  const STEPS = [
    { key: 'customer', label: t('Customer Information') },
    { key: 'items', label: t('Order Items') },
    { key: 'shipping', label: t('Shipping Details') },
    { key: 'payment', label: t('Payment & Status') }
  ];

  const handleSubmit = () => {
    if (!validateStep(currentStep)) return;
    toast.loading(t('Updating order...'));
    router.put(route('orders.update', order.id), formData, {
      onSuccess: (page: any) => {
        toast.dismiss();
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Order updated successfully'));
        }
      },
      onError: () => {
        toast.dismiss();
        toast.error(t('Please correct the errors in the form'));
      }
    });
  };

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => router.get(route('orders.index'))
    }
  ];

  const addOrderItem = () => {
    const newItem = { id: Date.now(), productId: 0, name: '', quantity: 1, price: 0, variants: {} };
    const updated = [...orderItems, newItem];
    setOrderItems(updated);
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const removeOrderItem = (index: number) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated);
    setFormData(prev => ({ ...prev, items: updated }));
    setLocalErrors(prev => {
      const next: Record<string, string> = {};
      Object.keys(prev).forEach(key => {
        if (!key.startsWith('item_')) {
          next[key] = prev[key];
        }
      });
      return next;
    });
  };

  const handleCustomerChange = (customerId: string) => {
    const found = customers.find(c => c.id.toString() === customerId);
    if (found) {
      setCustomerDetails(prev => ({
        ...prev,
        id: customerId,
        name: found.name,
        email: found.email
      }));
    }
  };

  return (
    <PageTemplate 
      title={t('Edit Order') + ' - ' + (order.orderNumber || `#${order.id}`)}
      url="/orders/edit"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Order Management'), href: route('orders.index') },
        { title: t('Edit Order') }
      ]}
      description={t('Edit and update order details.')}
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center w-full">
          {STEPS.map((s, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const hasErr = stepHasError(i);
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div 
                  className="flex items-center gap-2 shrink-0 cursor-pointer"
                  onClick={() => {
                    if (i < currentStep) {
                      setCurrentStep(i);
                    } else if (validateStep(currentStep)) {
                      setCurrentStep(i);
                    }
                  }}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    hasErr ? 'bg-red-50 border-red-500 text-red-600' :
                    done   ? 'bg-primary border-primary text-white' :
                    active ? 'border-primary text-primary bg-white dark:bg-gray-900' :
                             'border-gray-300 dark:border-gray-600 text-gray-400 bg-white dark:bg-gray-900'
                  }`}>
                    {done && !hasErr ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    hasErr ? 'text-red-600' :
                    active ? 'text-primary' :
                    done   ? 'text-gray-700 dark:text-gray-300' :
                             'text-gray-400 dark:text-gray-500'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 transition-colors ${done && !hasErr ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Step 0: Customer Information */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Customer Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-1 mb-4">
                    <Label htmlFor="customer">{t('Select Customer')}</Label>
                    <Select 
                      defaultValue={customerDetails.id}
                      onValueChange={handleCustomerChange}
                      dir={position === 'right' ? 'rtl' : 'ltr'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select customer')} />
                      </SelectTrigger>
                      <SelectContent searchable>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} - {customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="customer_name">{t('Customer Name')}</Label>
                      <Input 
                        id="customer_name" 
                        value={customerDetails.name} 
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={t('enter customer name')}
                      />
                    </div>
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="customer_email">{t('Email Address')}</Label>
                      <Input 
                        id="customer_email" 
                        type="email" 
                        value={customerDetails.email} 
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                        placeholder={t('enter email address')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="customer_phone">{t('Phone Number')}</Label>
                      <Input 
                        id="customer_phone" 
                        value={customerDetails.phone} 
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder={t('enter phone number')}
                      />
                    </div>
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="order_notes">{t('Order Notes')}</Label>
                      <Textarea 
                        id="order_notes" 
                        value={formData.notes} 
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        placeholder={t('Enter order notes or special instructions...')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 1: Order Items */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('Order Items')}</CardTitle>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addOrderItem}
                      disabled={products.length > 0 && orderItems.length >= products.length}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('Add Item')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {combinedErrors.items && (
                    <InputError message={combinedErrors.items} />
                  )}
                  {orderItems.map((item, index) => (
                    <div key={index} className="border rounded-xl p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                          {t('Item {{number}}', { number: index + 1 })}
                        </h4>
                        {orderItems.length > 1 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOrderItem(index)}
                                aria-label={t('Delete')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('Delete')}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label required>{t('Product')}</Label>
                          <Select 
                            value={item.productId ? item.productId.toString() : undefined}
                            dir={position === 'right' ? 'rtl' : 'ltr'}
                            onValueChange={(value) => {
                              const newItems = [...orderItems];
                              newItems[index].productId = parseInt(value);
                              newItems[index].variants = {};
                              const selectedProd = products.find(p => p.id === parseInt(value));
                              if (selectedProd) {
                                newItems[index].price = selectedProd.price;
                                newItems[index].name = selectedProd.name;
                              }
                              setOrderItems(newItems);
                              setFormData(prev => ({ ...prev, items: newItems }));
                              if (localErrors[`item_${index}_product`]) {
                                setLocalErrors(prev => {
                                  const next = { ...prev };
                                  delete next[`item_${index}_product`];
                                  return next;
                                });
                              }
                              if (selectedProd && localErrors[`item_${index}_price`]) {
                                setLocalErrors(prev => {
                                  const next = { ...prev };
                                  delete next[`item_${index}_price`];
                                  return next;
                                });
                              }
                            }}
                          >
                            <SelectTrigger className={combinedErrors[`item_${index}_product`] ? 'border-red-500' : ''}>
                              <SelectValue placeholder={t('Select Product')} />
                            </SelectTrigger>
                            <SelectContent searchable>
                              {products
                                .filter((product) => 
                                  product.id === item.productId || 
                                  !orderItems.some((other, oi) => oi !== index && other.productId === product.id)
                                )
                                .map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - ${product.price.toFixed(2)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <InputError message={combinedErrors[`item_${index}_product`]} />
                          {/* Show variant selection if product has variants */}
                          {item.productId > 0 && (products.find(p => p.id === item.productId)?.variants?.length ?? 0) > 0 && (
                            <div className="mt-2 space-y-2">
                              {products.find(p => p.id === item.productId)?.variants?.map((variant, vIndex) => (
                                <div key={vIndex}>
                                  <Label className="text-xs">{variant.name}</Label>
                                  <Select 
                                    defaultValue={item.variants?.[variant.name] || ''}
                                    dir={position === 'right' ? 'rtl' : 'ltr'}
                                    onValueChange={(value) => {
                                      const newItems = [...orderItems];
                                      if (!newItems[index].variants) newItems[index].variants = {};
                                      newItems[index].variants[variant.name] = value;
                                      setOrderItems(newItems);
                                      setFormData(prev => ({ ...prev, items: newItems }));
                                    }}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder={t('Select {{name}}', { name: variant.name })} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {variant.values?.map((value, valueIndex) => (
                                        <SelectItem key={valueIndex} value={value}>
                                          {value}
                                        </SelectItem>
                                      )) || []}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`item_qty_${index}`} required>{t('Quantity')}</Label>
                          <Input 
                            id={`item_qty_${index}`}
                            type="number" 
                            min="1" 
                            value={item.quantity ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newItems = [...orderItems];
                              newItems[index].quantity = val === '' ? ('' as any) : parseInt(val);
                              setOrderItems(newItems);
                              setFormData(prev => ({ ...prev, items: newItems }));
                              if (val !== '' && parseInt(val) > 0 && localErrors[`item_${index}_quantity`]) {
                                setLocalErrors(prev => {
                                  const next = { ...prev };
                                  delete next[`item_${index}_quantity`];
                                  return next;
                                });
                              }
                            }}
                            className={combinedErrors[`item_${index}_quantity`] ? 'border-red-500' : ''}
                            placeholder={t('Enter quantity')}
                          />
                          <InputError message={combinedErrors[`item_${index}_quantity`]} />
                        </div>
                        <div>
                          <Label htmlFor={`item_price_${index}`} required>{t('Price')}</Label>
                          <Input 
                            id={`item_price_${index}`}
                            type="number" 
                            step="0.01" 
                            min="0"
                            value={item.price ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newItems = [...orderItems];
                              newItems[index].price = val === '' ? ('' as any) : parseFloat(val);
                              setOrderItems(newItems);
                              setFormData(prev => ({ ...prev, items: newItems }));
                              if (val !== '' && !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && localErrors[`item_${index}_price`]) {
                                setLocalErrors(prev => {
                                  const next = { ...prev };
                                  delete next[`item_${index}_price`];
                                  return next;
                                });
                              }
                            }}
                            className={combinedErrors[`item_${index}_price`] ? 'border-red-500' : ''}
                            placeholder={t('Enter price')}
                          />
                          <InputError message={combinedErrors[`item_${index}_price`]} />
                        </div>
                      </div>
                      <div className="flex justify-end text-xs text-muted-foreground pt-1">
                        <span>{t('Item Subtotal')}: <strong className="text-zinc-900 dark:text-zinc-100 font-mono">${((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}</strong></span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Shipping Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Shipping Details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-1 mb-4">
                    <Label htmlFor="shipping_method">{t('Shipping Method')}</Label>
                    <Select defaultValue={order.shippingMethodId?.toString() || ''} dir={position === 'right' ? 'rtl' : 'ltr'}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select shipping method')} />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id.toString()}>
                            {method.name} - ${method.cost.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1 mb-4">
                    <Label htmlFor="shipping_address">{t('Shipping Address')}</Label>
                    <Textarea 
                      id="shipping_address" 
                      defaultValue={order.shippingAddress?.address || ''} 
                      rows={3} 
                      placeholder={t('Enter street address...')}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="shipping_city">{t('City')}</Label>
                      <Input id="shipping_city" defaultValue={order.shippingAddress?.city || ''} placeholder={t('enter city')} />
                    </div>
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="shipping_postal">{t('Postal Code')}</Label>
                      <Input id="shipping_postal" defaultValue={order.shippingAddress?.postalCode || ''} placeholder={t('e.g. 123456')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="shipping_state">{t('State / Province')}</Label>
                      <Input id="shipping_state" defaultValue={order.shippingAddress?.state || ''} placeholder={t('enter state')} />
                    </div>
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="shipping_country">{t('Country')}</Label>
                      <Input id="shipping_country" defaultValue={order.shippingAddress?.country || ''} placeholder={t('enter country')} />
                    </div>
                  </div>
                  <div className="grid gap-1 mb-4">
                    <Label htmlFor="tracking_number">{t('Tracking Number')}</Label>
                    <Input 
                      id="tracking_number" 
                      value={formData.tracking_number} 
                      onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                      placeholder={t('Enter tracking number...')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Payment & Status Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Payment Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="payment_method">{t('Payment Method')}</Label>
                      <Select defaultValue={order.paymentMethod} dir={position === 'right' ? 'rtl' : 'ltr'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">{t('Stripe')}</SelectItem>
                          <SelectItem value="cod">{t('Cash on Delivery (COD)')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="payment_status">{t('Payment Status')}</Label>
                      <Select 
                        value={formData.payment_status} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}
                        dir={position === 'right' ? 'rtl' : 'ltr'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t('Pending')}</SelectItem>
                          <SelectItem value="paid">{t('Paid')}</SelectItem>
                          <SelectItem value="failed">{t('Failed')}</SelectItem>
                          <SelectItem value="refunded">{t('Refunded')}</SelectItem>
                          <SelectItem value="partially_refunded">{t('Partially Refunded')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="subtotal">{t('Subtotal')}</Label>
                      <Input 
                        id="subtotal" 
                        type="number" 
                        step="0.01" 
                        defaultValue={order.summary?.subtotal?.toFixed(2) || '0.00'} 
                        placeholder={t('Enter subtotal')}
                      />
                    </div>
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="tax">{t('Tax Amount')}</Label>
                      <Input 
                        id="tax" 
                        type="number" 
                        step="0.01" 
                        defaultValue={order.summary?.tax?.toFixed(2) || '0.00'} 
                        placeholder={t('Enter tax amount')}
                      />
                    </div>
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="total">{t('Total Amount')}</Label>
                      <Input 
                        id="total" 
                        type="number" 
                        step="0.01" 
                        defaultValue={order.summary?.total?.toFixed(2) || '0.00'}
                        placeholder={t('Total amount')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('Order Status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-1 mb-4">
                    <Label htmlFor="order_status" required>{t('Order Status')}</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      dir={position === 'right' ? 'rtl' : 'ltr'}
                    >
                      <SelectTrigger className={combinedErrors.status ? 'border-red-500' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('Pending')}</SelectItem>
                        <SelectItem value="processing">{t('Processing')}</SelectItem>
                        <SelectItem value="shipped">{t('Shipped')}</SelectItem>
                        <SelectItem value="delivered">{t('Delivered')}</SelectItem>
                        <SelectItem value="completed">{t('Completed')}</SelectItem>
                        <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={combinedErrors.status} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            {currentStep !== 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
              >
                <ArrowLeft className="h-4 w-4" />
                {t('Back')}
              </Button>
            ) : (
              <div></div>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => {
                  if (validateStep(currentStep)) {
                    setCurrentStep(s => s + 1);
                  }
                }}
              >
                {t('Next')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                {t('Update Order')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}