import { useState, useEffect } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { ChatGptModal } from '@/components/chatgpt';
import { Button } from '@/components/ui/button';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';

const useIsRtl = () => {
  try {
    const layout = useLayout();
    if (layout?.position === 'right' || (layout as any)?.effectivePosition === 'right' || layout?.isRtl) {
      return true;
    }
  } catch {
    // ignore
  }
  if (typeof document !== 'undefined') {
    return (
      document.documentElement.dir === 'rtl' ||
      document.documentElement.getAttribute('dir') === 'rtl' ||
      document.body?.getAttribute('dir') === 'rtl' ||
      Boolean(document.querySelector('[dir="rtl"]'))
    );
  }
  return false;
};

export function FloatingChatGpt() {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const { position } = useLayout();
  const isRtl = position === 'right';
  const [isOpen, setIsOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  // Check if user can access ChatGPT
  const userRole = auth?.roles?.[0] || auth?.user?.type;
  const isSuperAdmin = userRole === 'superadmin' || auth?.user?.type === 'superadmin';
  const isCompany = auth?.user?.type === 'company';

  let canUseChatGPT = false;

  if (isSuperAdmin) {
    canUseChatGPT = true;
  } else if (isCompany) {
    // For company users, check their own plan
    const hasActivePlan = auth?.user?.plan_is_active === 1 && auth?.user?.plan;
    canUseChatGPT = hasActivePlan && auth?.user?.plan?.enable_chatgpt === 'on';
  } else {
    // For other users, check the plan of the company user who created them
    const creator = auth?.user?.creator;
    const hasActivePlan = creator?.plan_is_active === 1 && creator?.plan;
    canUseChatGPT = hasActivePlan && creator?.plan?.enable_chatgpt === 'on';
  }

  useEffect(() => {
  }, [isOpen]);

  // Don't render if user doesn't have access
  if (!canUseChatGPT) {
    return null;
  }

  const handleGenerate = (content: string) => {
    setGeneratedContent(content);
    // You can add additional logic here if needed
  };

  const handleModalOpen = () => {
    setIsOpen(true);
  };

  const handleModalClose = () => {
    setIsOpen(false);
  };

  return createPortal(
    <>
      <div
        className={`fixed bottom-2 md:bottom-6 z-[80000] pointer-events-auto ${isRtl ? 'left-6' : 'right-6'}`}
        data-chatgpt-button
        style={{
          pointerEvents: 'auto',
          zIndex: 80000,
          cursor: 'pointer',
          left: isRtl ? '1.5rem' : 'auto',
          right: isRtl ? 'auto' : '1.5rem',
        }}
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          handleModalOpen();
        }}
        onMouseDownCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleModalOpen();
          }}
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow pointer-events-auto cursor-pointer sm:h-14 sm:w-14"
          size="lg"
          data-chatgpt-button
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </div>

      <ChatGptModal
        isOpen={isOpen}
        onClose={handleModalClose}
        onGenerate={handleGenerate}
        title={t("AI Assistant")}
        placeholder={t("What would you like me to help you generate?")}
      />
    </>,
    document.body
  );
}