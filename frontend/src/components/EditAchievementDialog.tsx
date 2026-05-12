import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export interface Achievement {
  id: number;
  title: string;
  organization: string;
  duration?: string;
  year?: string;
  location?: string;
  description: string;
  skills?: string[];
  credentialId?: string;
  category?: string;
  issuer?: string;
  status?: string;
}

interface EditAchievementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: Achievement | null;
  onSave: (achievement: Achievement) => void;
  type: 'internship' | 'certificate' | 'award';
}

const EditAchievementDialog = ({ isOpen, onClose, achievement, onSave, type }: EditAchievementDialogProps) => {
  const [formData, setFormData] = useState<Achievement>(() => ({
    id: achievement?.id || 0,
    title: achievement?.title || '',
    organization: achievement?.organization || '',
    description: achievement?.description || '',
    duration: achievement?.duration || '',
    year: achievement?.year || '',
    location: achievement?.location || '',
    skills: achievement?.skills || [],
    credentialId: achievement?.credentialId || '',
    category: achievement?.category || '',
    issuer: achievement?.issuer || '',
    status: achievement?.status || ''
  }));

  // Update form data when achievement prop changes
  useEffect(() => {
    if (achievement) {
      setFormData({
        id: achievement.id || 0,
        title: achievement.title || '',
        organization: achievement.organization || '',
        description: achievement.description || '',
        duration: achievement.duration || '',
        year: achievement.year || '',
        location: achievement.location || '',
        skills: achievement.skills || [],
        credentialId: achievement.credentialId || '',
        category: achievement.category || '',
        issuer: achievement.issuer || '',
        status: achievement.status || ''
      });
    }
  }, [achievement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleInputChange = (field: keyof Achievement, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderFormFields = () => {
    switch (type) {
      case 'internship':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Company</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration || ''}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
            </div>
          </>
        );
      
      case 'certificate':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Certificate Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Input
                  id="issuer"
                  value={formData.issuer || ''}
                  onChange={(e) => handleInputChange('issuer', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={formData.year || ''}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credentialId">Credential ID</Label>
              <Input
                id="credentialId"
                value={formData.credentialId || ''}
                onChange={(e) => handleInputChange('credentialId', e.target.value)}
              />
            </div>
          </>
        );
      
      case 'award':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Award Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={formData.year || ''}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>
            Modify the details of your {type} below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex space-x-3">
            <Button type="submit" className="btn-primary flex-1">
              Update {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAchievementDialog;