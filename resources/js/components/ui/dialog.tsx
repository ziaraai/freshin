import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useModalStack } from "@/contexts/ModalStackContext"
import { useLayout } from "@/contexts/LayoutContext"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const useIsRtl = () => {
  let layoutRtl = false;
  try {
    const layout = useLayout();
    if (layout) {
      layoutRtl = layout.isRtl || layout.effectivePosition === 'right' || layout.position === 'right';
    }
  } catch (e) {
    // Outside LayoutProvider
  }

  const checkDomRtl = () => {
    if (typeof document !== 'undefined') {
      if (document.documentElement.dir === 'rtl' || document.documentElement.getAttribute('dir') === 'rtl') return true;
      if (document.body?.getAttribute('dir') === 'rtl') return true;
      if (document.cookie.includes('layoutPosition=right') || document.cookie.includes('layoutDirection=right')) return true;
      const pageProps = (window as any).page?.props;
      if (pageProps?.globalSettings?.layoutDirection === 'right') return true;
      const userLang = pageProps?.userLanguage || localStorage.getItem('i18nextLng');
      if (userLang && ['ar', 'he', 'fa', 'ur'].includes(userLang)) return true;
    }
    return false;
  };

  const [isRtl, setIsRtl] = React.useState<boolean>(() => layoutRtl || checkDomRtl());

  React.useEffect(() => {
    setIsRtl(layoutRtl || checkDomRtl());

    const handleLanguageChange = (event: any) => {
      const direction = event?.detail?.direction;
      if (direction) {
        setIsRtl(direction === 'right');
      } else {
        setIsRtl(layoutRtl || checkDomRtl());
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    window.addEventListener('layoutDirectionChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
      window.removeEventListener('layoutDirectionChanged', handleLanguageChange);
    };
  }, [layoutRtl]);

  return layoutRtl || isRtl;
};

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { modalId?: string }
>(({ className, modalId, ...props }, ref) => {
  const { getZIndex, modalStack } = useModalStack();
  const zIndex = modalId ? getZIndex(modalId) : 50;
  const modalIndex = modalStack.indexOf(modalId || '');
  const isFirstModal = modalIndex <= 0;

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        isFirstModal ? "bg-black/30" : "bg-black/25",
        className
      )}
      style={{ zIndex }}
      onPointerDown={(e) => {
        // Allow clicks on elements with higher z-index (like FloatingChatGpt)
        const target = e.target as HTMLElement;
        const targetZIndex = parseInt(window.getComputedStyle(target).zIndex) || 0;
        if (targetZIndex > zIndex) {
          return;
        }
        // Allow ChatGPT button clicks
        if (target.closest('[data-chatgpt-button]')) {
          e.stopPropagation();
          return;
        }
      }}
      {...props}
    />
  );
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { modalId?: string }
>(({ className, children, modalId, ...props }, ref) => {
  const { registerModal, unregisterModal, getZIndex, modalStack } = useModalStack();
  const [currentModalId] = React.useState(() => modalId || `modal-${Date.now()}-${Math.random()}`);
  const isRtl = useIsRtl();
  const resolvedDir = (props as any).dir || (isRtl ? 'rtl' : 'ltr');
  const isEffectiveRtl = resolvedDir === 'rtl';

  React.useEffect(() => {
    registerModal(currentModalId);
    return () => unregisterModal(currentModalId);
  }, [currentModalId, registerModal, unregisterModal]);

  const zIndex = getZIndex(currentModalId);

  return (
    <DialogPortal>
      <DialogOverlay modalId={currentModalId} />
      <DialogPrimitive.Content
        ref={ref}
        dir={resolvedDir}
        data-direction={resolvedDir}
        className={cn(
          "fixed left-[50%] top-[50%] grid w-[calc(100%-2rem)] sm:w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg pointer-events-auto",
          isEffectiveRtl ? "rtl text-right" : "ltr text-left",
          className
        )}
        style={{
          zIndex: zIndex + 1,
          direction: isEffectiveRtl ? 'rtl' : 'ltr',
          textAlign: isEffectiveRtl ? 'right' : 'left',
          ...props.style,
        }}
        onPointerDownOutside={(e) => {
          const target = e.target as Element;
          if (target.closest('[data-chatgpt-button]') || target.closest('[data-chatgpt-modal]')) {
            // Allow clicking ChatGPT elements even if this modal is active
            return;
          }
          // Prevent closing when clicking outside the modal
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside the modal
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // By calling stopPropagation, we ensure that only the top-most Radix layer 
          // (which receives the event first) handles this Escape press.
          e.stopPropagation();
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            "cursor-pointer absolute top-4 rounded-md p-1.5 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
            isEffectiveRtl ? "left-4 right-auto" : "right-4 left-auto"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-start rtl:text-right border-b pb-3",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t pt-3",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-snug tracking-tight break-words text-start rtl:text-right",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground text-start rtl:text-right", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}