import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    itemName: string;
    itemType: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteConfirmationDialog({
    isOpen,
    itemName,
    itemType,
    onConfirm,
    onCancel,
}: DeleteConfirmationDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        Delete {itemType}?
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-3">
                    <p className="text-sm text-foreground">
                        Are you sure you want to delete this {itemType.toLowerCase()}?
                    </p>
                    <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium text-foreground">{itemName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This action cannot be undone.
                    </p>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
