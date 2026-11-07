import { CheckoutSchedule } from '@/components/OrderingSchedule';
import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../../utils/image-helper';
import { formatCurrency } from '../../../utils/currency-formatter';
import { CheckoutProvider, useCheckoutContext } from '../../../contexts/CheckoutContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  sku: string;
  taxName?: string;
  taxPercentage?: number;
}

interface CartItem extends Product {
  quantity: number;
  variants?: {[key: string]: string} | null;
}

interface CheckoutProps {
  cartItems: CartItem[];
  currency: string;
  onClose: () => void;
  onOrderComplete: () => void;
  onUpdateCart: (items: CartItem[]) => void;
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
  onRemoveFromCart: (index: number) => void;
  onUpdateQuantity: (index: number, change: number) => void;
  onQuantityChange: (index: number, value: string) => void;
  store?: { id: string; slug: string };
}

const CheckoutContent: React.FC<Omit<CheckoutProps, 'userProfile' | 'isLoggedIn' | 'store'>> = ({ cartItems, currency, onClose, onOrderComplete, onUpdateCart, onRemoveFromCart, onUpdateQuantity, onQuantityChange }) => {
  const {
    step,
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
    orderingUnavailable,
    countryId,
    stateId,
    cityId,
    CountryDropdown,
    StateDropdown,
    CityDropdown,
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

    firstStep,
  } = useCheckoutContext();

  const storeSettings = (window as any).page?.props?.storeSettings || {};
  const currencies = (window as any).page?.props?.currencies || [];
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalTax = cartItems.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const taxAmount = item.taxPercentage ? (itemTotal * item.taxPercentage) / 100 : 0;
    return sum + taxAmount;
  }, 0);
  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discount) || 0 : 0;
  const selectedShippingMethod = shippingMethods.find(method => method.id.toString() === selectedShipping);
  const shippingCost = selectedShippingMethod ? 
    (selectedShippingMethod.type === 'percentage_based' ? 
      (subtotal * parseFloat(selectedShippingMethod.cost || 0)) / 100 : 
    selectedShippingMethod.type === 'free' ? 0 :
      parseFloat(selectedShippingMethod.cost || 0)) : 0;
  const total = subtotal + totalTax - couponDiscount + shippingCost;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="absolute inset-0 flex items-center justify-center p-0 md:p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-rose-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-6 bg-white border-b border-rose-100 flex-shrink-0">
            <div className="flex items-center justify-center space-x-8">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className="flex flex-col items-center md:hidden">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300 ${
                      step >= stepNum 
                        ? 'bg-rose-600 text-white transform scale-110' 
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}>
                      {step > stepNum ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : stepNum}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${step >= stepNum ? 'text-rose-600' : 'text-gray-400'}`}>
                      {stepNum === 1 ? 'Details' : stepNum === 2 ? 'Review' : 'Payment'}
                    </span>
                  </div>
                  
                  <div className="hidden md:flex md:items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-lg transition-all duration-300 ${
                      step >= stepNum 
                        ? 'bg-rose-600 text-white transform scale-110' 
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}>
                      {step > stepNum ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : stepNum}
                    </div>
                    <span className={`ml-3 font-semibold ${step >= stepNum ? 'text-rose-600' : 'text-gray-400'}`}>
                      {stepNum === 1 ? 'Personal Details' : stepNum === 2 ? 'Order Review' : 'Payment Method'}
                    </span>
                  </div>
                  
                  {stepNum < 3 && (
                    <div className={`w-8 md:w-20 h-1 ml-3 md:ml-6 rounded-full transition-all duration-300 ${
                      step > stepNum ? 'bg-rose-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <CheckoutSchedule />
            {step === 1 && (
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        value={customerInfo.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={customerInfo.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 ${
                        emailError ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter your email"
                    />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 ${
                        phoneError ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter your phone number"
                    />
                    {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                    <textarea
                      value={customerInfo.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                      rows={3}
                      placeholder="Street, building, floor, postcode"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="p-4 md:p-6">
                <div className="space-y-4 mb-6">
                  {cartItems.map((item, index) => (
                    <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100">
                      <div className="flex items-start gap-4">
                        <img src={getImageUrl(item.image)} alt={item.name} loading="lazy" className="w-16 h-16 object-cover rounded-xl" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">{item.name}</h4>
                          {(() => {
                            const variants = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
                            return variants && Object.keys(variants).length > 0 && (
                              <div className="text-xs text-gray-500 mb-1">
                                {Object.entries(variants).map(([key, value], index) => (
                                  <span key={key}>
                                    {key}: {value}
                                    {index < Object.keys(variants).length - 1 && ', '}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-rose-600 font-bold text-lg">{formatCurrency(item.price * item.quantity, storeSettings, currencies)}</p>
                            <button 
                              onClick={() => onRemoveFromCart(index)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{formatCurrency(item.price, storeSettings, currencies)} each</span>
                            <div className="flex items-center gap-3 bg-rose-100 rounded-lg p-1">
                              <button 
                                onClick={() => item.quantity > 1 && onUpdateQuantity(index, -1)}
                                className={`w-7 h-7 flex items-center justify-center rounded-md text-white text-sm shadow-sm font-bold leading-none ${
                                  item.quantity > 1 ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
                                }`}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => onQuantityChange(index, e.target.value)}
                                className="w-8 text-sm font-semibold text-gray-900 text-center bg-transparent border-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="1"
                              />
                              <button 
                                onClick={() => onUpdateQuantity(index, 1)}
                                className="w-7 h-7 flex items-center justify-center bg-rose-600 hover:bg-rose-700 rounded-md text-white text-sm cursor-pointer shadow-sm font-bold leading-none"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          {item.taxName && item.taxPercentage && (
                            <p className="text-xs text-gray-400 mt-2">
                              {item.taxName}: {item.taxPercentage}% ({formatCurrency((item.price * item.quantity * item.taxPercentage) / 100, storeSettings, currencies)})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Coupon Section */}
                <div className="bg-rose-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Apply Coupon</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError('');
                      }}
                      placeholder="Enter coupon code"
                      className={`flex-1 px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 text-base bg-white ${
                        couponError ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    <button
                      onClick={() => handleApplyCoupon(subtotal)}
                      className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer font-medium text-sm sm:whitespace-nowrap"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <div className="mt-2 text-sm text-red-600">
                      {couponError}
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ Coupon "{appliedCoupon.code}" applied
                    </div>
                  )}
                </div>

                {/* Shipping Section */}
                <div className="bg-rose-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Shipping Methods</h4>
                  
                  {loadingShipping ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading shipping options...</p>
                    </div>
                  ) : shippingMethods.length > 0 ? (
                    <div className="space-y-2">
                      {shippingMethods.map((method) => (
                        <label key={method.id} className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                          <input
                            type="radio"
                            name="shipping"
                            value={method.id}
                            checked={selectedShipping === method.id.toString()}
                            onChange={(e) => setSelectedShipping(e.target.value)}
                            className="text-rose-600 focus:ring-rose-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{method.name}</div>
                            <div className="text-xs text-gray-500">{method.delivery_time || 'Standard delivery'}</div>
                            {method.description && (
                              <div className="text-xs text-gray-400">{method.description}</div>
                            )}
                          </div>
                          <div className="font-semibold text-sm">
                            {method.type === 'percentage_based' ? 
                              `${parseFloat(method.cost || 0)}%` : 
                            method.type === 'free' ? 'Free' :
                              formatCurrency(parseFloat(method.cost || 0), storeSettings, currencies)
                            }
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No shipping methods available</p>
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-rose-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(subtotal, storeSettings, currencies)}</span>
                    </div>
                    {totalTax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Tax</span>
                        <span className="font-semibold">{formatCurrency(totalTax, storeSettings, currencies)}</span>
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Coupon Discount{appliedCoupon.type === 'percentage' ? ` (${appliedCoupon.discount_amount}%)` : ''}</span>
                        <span>-{formatCurrency(couponDiscount, storeSettings, currencies)}</span>
                      </div>
                    )}
                    {shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-semibold">{formatCurrency(shippingCost, storeSettings, currencies)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-rose-200">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-xl font-bold text-rose-600">{formatCurrency(total, storeSettings, currencies)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="p-4 md:p-6">
                
                {loadingPayments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading payment options...</p>
                  </div>
                ) : paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.name} className={`border-2 rounded-lg transition-all ${
                        selectedPayment === method.name ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <label className="flex items-center gap-4 p-4 cursor-pointer">
                          <input
                            type="radio"
                            name="payment"
                            value={method.name}
                            checked={selectedPayment === method.name}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="text-rose-600 focus:ring-rose-500"
                          />
                          <div className="w-6 h-6 text-rose-600">
                            {method.icon ? (
                              <div dangerouslySetInnerHTML={{ __html: method.icon }} />
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{method.display_name}</h4>
                            {method.description && (
                              <p className="text-sm text-gray-600">{method.description}</p>
                            )}
                          </div>
                        </label>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Ordering is currently unavailable. Please try again later.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 border-t border-rose-100 bg-white flex-shrink-0 shadow-lg">
            <div className="md:hidden">
              <div className="text-right mb-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(total, storeSettings, currencies)}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  {step > firstStep && (
                    <button
                      onClick={handlePrevStep}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                </div>
                <div>
                  {step < 3 ? (
                    <button
                      onClick={handleNextStep}
                      disabled={
                        (step === 1 && (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone || !customerInfo.address)) ||
                        (step === 2 && !selectedShipping)
                      }
                      className="px-8 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={handlePlaceOrder}
                      disabled={
                        orderingUnavailable || isPlacingOrder ||
                        !selectedPayment
                      }
                      className="px-8 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isPlacingOrder ? 'Processing...' : selectedPayment === 'cod' ? 'Place order — pay on delivery' : 'Pay securely with Stripe'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex md:items-center md:justify-between gap-4">
              <div>
                {step > firstStep && (
                  <button
                    onClick={handlePrevStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-rose-600">{formatCurrency(total, storeSettings, currencies)}</p>
                </div>
                {step < 3 ? (
                  <button
                    onClick={handleNextStep}
                    disabled={
                      (step === 1 && (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone || !customerInfo.address)) ||
                      (step === 2 && !selectedShipping)
                    }
                    className="px-8 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={
                      orderingUnavailable || isPlacingOrder ||
                      !selectedPayment
                    }
                    className="px-8 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isPlacingOrder ? 'Processing...' : selectedPayment === 'cod' ? 'Place order — pay on delivery' : 'Pay securely with Stripe'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Checkout: React.FC<CheckoutProps> = ({ cartItems, currency, onClose, onOrderComplete, onUpdateCart, userProfile, isLoggedIn, onRemoveFromCart, onUpdateQuantity, onQuantityChange, store }) => {
  return (
    <CheckoutProvider userProfile={userProfile} isLoggedIn={isLoggedIn} store={store} onOrderComplete={onOrderComplete}>
      <CheckoutContent
        cartItems={cartItems}
        currency={currency}
        onClose={onClose}
        onOrderComplete={onOrderComplete}
        onUpdateCart={onUpdateCart}
        onRemoveFromCart={onRemoveFromCart}
        onUpdateQuantity={onUpdateQuantity}
        onQuantityChange={onQuantityChange}
      />
    </CheckoutProvider>
  );
};