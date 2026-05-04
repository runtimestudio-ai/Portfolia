import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableResultProps {
    items: string[];
    onAdd: (item: string) => void;
    onRemove: (index: number) => void;
    className?: string;
    placeholder?: string;
}

export function EditableChipList({
    items,
    onAdd,
    onRemove,
    className,
    placeholder = "Add item..."
}: EditableResultProps) {
    const [newItem, setNewItem] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem('');
            // Keep adding mode open for rapid entry
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setNewItem('');
        }
    };

    return (
        <div className={cn("flex flex-wrap gap-2 items-center", className)}>
            {items.map((item, index) => (
                <Badge
                    key={`${item}-${index}`}
                    variant="secondary"
                    className="group pr-1 hover:bg-secondary/80 transition-colors cursor-default"
                >
                    {item}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(index);
                        }}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </Badge>
            ))}

            {isAdding ? (
                <div className="flex items-center gap-1">
                    <Input
                        autoFocus
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            if (newItem.trim()) handleAdd();
                            setIsAdding(false);
                        }}
                        className="h-6 w-32 text-xs px-2"
                        placeholder={placeholder}
                    />
                </div>
            ) : (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAdding(true)}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                </Button>
            )}
        </div>
    );
}
