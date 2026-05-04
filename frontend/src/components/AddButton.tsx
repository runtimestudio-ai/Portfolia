import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddButtonProps extends React.ComponentProps<typeof Button> {
    label: string;
}

export const AddButton = forwardRef<HTMLButtonElement, AddButtonProps>(
    ({ onClick, label, className, size = 'lg', ...props }, ref) => {
        return (
            <Button
                ref={ref}
                variant="outline"
                size={size}
                onClick={onClick}
                className={cn(
                    "group hover:bg-primary hover:text-primary-foreground transition-all mx-auto flex",
                    className
                )}
                {...props}
            >
                <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                {label}
            </Button>
        );
    }
);

AddButton.displayName = 'AddButton';
