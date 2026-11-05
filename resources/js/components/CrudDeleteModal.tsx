// components/CrudDeleteModal.tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface CrudDeleteModalProps {
    isOpen?: boolean;
    open?: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    entityName: string;
}

export function CrudDeleteModal({
  isOpen,
  open, 
  onClose,
  onConfirm,
  itemName,
  entityName
}: CrudDeleteModalProps) {
    const isModalOpen = isOpen !== undefined ? isOpen : (open !== undefined ? open : false);
    const { t } = useTranslation();
    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {t('Delete')} {entityName}
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    {t('Are you sure you want to delete')} {itemName || `this ${entityName}`}? {t('This action cannot be undone.')}
                </DialogDescription>
                <DialogFooter className="shrink-0 pt-4 border-t sm:justify-end">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t('Cancel')}
                    </Button>
                    <Button type="button" variant="destructive" onClick={onConfirm}>
                        {t('Delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}