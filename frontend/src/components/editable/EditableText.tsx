import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';

interface EditableTextProps {
    value: string;
    onSave: (value: string) => void;
    className?: string;
    placeholder?: string;
    label?: string; // Optional label for accessibility/UI
}

export function EditableText({
    value,
    onSave,
    className,
    placeholder = 'Click to edit',
    label
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (tempValue !== value) {
            onSave(tempValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTempValue(value);
        }
    };

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={cn("h-auto py-1 px-2 min-w-[100px]", className)}
                placeholder={placeholder}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                "group relative cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors inline-block min-h-[1.5em] min-w-[50px]",
                className
            )}
            role="button"
            tabIndex={0}
            title="Click to edit"
        >
            {value || <span className="text-muted-foreground italic opacity-50">{placeholder}</span>}
            <Pencil className="w-3 h-3 absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 text-muted-foreground" />
        </div>
    );
}
