import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/custom-toast';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { useStore } from './StoreContext';
import { useCart } from './CartContext';

// Country dropdown component
const CountryDropdown: React.FC<{
  value: string;
  onChange: (value: string, id?: number) => void;
  className?: string;
}> = ({ value, onChange, className }) => {
  const countries = (window as any).page?.props?.countries || [];
  const selectedCountryId = countries.find(c => c.name === value)?.id || '';

  return (
    <select
      value={selectedCountryId}
      onChange={(e) => {
        const selectedCountry = countries.find(c => c.id.toString() === e.target.value);
        onChange(selectedCountry?.name || '', selectedCountry?.id);
      }}
      className={className}
    >
      <option value="">Select Country</option>
      {countries.map(country => (
        <option key={country.id} value={country.id}>
          {country.name}
        </option>
      ))}
    </select>
  );
};

// State dropdown component
const StateDropdown: React.FC<{
  countryId?: number;
  value: string;
  onChange: (value: string, id?: number) => void;
  className?: string;
  disabled?: boolean;
}> = ({ countryId, value, onChange, className, disabled }) => {
  const [states, setStates] = useState<{ id: number, name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!countryId) {
      setStates([]);
      return;
    }

    setLoading(true);
    fetch(route('api.locations.states', countryId))
      .then(res => res.json())
      .then(data => {
        const statesData = Array.isArray(data) ? data : (data.states || []);
        setStates(statesData);
        setLoading(false);
      })
      .catch(() => {
        setStates([]);
        setLoading(false);
      });
  }, [countryId]);

  useEffect(() => {
    if (value && states.length > 0 && !states.find(s => s.name === value)) {
      onChange('', undefined);
    }
  }, [states, value, onChange]);

  const store = (window as any).page?.props?.store || {};
  const theme = store?.theme || 'gadgets';
  const focusColors = theme === 'fashion' ? 'focus:ring-rose-300 focus:border-rose-300' :
    theme === 'home-decor' ? 'focus:ring-amber-500 focus:border-amber-500 border-2 border-amber-200 bg-amber-50/30' :
      theme === 'bakery' ? 'focus:ring-stone-600 focus:border-stone-600 border-2 border-stone-300' :
        theme === 'supermarket' ? 'focus:ring-green-500 focus:border-green-500' :
          'focus:ring-blue-500 focus:border-blue-500';

  if (disabled || !countryId) {
    return (
      <Select disabled>
        <SelectTrigger className={`w-full ${focusColors}`}>
          <SelectValue placeholder="Select Country First" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="disabled">Select Country First</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={`w-full ${focusColors}`}>
          <SelectValue placeholder="Loading states..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="loading">Loading states...</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  const selectedState = states.find(s => s.name === value);
  const selectedStateId = selectedState?.id?.toString() || '';

  return (
    <Select
      value={selectedStateId}
      onValueChange={(stateId) => {
        const selectedState = states.find(s => s.id.toString() === stateId);
        onChange(selectedState?.name || '', selectedState?.id);
      }}
    >
      <SelectTrigger className={`w-full ${focusColors}`}>
        <SelectValue placeholder="Select State" />
      </SelectTrigger>
      <SelectContent>
        {states.map(state => (
          <SelectItem key={state.id} value={state.id.toString()}>
            {state.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// City dropdown component
const CityDropdown: React.FC<{
  stateId?: number;
  value: string;
  onChange: (value: string, id?: number) => void;
  className?: string;
  disabled?: boolean;
}> = ({ stateId, value, onChange, className, disabled }) => {
  const [cities, setCities] = useState<{ id: number, name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }

    setLoading(true);
    fetch(route('api.locations.cities', stateId))
      .then(res => res.json())
      .then(data => {
        const citiesData = Array.isArray(data) ? data : (data.cities || []);
        setCities(citiesData);
        setLoading(false);
      })
      .catch(() => {
        setCities([]);
        setLoading(false);
      });
  }, [stateId]);

  useEffect(() => {
    if (value && cities.length > 0 && !cities.find(c => c.name === value)) {
      onChange('', undefined);
    }
  }, [cities, value, onChange]);

  const store = (window as any).page?.props?.store || {};
  const theme = store?.theme || 'gadgets';
  const focusColors = theme === 'fashion' ? 'focus:ring-rose-300 focus:border-rose-300' :
    theme === 'home-decor' ? 'focus:ring-amber-500 focus:border-amber-500 border-2 border-amber-200 bg-amber-50/30' :
      theme === 'bakery' ? 'focus:ring-stone-600 focus:border-stone-600 border-2 border-stone-300' :
        theme === 'supermarket' ? 'focus:ring-green-500 focus:border-green-500' :
          'focus:ring-blue-500 focus:border-blue-500';

  if (disabled || !stateId) {
    return (
      <Select disabled>
        <SelectTrigger className={`w-full ${focusColors}`}>
          <SelectValue placeholder="Select State First" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="disabled">Select State First</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={`w-full ${focusColors}`}>
          <SelectValue placeholder="Loading cities..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="loading">Loading cities...</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  const selectedCity = cities.find(c => c.name === value);
  const selectedCityId = selectedCity?.id?.toString() || '';

  return (
    <Select
      value={selectedCityId}
      onValueChange={(cityId) => {
        const selectedCity = cities.find(c => c.id.toString() === cityId);
        onChange(selectedCity?.name || '', selectedCity?.id);
      }}
    >
      <SelectTrigger className={`w-full ${focusColors}`}>
        <SelectValue placeholder="Select City" />
      </SelectTrigger>
      <SelectContent>
        {cities.map(city => (
          <SelectItem key={city.id} value={city.id.toString()}>
            {city.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface CheckoutContextType {
  deliveryDate: string;
  deliveryDateError: string;
  orderingUnavailable: boolean;
  setDeliveryDate: (date: string) => void;
  step: number;
  firstStep: number;
  customerInfo: CustomerInfo;
  couponCode: string;
  appliedCoupon: { code: string, discount: number, type?: string, discount_amount?: number } | null;
  couponError: string;
  selectedShipping: string;
  selectedPayment: string;
  shippingMethods: any[];
  loadingShipping: boolean;
  paymentMethods: any[];
  loadingPayments: boolean;
  emailError: string;
  phoneError: string;
  isPlacingOrder: boolean;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  setStep: (step: number) => void;
  setCouponCode: (code: string) => void;
  setSelectedShipping: (id: string) => void;
  setSelectedPayment: (method: string) => void;
  handleInputChange: (field: string, value: string) => void;
  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleApplyCoupon: (subtotal: number) => Promise<void>;
  handlePlaceOrder: () => Promise<void>;
  setCountryId: (id?: number) => void;
  setStateId: (id?: number) => void;
  setCityId: (id?: number) => void;
  CountryDropdown: React.FC<{ value: string; onChange: (value: string, id?: number) => void; className?: string; }>;
  StateDropdown: React.FC<{ countryId?: number; value: string; onChange: (value: string, id?: number) => void; className?: string; disabled?: boolean; }>;
  CityDropdown: React.FC<{ stateId?: number; value: string; onChange: (value: string, id?: number) => void; className?: string; disabled?: boolean; }>;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

interface CheckoutProviderProps {
  children: ReactNode;
  userProfile?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  isLoggedIn?: boolean;
  store?: { id: string; slug: string };
  onOrderComplete?: () => void;
}

export const CheckoutProvider: React.FC<CheckoutProviderProps> = ({
  children,
  userProfile,
  isLoggedIn,
  store,
  onOrderComplete
}) => {
  const { clearCart } = useCart();
  const { orderingSchedule, orderingUnavailable, scheduleError, refreshOrderingSchedule } = useStore();
  const [deliveryDate, updateDeliveryDate] = useState('');
  const [deliveryDateError, setDeliveryDateError] = useState('');
  const setDeliveryDate = (date: string) => {
    updateDeliveryDate(date);
    setDeliveryDateError('');
  };
  useEffect(() => {
    if (deliveryDate && orderingSchedule?.enabled && !orderingSchedule.delivery_dates.some(day => day.value === deliveryDate)) {
      updateDeliveryDate('');
      setDeliveryDateError('That delivery date is no longer available. Please choose another day.');
    }
  }, [deliveryDate, orderingSchedule]);
  // Step 0 is the delivery-day step; it only exists when the ordering schedule is on.
  const firstStep = orderingSchedule?.enabled ? 0 : 1;
  const [step, setStep] = useState(firstStep);
  useEffect(() => {
    if (firstStep === 0 && !deliveryDate) setStep(current => (current === 1 ? 0 : current));
    if (firstStep === 1) setStep(current => (current === 0 ? 1 : current));
  }, [firstStep]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: isLoggedIn && userProfile ? userProfile.first_name : '',
    lastName: isLoggedIn && userProfile ? userProfile.last_name : '',
    email: isLoggedIn && userProfile ? userProfile.email : '',
    phone: isLoggedIn && userProfile ? userProfile.phone : '',
    address: isLoggedIn && userProfile ? userProfile.address : '',
    city: '',
    state: '',
    country: '',
    postalCode: isLoggedIn && userProfile ? userProfile.postalCode : ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number, type?: string, discount_amount?: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [selectedShipping, setSelectedShipping] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [countryId, setCountryId] = useState<number | undefined>();
  const [stateId, setStateId] = useState<number | undefined>();
  const [cityId, setCityId] = useState<number | undefined>();

  // Initialize location data when user profile is available
  useEffect(() => {
    if (isLoggedIn && userProfile) {
      // Set country
      const countries = (window as any).page?.props?.countries || [];
      const selectedCountry = countries.find(c => c.id.toString() === userProfile.country?.toString());
      if (selectedCountry) {
        setCountryId(selectedCountry.id);
        setCustomerInfo(prev => ({ ...prev, country: selectedCountry.name }));
      }
    }
  }, [isLoggedIn, userProfile]);

  // Load state when country is set
  useEffect(() => {
    if (countryId && userProfile?.state) {
      fetch(route('api.locations.states', countryId))
        .then(res => res.json())
        .then(data => {
          const statesData = Array.isArray(data) ? data : (data.states || []);
          const selectedState = statesData.find(s => s.id.toString() === userProfile.state?.toString());
          if (selectedState) {
            setStateId(selectedState.id);
            setCustomerInfo(prev => ({ ...prev, state: selectedState.name }));
          }
        })
        .catch(() => { });
    }
  }, [countryId, userProfile?.state]);

  // Load city when state is set
  useEffect(() => {
    if (stateId && userProfile?.city) {
      fetch(route('api.locations.cities', stateId))
        .then(res => res.json())
        .then(data => {
          const citiesData = Array.isArray(data) ? data : (data.cities || []);
          const selectedCity = citiesData.find(c => c.id.toString() === userProfile.city?.toString());
          if (selectedCity) {
            setCityId(selectedCity.id);
            setCustomerInfo(prev => ({ ...prev, city: selectedCity.name }));
          }
        })
        .catch(() => { });
    }
  }, [stateId, userProfile?.city]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[0-9]{7,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
    if (field === 'email') setEmailError('');
    if (field === 'phone') setPhoneError('');
  };

  const handleNextStep = () => {
    if (orderingUnavailable) {
      toast.error(scheduleError || (orderingSchedule?.is_open ? 'Checking ordering hours. Please try again.' : orderingSchedule?.message) || 'Ordering is currently unavailable. Please try again.');
      return;
    }
    if (orderingSchedule?.enabled && !orderingSchedule.delivery_dates.some(day => day.value === deliveryDate)) {
      setDeliveryDateError('Please choose an available delivery date.');
      setStep(0);
      return;
    }
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      let hasErrors = false;

      if (!validateEmail(customerInfo.email)) {
        setEmailError('Please enter a valid email address');
        hasErrors = true;
      }

      if (!validatePhone(customerInfo.phone)) {
        setPhoneError('Please enter a valid phone number');
        hasErrors = true;
      }

      if (hasErrors) return;
    }

    if (step < 3) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > firstStep) setStep(step - 1);
  };

  const handleApplyCoupon = async (subtotal: number) => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const response = await fetch(route('api.coupon.validate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
          code: couponCode,
          store_id: store?.id,
          subtotal: subtotal
        })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          discount: data.coupon.discount,
          type: data.coupon.type,
          discount_amount: data.coupon.discount_amount
        });
        setCouponError('');
      } else {
        setCouponError(data.error || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      setCouponError('Failed to validate coupon. Please try again.');
      setAppliedCoupon(null);
    }
  };

  const loadShippingMethods = async () => {
    if (!store?.id) return;

    setLoadingShipping(true);
    try {
      const response = await fetch(`${route('api.shipping.methods')}?store_id=${store.id}`, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setShippingMethods(data.shipping_methods || []);
      }
    } catch (error) {
      console.error('Failed to load shipping methods:', error);
    } finally {
      setLoadingShipping(false);
    }
  };

  const loadPaymentMethods = async () => {
    if (!store?.id) return;

    setLoadingPayments(true);
    setPaymentMethods([]);
    setSelectedPayment('');
    try {
      const response = await fetch(`${route('api.payment.methods')}?store_id=${store.id}`, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        const methods = (data.payment_methods || []).filter((method: { name: string }) => ['stripe', 'cod'].includes(method.name));
        setPaymentMethods(methods);
        setSelectedPayment(methods.find((method: { name: string }) => method.name === 'stripe')?.name ?? methods[0]?.name ?? '');
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    if (!['stripe', 'cod'].includes(selectedPayment) || !paymentMethods.some(method => method.name === selectedPayment)) {
      toast.error('Please choose an available payment method.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Recheck before placing the order; a tab can stay open past closing time.
      const currentSchedule = await refreshOrderingSchedule();
      if (currentSchedule.enabled && !currentSchedule.is_open) {
        toast.error(currentSchedule.message);
        return;
      }
      if (currentSchedule.enabled && !currentSchedule.delivery_dates.some(day => day.value === deliveryDate)) {
        setDeliveryDateError('Please choose an available delivery date.');
        toast.error('Please choose an available delivery date.');
        return;
      }
      const orderData = {
        delivery_date: currentSchedule.enabled ? deliveryDate : undefined,
        store_id: parseInt(store?.id?.toString() || '0'),
        customer_first_name: customerInfo.firstName,
        customer_last_name: customerInfo.lastName,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        shipping_address: customerInfo.address,
        shipping_city: (cityId || customerInfo.city)?.toString(),
        shipping_state: (stateId || customerInfo.state)?.toString(),
        shipping_postal_code: customerInfo.postalCode,
        shipping_country: (countryId || customerInfo.country)?.toString(),
        billing_address: customerInfo.address,
        billing_city: (cityId || customerInfo.city)?.toString(),
        billing_state: (stateId || customerInfo.state)?.toString(),
        billing_postal_code: customerInfo.postalCode,
        billing_country: (countryId || customerInfo.country)?.toString(),
        payment_method: selectedPayment,
        shipping_method_id: selectedShipping ? parseInt(selectedShipping) : undefined,
        notes: '',
        coupon_code: appliedCoupon?.code || undefined,
      };

      const formData = new FormData();
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) formData.append('_token', csrfToken);
      Object.entries(orderData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value.toString());
      });

      const response = await fetch(generateStoreUrl('store.order.place', store), {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.errors?.delivery_date?.[0]) setDeliveryDateError(data.errors.delivery_date[0]);
        if (data.errors?.ordering_schedule) void refreshOrderingSchedule().catch(() => {});
        toast.error(data.message || 'Could not place your order. Please try again.');
        return;
      }
      if (selectedPayment === 'stripe') {
        if (!data.redirect_url) {
          toast.error('Could not open secure card payment. Please try again.');
          return;
        }
        window.location.assign(data.redirect_url);
        return;
      }
      clearCart();
      if (onOrderComplete) {
        const url = new URL(window.location.href);
        url.searchParams.set('payment_status', 'success');
        url.searchParams.set('order_number', data.order_number);
        window.history.replaceState({}, '', url.toString());
        window.dispatchEvent(new CustomEvent('showOrderSuccess', { detail: { orderNumber: data.order_number } }));
        onOrderComplete();
      } else {
        const url = new URL(generateStoreUrl('store.home', store));
        url.searchParams.set('payment_status', 'success');
        url.searchParams.set('order_number', data.order_number);
        window.location.assign(url.toString());
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Could not place your order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    if (step === 2) {
      loadShippingMethods();
    }
    if (step === 3) {
      loadPaymentMethods();
    }
  }, [step, store?.id]);

  const value: CheckoutContextType = {
    deliveryDate,
    deliveryDateError,
    orderingUnavailable,
    setDeliveryDate,
    step,
    firstStep,
    customerInfo,
    couponCode,
    appliedCoupon,
    couponError,
    selectedShipping,
    selectedPayment,
    shippingMethods,
    loadingShipping,
    paymentMethods,
    loadingPayments,
    emailError,
    phoneError,
    isPlacingOrder,
    countryId,
    stateId,
    cityId,
    setStep,
    setCouponCode,
    setSelectedShipping,
    setSelectedPayment,
    handleInputChange,
    handleNextStep,
    handlePrevStep,
    handleApplyCoupon,
    handlePlaceOrder,
    setCountryId,
    setStateId,
    setCityId,
    CountryDropdown,
    StateDropdown,
    CityDropdown
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckoutContext = () => {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckoutContext must be used within a CheckoutProvider');
  }
  return context;
};
