import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { getImageUrl } from '../utils/image-helper';
import { generateStoreUrl } from '../utils/store-url-helper';

export interface OrderingSchedule {
  enabled: boolean;
  is_open: boolean;
  timezone: string;
  opens_at: string;
  closes_at: string;
  open_days: number[];
  delivery_days: number[];
  advance_days: number;
  server_now: string;
  next_change_at: string | null;
  message: string;
  delivery_dates: { value: string; label: string }[];
}

interface StoreConfig {
  orderingSchedule?: OrderingSchedule;
  storeName: string;
  logo?: string;
  favicon?: string;
  phoneNumber: string;
  currency: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  email?: string;
  description?: string;
  copyrightText?: string;
  welcomeMessage?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
    email?: string;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

interface Store {
  ordering_schedule?: OrderingSchedule;
  id: string | number;
  name: string;
  slug: string;
  email?: string;
  logo?: string;
  description?: string;
  theme?: string;
  custom_css?: string;
  custom_javascript?: string;
}

interface StoreContextType {
  config: StoreConfig;
  store: Store;
  orderingSchedule: OrderingSchedule | null;
  orderingUnavailable: boolean;
  scheduleError: string;
  refreshOrderingSchedule: () => Promise<OrderingSchedule>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
  config: StoreConfig;
  store: Store;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ 
  children, 
  config, 
  store 
}) => {
  const [orderingSchedule, setOrderingSchedule] = useState<OrderingSchedule | null>(config.orderingSchedule ?? store.ordering_schedule ?? null);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleStale, setScheduleStale] = useState(false);
  const pendingRefresh = useRef<Promise<OrderingSchedule> | null>(null);
  const scheduleObservedAt = useRef(performance.now());
  const refreshOrderingSchedule = useCallback((): Promise<OrderingSchedule> => {
    if (pendingRefresh.current) return pendingRefresh.current;
    const refresh = (async () => {
      try {
        const startedAt = performance.now();
        const response = await fetch(generateStoreUrl('store.ordering-status', store), {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error('Could not check ordering hours. Please try again.');
        const status: OrderingSchedule = await response.json();
        if (typeof status.enabled !== 'boolean' || typeof status.is_open !== 'boolean' || !Array.isArray(status.delivery_dates)) {
          throw new Error('Could not check ordering hours. Please try again.');
        }
        // Reject a response whose opening/closing boundary passed while it was in flight.
        if (status.enabled && status.next_change_at && Date.parse(status.next_change_at) - Date.parse(status.server_now) <= performance.now() - startedAt) {
          throw new Error('Ordering hours have changed. Please check again.');
        }
        scheduleObservedAt.current = startedAt;
        setOrderingSchedule(status);
        setScheduleError('');
        setScheduleStale(false);
        return status;
      } catch {
        const message = 'Could not check ordering hours. Please reconnect and try again.';
        setScheduleError(message);
        setScheduleStale(true);
        throw new Error(message);
      }
    })();
    pendingRefresh.current = refresh;
    const clearPending = () => { if (pendingRefresh.current === refresh) pendingRefresh.current = null; };
    void refresh.then(clearPending, clearPending);
    return refresh;
  }, [store]);

  useEffect(() => {
    const refresh = () => { void refreshOrderingSchedule().catch(() => {}); };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshOrderingSchedule]);

  useEffect(() => {
    if (!orderingSchedule?.enabled || !orderingSchedule.next_change_at) return;
    // Both timestamps come from the server, independent of the customer's clock or timezone.
    const delay = Date.parse(orderingSchedule.next_change_at) - Date.parse(orderingSchedule.server_now) - (performance.now() - scheduleObservedAt.current);
    if (!Number.isFinite(delay)) return;
    const timeout = window.setTimeout(() => {
      setScheduleStale(true);
      void refreshOrderingSchedule().catch(() => {});
    }, Math.min(2147483647, Math.max(0, delay)));
    return () => window.clearTimeout(timeout);
  }, [orderingSchedule, refreshOrderingSchedule]);

  // Set dynamic favicon once on mount
  useEffect(() => {
    if (config.favicon) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/x-icon';
        document.head.appendChild(favicon);
      }
      
      favicon.href = getImageUrl(config.favicon);
    }
  }, [config.favicon]);

  const value: StoreContextType = {
    config,
    store,
    orderingSchedule,
    orderingUnavailable: scheduleStale || !!(orderingSchedule?.enabled && !orderingSchedule.is_open),
    scheduleError,
    refreshOrderingSchedule,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
