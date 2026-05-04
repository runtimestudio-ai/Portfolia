import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Project } from '@/types/project';

interface ProjectFormProps {
    project: Project;
    onSave: (updatedProject: Project) => Promise<void>;
    onClose: () => void;
}

export function ProjectForm({ project, onSave, onClose }: ProjectFormProps) {
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description || '');
    const [stack, setStack] = useState((project.stack || []).join(', '));
    const [features, setFeatures] = useState((project.features || []).join(', '));
    const [link, setLink] = useState(project.link || '');
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Sync state if project prop changes (e.g., opening modal for different project)
    useEffect(() => {
        setTitle(project.title);
        setDescription(project.description || '');
        setStack((project.stack || []).join(', '));
        setFeatures((project.features || []).join(', '));
        setLink(project.link || '');
    }, [project]);

    const handleSave = async () => {
        setErr(null);

        const payload: Project = {
            ...project,
            title: title.trim(),
            description: description.trim(),
            stack: stack.split(',').map(s => s.trim()).filter(Boolean),
            features: features.split(',').map(s => s.trim()).filter(Boolean),
            link: link.trim(),
        };

        try {
            setSubmitting(true);
            await onSave(payload);
            onClose();
        } catch (e: any) {
            console.error(e);
            setErr(e?.message || 'Failed to update project');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="space-y-4">
            {err && <div className="text-sm text-destructive">{err}</div>}

            <div className="space-y-2">
                <Label htmlFor="edit-title">Project Title</Label>
                <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-stack">Tech Stack</Label>
                <Input
                    id="edit-stack"
                    value={stack}
                    onChange={(e) => setStack(e.target.value)}
                    placeholder="React, FastAPI, PostgreSQL"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-features">Features</Label>
                <Input
                    id="edit-features"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="CRUD, Auth"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-link">Link</Label>
                <Input
                    id="edit-link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                />
            </div>

            <div className="flex space-x-3">
                <Button className="btn-electric flex-1" onClick={handleSave} disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
                </Button>
                <Button className="btn-primary" variant="secondary" onClick={handleClose} disabled={submitting}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
