import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';

interface AddItemDialogProps {
  type: 'project' | 'skill' | 'achievement';
  children?: React.ReactNode;
  onSave?: (data: any) => void;
}

const AddItemDialog = ({ type, children, onSave }: AddItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const { addProject, addSkill, addAchievement } = usePortfolio();

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organization: '',
    duration: '',
    name: '',
    category: '',
    level: '',
    experience: '',
    stack: '',
    features: '',
    url: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      organization: '',
      duration: '',
      name: '',
      category: '',
      level: '',
      experience: '',
      stack: '',
      features: '',
      url: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (onSave) {
        let data;
        if (type === 'project') {
          data = {
            id: Date.now().toString(),
            title: formData.title,
            description: formData.description,
            tech: formData.stack.split(',').map(s => s.trim()).filter(Boolean),
            features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
            demo: formData.url,
            repo: '',
            stars: 0
          };
        } else if (type === 'skill') {
          data = {
            name: formData.name,
            category: formData.category,
            level: formData.level,
            experience: formData.experience
          };
        } else if (type === 'achievement') {
          data = {
            title: formData.title,
            organization: formData.organization,
            duration: formData.duration,
            description: formData.description,
            type: 'internship' // Default type
          };
        }
        onSave(data);
        resetForm();
        setOpen(false);
        return;
      }

      if (type === 'project') {
        addProject({
          title: formData.title,
          description: formData.description,
          type: 'manual',
          stack: formData.stack.split(',').map(s => s.trim()).filter(Boolean),
          features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
          status: { imported: false, aiSummary: false, saved: true },
          lastUpdated: 'Just now',
          url: formData.url || undefined
        });
      } else if (type === 'skill') {
        addSkill({
          name: formData.name,
          category: formData.category,
          level: formData.level,
          experience: formData.experience
        });
      } else if (type === 'achievement') {
        addAchievement('internships', {
          title: formData.title,
          organization: formData.organization,
          duration: formData.duration,
          description: formData.description
        });
      }

      // Reset form and close dialog
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'project': return 'Add New Project';
      case 'skill': return 'Add New Skill';
      case 'achievement': return 'Add New Achievement';
      default: return 'Add Item';
    }
  };

  const isFormValid = () => {
    switch (type) {
      case 'project': return formData.title && formData.description;
      case 'skill': return formData.name && formData.category && formData.level;
      case 'achievement': return formData.title && formData.organization;
      default: return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'project' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your project"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stack">Tech Stack (comma-separated)</Label>
                <Input
                  id="stack"
                  value={formData.stack}
                  onChange={(e) => setFormData(prev => ({ ...prev, stack: e.target.value }))}
                  placeholder="React, Node.js, MongoDB"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Input
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                  placeholder="Authentication, Real-time updates"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Project URL (optional)</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
            </>
          )}

          {type === 'skill' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Skill Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter skill name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Cloud">Cloud</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="AI/ML">AI/ML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="2+ years"
                  required
                />
              </div>
            </>
          )}

          {type === 'achievement' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Achievement Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter achievement title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Enter organization name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Jun 2024 - Aug 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your achievement"
                />
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={!isFormValid()} className="flex-1">
              Add {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;