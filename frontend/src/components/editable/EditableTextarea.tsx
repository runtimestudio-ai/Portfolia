import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';

interface EditableTextareaProps {
    value: string;
    onSave: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function EditableTextarea({
    value,
    onSave,
    className,
    placeholder = 'Click to edit description...'
}: EditableTextareaProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            // Adjust height to fit content
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (tempValue !== value) {
            onSave(tempValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Save on Ctrl+Enter or Cmd+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTempValue(value);
        }
    };

    if (isEditing) {
        return (
            <Textarea
                ref={textareaRef}
                value={tempValue}
                onChange={(e) => {
                    setTempValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={cn("min-h-[100px] resize-none", className)}
                placeholder={placeholder}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                "group relative cursor-pointer rounded p-2 -m-2 hover:bg-muted/50 transition-colors whitespace-pre-wrap min-h-[3em]",
                className
            )}
            role="button"
            tabIndex={0}
            title="Click to edit"
        >
            {value || <span className="text-muted-foreground italic opacity-50">{placeholder}</span>}
            <Pencil className="w-3 h-3 absolute top-2 right-2 opacity-0 group-hover:opacity-50 text-muted-foreground" />
        </div>
    );
}
