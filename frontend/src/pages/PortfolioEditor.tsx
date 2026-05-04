import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Download,
  Copy,
  Star,
  Calendar,
  MapPin,
  Award,
  Code,
  Eye,
  Share2,
  Sparkles,
  Palette,
  Zap,
  Waves,
  Globe,
  Building,
  Settings,
  Trophy,
  GraduationCap,
  BarChart3,
  Activity,
  Briefcase,
  Edit3,
  CheckCircle,
  ArrowRight,
  Code2,
  Rocket,
  Target,
  Lightbulb,
  User,
  BookOpen,
  Layers,
  Send,
  Trash2,
  Plus,
  ShieldCheck,
  Pencil
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AIAssistant from "@/components/AIAssistant";
import AIEditAssistant from "@/components/AIEditAssistant";
import AIAssistantPanel from "@/components/AIAssistantPanel";
import { useAuthContext } from '@/contexts/AuthContext';
import { EditableText } from "@/components/editable/EditableText";
import { EditableTextarea } from "@/components/editable/EditableTextarea";
import { EditableChipList } from "@/components/editable/EditableChipList";
import { ProjectForm } from '@/components/forms/ProjectForm';
import EditAchievementDialog, { Achievement as AchievementType } from '@/components/EditAchievementDialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { AddButton } from '@/components/AddButton';
import AddItemDialog from '@/components/AddItemDialog';
import { EditorHeader } from '@/components/EditorHeader';
import { VerticalToggle } from '@/components/VerticalToggle';
import { ChevronLeft } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getEditorDraft, saveDraft, publishPortfolio, updateProject as updateProjectAPI, updateAchievementAPI } from "@/utils/api";
import { useDebounce } from "@/hooks/useDebounce";

interface Skill {
  name: string;
  level: number;
  category: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  features?: string[];
  demo: string;
  repo: string;
  stars: number;
  featured?: boolean;
}

interface Achievement {
  id?: string | number;
  title: string;
  issuer: string;
  organization?: string;
  date: string;
  description: string;
  type: 'internship' | 'award' | string;
}

interface Certificate {
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  description?: string;
  status?: string;
}

interface WorkExperience {
  title: string;
  organization: string;
  duration: string;
  location?: string;
  description: string;
  skills: string[];
  status: string;
}

interface PortfolioData {
  username: string;
  name: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  about: string;
  avatar?: string;
  theme_preference: string;
  projects: Project[];
  skills: Skill[];
  achievements: Achievement[];  // Contains BOTH work experiences and awards
  certificates: Certificate[];
}

type TemplateType = 'classic' | 'creative' | 'modern';

const PortfolioEditor = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(true);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateType>('classic');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const { user, loading } = useAuthContext();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categorySkills, setCategorySkills] = useState<{ name: string; level: number }[]>([]);
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'unsaved'>('saved');
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Edit Modals State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<{
    item: AchievementType | null;
    type: 'internship' | 'certificate' | 'award';
    isOpen: boolean;
  }>({ item: null, type: 'internship', isOpen: false });

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'project' | 'skill' | 'achievement' | 'certificate';
    index: number;
    name: string;
  } | null>(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);

  // Handlers for reusing edit forms
  const handleSaveProject = async (updatedProject: Project) => {
    if (!portfolioData) return;

    // Update local state
    const newProjects = portfolioData.projects.map(p =>
      p.id === updatedProject.id ? updatedProject : p
    );

    const newPortfolioData = { ...portfolioData, projects: newProjects };
    setPortfolioData(newPortfolioData);
  };

  const handleSaveAchievement = async (updatedAchievement: AchievementType) => {
    if (!portfolioData) return;

    const { type } = editingAchievement;
    let newPortfolioData = { ...portfolioData };

    if (type === 'internship' || type === 'award') {
      newPortfolioData = {
        ...newPortfolioData,
        achievements: portfolioData.achievements.map(a =>
          (String(a.id) === String(updatedAchievement.id) || a.title === updatedAchievement.title) ? { ...a, ...updatedAchievement } : a
        )
      };
    } else if (type === 'certificate') {
      newPortfolioData = {
        ...newPortfolioData,
        certificates: portfolioData.certificates.map((c, i) =>
          (String(i) === String(updatedAchievement.id) || c.title === updatedAchievement.title) ? { ...c, ...updatedAchievement } : c
        )
      };
    }

    setPortfolioData(newPortfolioData);
    setEditingAchievement(prev => ({ ...prev, isOpen: false }));
  };

  // Delete Confirmation Handler
  const handleConfirmDelete = () => {
    if (!deleteConfirm || !portfolioData) return;

    const newData = { ...portfolioData };

    switch (deleteConfirm.type) {
      case 'project':
        newData.projects.splice(deleteConfirm.index, 1);
        toast({ title: "Project deleted", description: "Project removed from portfolio." });
        break;
      case 'skill':
        newData.skills.splice(deleteConfirm.index, 1);
        toast({ title: "Skill deleted", description: "Skill removed from portfolio." });
        break;
      case 'achievement':
        newData.achievements.splice(deleteConfirm.index, 1);
        toast({ title: "Achievement deleted", description: "Achievement removed from portfolio." });
        break;
      case 'certificate':
        newData.certificates.splice(deleteConfirm.index, 1);
        toast({ title: "Certificate deleted", description: "Certificate removed from portfolio." });
        break;
    }

    setPortfolioData(newData);
    setDeleteConfirm(null);
  };

  // Templates configuration - defined before useEffect to avoid initialization errors
  const templates = {
    classic: {
      name: 'Classic Pro',
      icon: <Briefcase className="w-4 h-4" />,
      styles: {
        background: 'bg-gradient-to-br from-gray-50 via-blue-50 to-white dark:from-slate-900 dark:via-blue-950 dark:to-slate-900',
      }
    },
    creative: {
      name: 'Dev Terminal',
      icon: <Code2 className="w-4 h-4" />,
      styles: {
        background: 'bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-900 dark:via-orange-950 dark:to-slate-900',
      }
    },
    modern: {
      name: 'Modern Grid',
      icon: <Zap className="w-4 h-4" />,
      styles: {
        background: 'bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
      }
    }
  };

  const handlePublish = async () => {
    const confirmed = window.confirm(
      'Publish working changes to your live portfolio?'
    );

    if (!confirmed) return;

    try {
      setSaveStatus('saving');
      const result = await publishPortfolio();

      toast({
        title: 'Success',
        description: result.message || 'Portfolio published successfully!',
        variant: 'default',
      });
      setSaveStatus('saved');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.detail || 'Failed to publish',
        variant: 'destructive',
      });
      setSaveStatus('unsaved');
    }
  };

  const handleViewMode = () => {
    // Use authenticated user's username from auth context
    if (user?.username) {
      navigate(`/portfolio/${user.username}`);
    } else {
      // Fallback to portfolioData if user context not available
      if (portfolioData?.username) {
        navigate(`/portfolio/${portfolioData.username}`);
      }
    }
  };
  useEffect(() => {
    const loadDraft = async () => {
      try {
        setIsLoading(true);
        const response = await getEditorDraft();


        // Transform nested draft structure to flat structure expected by component
        const flatData = {
          username: response.data.profile?.username || '',
          name: response.data.profile?.name || '',
          title: response.data.profile?.title || '',
          tagline: response.data.profile?.tagline || '',
          email: response.data.profile?.email || '',
          location: response.data.profile?.location || '',
          about: response.data.profile?.about || '',
          github: response.data.profile?.github || '',
          linkedin: response.data.profile?.linkedin || '',
          website: response.data.profile?.website || '',
          avatar: response.data.profile?.avatar || '',

          // Transform projects to match frontend interface
          projects: (response.data.projects || []).map((p: any) => ({
            id: String(p.id || ''),
            title: p.title || '',
            description: p.description || '',
            tech: p.technologies || p.tech || [],
            features: p.features || [],
            demo: p.demo_url || p.demo || '',
            repo: p.github_url || p.repo || '',
            stars: p.stars || 0,
            featured: p.featured || false
          })),

          // Transform skills to ensure consistent structure
          skills: (response.data.skills || []).map((s: any) => ({
            name: s.name || s.skill_name || '',
            level: s.level || s.proficiency || 0,
            category: s.category || s.type || 'Other'
          })),

          // Transform achievements/awards to ensure consistent structure
          // Backend uses "awards" key, but we normalize to "achievements"
          // IMPORTANT: Combine work_experiences AND awards into achievements array
          achievements: [
            // Add work experiences as achievements with type 'internship'
            ...(response.data.work_experiences || []).map((w: any) => ({
              title: w.title || '',
              issuer: w.organization || '',
              date: w.duration || '',
              description: w.description || '',
              type: 'internship' as const
            })),
            // Add awards as achievements with type 'award'
            ...(response.data.awards || []).map((a: any) => ({
              title: a.title || '',
              issuer: a.issuer || a.organization || '',
              date: a.date || a.year || a.awarded_date || '',
              description: a.description || '',
              type: a.type || a.category || 'award' as const
            }))
          ],

          // Transform certificates to ensure consistent structure
          certificates: (response.data.certificates || []).map((c: any) => ({
            title: c.title || c.name || '',
            issuer: c.issuer || c.organization || '',
            date: c.year || c.date || c.issued_date || '',  // Map 'year' to 'date'
            credentialId: c.credentialId || c.credential_id || c.id || '',
            description: c.description || '',
            status: c.status || ''
          })),

          theme_preference: response.data.settings?.theme_preference || 'classic',
        };


        setPortfolioData(flatData as any);
        setSaveStatus('saved');

        // Set template from flattened data
        if (flatData.theme_preference && templates[flatData.theme_preference as TemplateType]) {
          setCurrentTemplate(flatData.theme_preference as TemplateType);
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to load portfolio');
        console.error('Error loading draft:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, []);

  // Auto-save functionality
  const debouncedPortfolioData = useDebounce(portfolioData, 2000); // Wait 2s after last change

  // Track if initial load is complete preventing save on mount
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!isLoading && portfolioData) {
      isLoaded.current = true;
    }
  }, [isLoading, portfolioData]);

  useEffect(() => {
    const saveData = async () => {
      if (!debouncedPortfolioData || !isLoaded.current) return;

      try {
        setSaveStatus('saving');
        // Transform flat data back to nested draft structure expected by backend API
        const payload = {
          profile: {
            username: debouncedPortfolioData.username,
            name: debouncedPortfolioData.name,
            title: debouncedPortfolioData.title,
            tagline: debouncedPortfolioData.tagline,
            location: debouncedPortfolioData.location,
            email: debouncedPortfolioData.email,
            github: debouncedPortfolioData.github,
            linkedin: debouncedPortfolioData.linkedin,
            about: debouncedPortfolioData.about,
            avatar: debouncedPortfolioData.avatar
          },
          projects: debouncedPortfolioData.projects.map(p => ({
            ...p,
            stack: p.tech || [],
            link: p.demo || p.repo || '',
            type: (p.repo && p.repo.includes('github')) ? 'github' : 'others'
          })),
          skills: debouncedPortfolioData.skills,
          certificates: debouncedPortfolioData.certificates.map(c => ({
            title: c.title,
            issuer: c.issuer,
            year: c.date || '',  // Map 'date' to 'year'
            credential_id: c.credentialId || '',  // Map 'credentialId' to 'credential_id'
            description: c.description || '',
            status: c.status || ''
          })),

          work_experiences: debouncedPortfolioData.achievements
            .filter(a => a.type === 'internship')
            .map(w => ({
              title: w.title,
              organization: w.issuer,
              duration: w.date,
              description: w.description,
              status: 'completed',
              skills: []
            })),

          awards: debouncedPortfolioData.achievements
            .filter(a => a.type !== 'internship')
            .map(a => ({
              title: a.title,
              organization: a.issuer,
              year: a.date,
              description: a.description,
              category: a.type
            })),

          settings: {
            theme_preference: debouncedPortfolioData.theme_preference
          }
        };

        await saveDraft(payload);
        setSaveStatus('saved');
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus('unsaved');
        toast({
          title: "Auto-save failed",
          description: "Your changes couldn't be saved. Please check your connection.",
          variant: "destructive"
        });
      }
    };

    saveData();
  }, [debouncedPortfolioData]);



  if (loading || isLoading) return <p>Loading...</p>;

  if (!portfolioData) return <p>No portfolio data found</p>;

  const handleTemplateChange = (templateKey: TemplateType) => {
    setCurrentTemplate(templateKey);
    toast({
      title: "Theme Preview",
      description: `Previewing ${templates[templateKey].name} theme.`,
    });
  };

  const currentStyles = templates[currentTemplate].styles;


  const copyPortfolioLink = () => {
    navigator.clipboard.writeText("https://portfolio.alexchen.dev");
  };

  const skillsByCategory = portfolioData.skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const EditButton = ({ section }: { section: string }) => (
    isEditMode && (
      <Button
        size="sm"
        variant="outline"
        className="absolute top-4 right-4 z-10 w-8 h-8 p-0 bg-white/80 backdrop-blur-sm border-white/50 hover:bg-white shadow-lg"
        onClick={() => setEditingSection(section)}
      >
        <Edit3 className="w-4 h-4 text-gray-700" />
      </Button>
    )
  );

  return (
    <div className={`min-h-screen transition-all duration-700 ${currentStyles.background}`}>
      <Navbar />

      {/* Header moved to internal panel */}


      {/* Template Selector Sidebar */}
      {showTemplateSelector && (
        <div className="fixed top-32 right-6 z-40">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-border rounded-xl p-3 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground font-medium">Templates</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateSelector(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <div className="flex flex-col space-y-2">
              {Object.entries(templates).map(([key, template]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={currentTemplate === key ? "default" : "outline"}
                  onClick={() => {
                    handleTemplateChange(key as TemplateType);
                    setShowTemplateSelector(false);
                  }}
                  className={`w-12 h-12 p-0 rounded-lg transition-all duration-300 ${currentTemplate === key
                    ? `bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg`
                    : `bg-white/30 backdrop-blur-sm border-border hover:bg-muted`
                    }`}
                  title={template.name}
                >
                  {template.icon}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TWO-PANEL EDITOR LAYOUT */}
      <div className="flex h-[calc(100vh-80px)] overflow-hidden pt-16">
        {/* LEFT PANEL CONTAINER - Takes all remaining space */}
        <div className={`flex flex-col h-full transition-all duration-300 flex-1 min-w-0`}>
          <EditorHeader
            onViewMode={handleViewMode}
            onPublish={handlePublish}
            onToggleTemplates={() => setShowTemplateSelector(!showTemplateSelector)}
            saveStatus={saveStatus}
            showTemplateSelector={showTemplateSelector}
          />
          <div className="flex-1 overflow-y-auto border-r border-border relative">
            <main className="p-8">
              {/* Portfolio content will render here */}
              <div className="space-y-6 relative">

                {/* Template 1: Professional Clean Design */}
                {currentTemplate === 'classic' && (
                  <div>
                    <div className="fixed inset-0 pointer-events-none z-0">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.03) 0%, transparent 50%), 
                                  radial-gradient(circle at 75% 75%, hsl(var(--primary) / 0.02) 0%, transparent 50%)`
                      }} />
                    </div>

                    {/* Clean Professional Hero Section */}
                    <section className="relative min-h-screen flex items-center justify-center">
                      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                          {/* Professional Avatar */}
                          <div className="flex-shrink-0 relative">
                            <Avatar className="w-48 h-48 lg:w-56 lg:h-56 mx-auto ring-4 ring-border shadow-xl">
                              <AvatarImage src={portfolioData.avatar || "/placeholder.svg"} alt={portfolioData.name} className="object-cover" />
                              <AvatarFallback className="text-5xl font-bold bg-primary text-primary-foreground">
                                {portfolioData.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>

                            {/* Professional Status Badge */}
                            <div className="absolute -bottom-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                              <span>Available</span>
                            </div>
                          </div>

                          {/* Professional Typography */}
                          <div className="flex-1 text-center lg:text-left space-y-6">
                            <div className="space-y-4">
                              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                                <EditableText
                                  value={portfolioData.name}
                                  onSave={(val) => {
                                    const newData = { ...portfolioData };
                                    newData.name = val;
                                    setPortfolioData(newData);
                                  }}
                                  placeholder="Your Name"
                                />
                              </h1>

                              <div className="space-y-2">
                                <div className="text-2xl lg:text-3xl font-medium text-muted-foreground">
                                  <EditableText
                                    value={portfolioData.title}
                                    onSave={(val) => {
                                      const newData = { ...portfolioData };
                                      newData.title = val;
                                      setPortfolioData(newData);
                                    }}
                                    placeholder="Professional Title"
                                  />
                                </div>
                                <div className="w-24 h-1 bg-primary mx-auto lg:mx-0 rounded-full" />
                              </div>

                              <div className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed block">
                                <EditableTextarea
                                  value={portfolioData.tagline || ''}
                                  onSave={(val) => {
                                    const newData = { ...portfolioData };
                                    newData.tagline = val;
                                    setPortfolioData(newData);
                                  }}
                                  placeholder="Brief tagline or intro..."
                                  className="min-h-[3rem]"
                                />
                              </div>
                            </div>

                            {/* Clean Contact Info */}
                            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                              <div className="bg-card border border-border px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <EditableText
                                  value={portfolioData.location}
                                  onSave={(val) => {
                                    const newData = { ...portfolioData };
                                    newData.location = val;
                                    setPortfolioData(newData);
                                  }}
                                  placeholder="City, Country"
                                  className="font-medium"
                                />
                              </div>
                              <a
                                href={`mailto:${portfolioData.email}`}
                                className="bg-card border border-border px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">{portfolioData.email}</span>
                              </a>
                              <a
                                href={`${portfolioData.github}`}
                                className="bg-card border border-border px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm hover:shadow-md transition-shadow"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Github className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">{portfolioData.github}</span>
                              </a>
                              <a
                                href={`${portfolioData.linkedin}`}
                                className="bg-card border border-border px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm hover:shadow-md transition-shadow"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Linkedin className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">{portfolioData.linkedin}</span>
                              </a>
                            </div>

                            {/* Professional CTA Buttons */}
                            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-6">
                              <Button
                                size="lg"
                                className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                                onClick={copyPortfolioLink}
                              >
                                <Copy className="w-5 h-5 mr-3" />
                                Share Portfolio
                              </Button>
                              <Button
                                size="lg"
                                variant="outline"
                                className="shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                <Download className="w-5 h-5 mr-3" />
                                Download Resume
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Professional Stats Section */}
                    <section className="py-6 px-6 relative">
                      <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <Card className="bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <Code className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-2">{portfolioData.projects.length}+</div>
                            <div className="text-muted-foreground text-sm">Projects</div>
                          </Card>
                          <Card className="bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-2">{portfolioData.achievements.length}+</div>
                            <div className="text-muted-foreground text-sm">Achievements</div>
                          </Card>
                          <Card className="bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <GraduationCap className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-2">{portfolioData.certificates.length}+</div>
                            <div className="text-muted-foreground text-sm">Certificates</div>
                          </Card>
                          <Card className="bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <BarChart3 className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-2">{portfolioData.skills.length}+</div>
                            <div className="text-muted-foreground text-sm">Skills</div>
                          </Card>
                        </div>
                      </div>
                    </section>

                    {/* Professional About Me Section */}
                    <section className="py-6 px-6 relative">
                      <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                          <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground">About Me</h2>
                          </div>
                          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
                        </div>

                        <Card className="bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 relative group">
                          <EditButton section="about" />

                          <div className="p-8">
                            <div className="max-w-3xl mx-auto">
                              <EditableTextarea
                                value={portfolioData.about}
                                onSave={(val) => {
                                  const newData = { ...portfolioData };
                                  newData.about = val;
                                  setPortfolioData(newData);
                                }}
                                className="text-lg text-muted-foreground leading-relaxed text-center min-h-[100px]"
                                placeholder="Write a brief bio about yourself..."
                              />
                            </div>
                          </div>
                        </Card>
                      </div>
                    </section>

                    {/* Professional Projects Section */}
                    <section className="py-20 px-6 relative">
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                          <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                              <Rocket className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground">Featured Projects</h2>
                          </div>
                          <div className="w-20 h-1 bg-primary mx-auto rounded-full mb-4" />
                          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Showcasing innovation through code with cutting-edge technology
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                          <EditButton section="Projects" />
                          {portfolioData.projects.map((project, index) => (
                            <Card
                              key={project.id}
                              className="bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 group relative"
                            >
                              {/* Action Bar */}
                              <div className="absolute top-4 right-4 flex items-center gap-1 z-20">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast({
                                      title: "AI Enhance",
                                      description: "AI enhancement features coming soon!",
                                    });
                                  }}
                                  className="p-2 text-purple-400/70 hover:text-purple-500 transition-colors"
                                  title="Enhance with AI"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingProject(project);
                                  }}
                                  className="p-2 text-muted-foreground/50 hover:text-primary transition-colors"
                                  title="Edit project"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({
                                      type: 'project',
                                      index,
                                      name: project.title
                                    });
                                  }}
                                  className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors"
                                  title="Delete project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Code className="w-6 h-6 text-primary" />
                                  </div>
                                  {project.featured && (
                                    <Badge className="bg-primary text-primary-foreground">
                                      <Star className="w-3 h-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-xl font-semibold text-foreground">
                                    {project.title}
                                  </h3>
                                  <div className="flex items-center space-x-1 text-sm bg-secondary px-2 py-1 rounded">
                                    <Star className="w-3 h-3 text-primary" />
                                    <span className="text-foreground">{project.stars}</span>
                                  </div>
                                </div>

                                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                  {project.description}
                                </p>

                                {/* Tech Stack */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {project.tech.map((tech: string, i: number) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>

                                {/* Key Features */}
                                {project.features && project.features.length > 0 && (
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium text-foreground mb-2">
                                      Key Features:
                                    </h4>
                                    <div className="grid grid-cols-1 gap-1">
                                      {project.features.slice(0, 2).map((feature: string, i: number) => (
                                        <div key={i} className="text-xs text-muted-foreground">
                                          • {feature}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    asChild
                                  >
                                    <a href={project.demo} target="_blank" rel="noopener noreferrer">
                                      <Eye className="w-3 h-3 mr-2" />
                                      Demo
                                    </a>
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    asChild
                                  >
                                    <a href={project.repo} target="_blank" rel="noopener noreferrer">
                                      <Github className="w-3 h-3 mr-2" />
                                      Code
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <AddButton
                          label="Add Project"
                          onClick={() => {
                            setEditingProject({
                              id: Date.now().toString(),
                              title: '',
                              description: '',
                              tech: [],
                              features: [],
                              demo: '',
                              repo: '',
                              stars: 0
                            });
                          }}
                          className="mt-8"
                        />
                      </div>
                    </section>

                    {/* Professional Skills Section */}
                    <section className="py-20 px-6 relative">
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                          <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                              <Target className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground">Technical Skills</h2>
                          </div>
                          <div className="w-20 h-1 bg-primary mx-auto rounded-full mb-4" />
                          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Expertise across the full development spectrum
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 relative px-4">
                          <EditButton section="Skills" />
                          {Object.entries(skillsByCategory).map(([category, categorySkills], categoryIndex) => (
                            <Card
                              key={category}
                              className="bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 mx-4"
                            >
                              <div className="p-6">
                                <div className="flex items-center mb-6">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                                    {category === 'Frontend' && <Lightbulb className="w-5 h-5 text-primary" />}
                                    {category === 'Backend' && <Code2 className="w-5 h-5 text-primary" />}
                                    {category === 'Cloud' && <Globe className="w-5 h-5 text-primary" />}
                                    {category === 'AI/ML' && <Activity className="w-5 h-5 text-primary" />}
                                    {category === 'DevOps' && <Settings className="w-5 h-5 text-primary" />}
                                    {category === 'Database' && <Layers className="w-5 h-5 text-primary" />}
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-semibold text-foreground">
                                      {category}
                                    </h3>
                                    <div className="w-12 h-0.5 bg-primary rounded-full mt-1" />
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {categorySkills.map((skill, skillIndex) => {
                                    const skillLevel = skill.level || 70;
                                    const getStarLevel = (level: number) => {
                                      if (level >= 85) return 'professional';
                                      if (level >= 70) return 'intermediate';
                                      return 'beginner';
                                    };
                                    const starLevel = getStarLevel(skillLevel);
                                    const starCount = starLevel === 'professional' ? 3 : starLevel === 'intermediate' ? 2 : 1;

                                    return (
                                      <div
                                        key={skillIndex}
                                        className="group flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                                      >
                                        <EditableText
                                          value={skill.name}
                                          onSave={(val) => {
                                            const newData = { ...portfolioData };
                                            const realIndex = portfolioData.skills.indexOf(skill);
                                            if (realIndex !== -1) {
                                              newData.skills[realIndex].name = val;
                                              setPortfolioData(newData);
                                            }
                                          }}
                                          className="font-medium text-foreground flex-1 mr-2 min-w-0 truncate"
                                        />
                                        <div className="flex items-center space-x-1">
                                          {[...Array(3)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 flex-shrink-0 ${i < starCount
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-muted-foreground/30'
                                                }`}
                                            />
                                          ))}
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                          className="text-muted-foreground/50 hover:text-primary transition-colors p-1 opacity-0 group-hover:opacity-100"
                                          title="Edit skill"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const realIndex = portfolioData.skills.indexOf(skill);
                                            if (realIndex !== -1) {
                                              setDeleteConfirm({
                                                type: 'skill',
                                                index: realIndex,
                                                name: skill.name
                                              });
                                            }
                                          }}
                                          className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
                                          title="Delete skill"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <AddItemDialog
                          type="skill"
                          onSave={(newSkill) => {
                            const newData = { ...portfolioData };
                            let numericLevel = 70;
                            if (newSkill.level === 'Beginner') numericLevel = 45;
                            if (newSkill.level === 'Intermediate') numericLevel = 75;
                            if (newSkill.level === 'Expert') numericLevel = 95;

                            newData.skills = [...newData.skills, { ...newSkill, level: numericLevel }];
                            setPortfolioData(newData);
                            toast({ title: "Skill added", description: `${newSkill.name} added to portfolio.` });
                          }}
                        >
                          <AddButton
                            label="Add Skill"
                            size="sm"
                            onClick={() => { }}
                            className="mt-8"
                          />
                        </AddItemDialog>
                      </div>
                    </section>

                    {/* Ultra-Premium Achievements Timeline - Responsive Layout */}
                    <section className="py-20 px-6 relative">
                      <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                          <div className="flex items-center justify-center mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                              <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground">Achievements & Milestones</h2>
                          </div>
                          <div className="w-20 h-1 bg-primary mx-auto rounded-full mb-6" />
                          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Celebrating moments of growth and recognition in my journey
                          </p>
                        </div>

                        <div className="relative">
                          <EditButton section="Achievements" />

                          {/* Mobile Cards Layout */}
                          <div className="block md:hidden">
                            <div className="grid gap-6">
                              {portfolioData.achievements.map((achievement, index) => (
                                <Card
                                  key={index}
                                  className="bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in relative"
                                  style={{ animationDelay: `${index * 200}ms` }}
                                >
                                  {/* Action Bar */}
                                  <div className="absolute top-4 right-4 flex items-center gap-1 z-20">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "AI Enhance",
                                          description: "AI enhancement benefits coming soon!"
                                        });
                                      }}
                                      className="p-2 text-purple-400/70 hover:text-purple-500 transition-colors"
                                      title="Enhance with AI"
                                    >
                                      <Sparkles className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingAchievement({
                                          item: achievement as unknown as AchievementType,
                                          type: achievement.type as 'internship' | 'award',
                                          isOpen: true
                                        });
                                      }}
                                      className="p-2 text-muted-foreground/50 hover:text-primary transition-colors"
                                      title="Edit achievement"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({
                                          type: 'achievement',
                                          index,
                                          name: achievement.title
                                        });
                                      }}
                                      className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors"
                                      title="Delete achievement"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="relative z-10 p-6">
                                    <div className="flex items-start space-x-4 mb-4">
                                      {/* Icon */}
                                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shadow-lg">
                                        {achievement.type === 'internship' ?
                                          <Briefcase className="w-6 h-6 text-primary" /> :
                                          <Trophy className="w-6 h-6 text-primary" />
                                        }
                                      </div>

                                      <div className="flex-1">
                                        <h3 className="text-xl font-bold text-foreground mb-2">
                                          {achievement.title}
                                        </h3>
                                        <div className="flex items-center space-x-2 text-muted-foreground font-semibold text-sm">
                                          <Building className="w-4 h-4" />
                                          <span>{achievement.issuer}</span>
                                        </div>
                                      </div>

                                      <Badge className="bg-primary/10 text-primary px-3 py-1 rounded-lg shadow-lg text-sm">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {achievement.date}
                                      </Badge>
                                    </div>

                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                      {achievement.description}
                                    </p>

                                    {/* Achievement Type Badge */}
                                    <div className="flex justify-end">
                                      <Badge
                                        variant="outline"
                                        className={`${achievement.type === 'internship'
                                          ? 'border-blue-500/30 text-blue-600 bg-blue-500/10'
                                          : 'border-yellow-500/30 text-yellow-600 bg-yellow-500/10'
                                          } px-3 py-1 rounded-lg font-medium`}
                                      >
                                        {achievement.type === 'internship' ? '💼 Internship' : '🏆 Award'}
                                      </Badge>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>

                          {/* Desktop Timeline Layout */}
                          <div className="hidden md:block relative">
                            {/* Animated Timeline Line */}
                            <div className="absolute left-8 top-0 bottom-0 w-1 bg-primary rounded-full" />

                            <div className="space-y-12">
                              {portfolioData.achievements.map((achievement, index) => (
                                <div
                                  key={index}
                                  className="relative flex items-start group"
                                  style={{ animationDelay: `${index * 300}ms` }}
                                >
                                  {/* Timeline Marker */}
                                  <div className="relative z-10 mr-8">
                                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105">
                                      {achievement.type === 'internship' ?
                                        <Briefcase className="w-8 h-8 text-primary-foreground" /> :
                                        <Trophy className="w-8 h-8 text-primary-foreground" />
                                      }
                                    </div>
                                  </div>

                                  {/* Achievement Card */}
                                  <Card className="flex-1 bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                                    {/* Action Bar */}
                                    <div className="absolute top-4 right-4 flex items-center gap-1 z-20">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toast({
                                            title: "AI Enhance",
                                            description: "AI features coming soon!"
                                          });
                                        }}
                                        className="p-2 text-purple-400/70 hover:text-purple-500 transition-colors"
                                        title="Enhance with AI"
                                      >
                                        <Sparkles className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingAchievement({
                                            item: achievement as unknown as AchievementType,
                                            type: achievement.type as 'internship' | 'award',
                                            isOpen: true
                                          });
                                        }}
                                        className="p-2 text-muted-foreground/50 hover:text-primary transition-colors"
                                        title="Edit achievement"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newData = { ...portfolioData };
                                          newData.achievements = newData.achievements.filter((_, i) => i !== index);
                                          setPortfolioData(newData);
                                          toast({
                                            title: "Achievement deleted",
                                            description: "Removed from achievements."
                                          });
                                        }}
                                        className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors"
                                        title="Delete achievement"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="relative z-10 p-8">
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                          <h3 className="text-2xl font-bold text-foreground mb-2">
                                            {achievement.title}
                                          </h3>
                                          <div className="flex items-center space-x-3">
                                            <div className="flex items-center space-x-2 text-muted-foreground font-semibold">
                                              <Building className="w-4 h-4" />
                                              <span>{achievement.issuer}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <Badge className="bg-primary/10 text-primary px-4 py-2 rounded-xl shadow-lg">
                                          <Calendar className="w-4 h-4 mr-2" />
                                          {achievement.date}
                                        </Badge>
                                      </div>

                                      <p className="text-muted-foreground leading-relaxed">
                                        {achievement.description}
                                      </p>

                                      {/* Achievement Type Badge */}
                                      <div className="mt-6 flex justify-end">
                                        <Badge
                                          variant="outline"
                                          className={`${achievement.type === 'internship'
                                            ? 'border-blue-500/30 text-blue-600 bg-blue-500/10'
                                            : 'border-yellow-500/30 text-yellow-600 bg-yellow-500/10'
                                            } px-3 py-1 rounded-lg font-medium`}
                                        >
                                          {achievement.type === 'internship' ? '💼 Internship' : '🏆 Award'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <AddButton
                          label="Add Achievement"
                          onClick={() => {
                            setEditingAchievement({
                              item: {
                                id: 0,
                                title: '',
                                organization: '',
                                description: '',
                                type: 'internship'
                              } as AchievementType,
                              type: 'internship',
                              isOpen: true
                            });
                          }}
                          className="mt-8"
                        />
                      </div>
                    </section>

                    {/* Certificates - Grid */}
                    <section className="py-16 px-6">
                      <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Certifications</h2>
                          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                          <EditButton section="Certificates" />
                          {portfolioData.certificates.map((cert, index) => (
                            <Card key={index} className="bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 p-6 relative">
                              {/* Action Bar */}
                              <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast({
                                      title: "AI Enhance",
                                      description: "AI features coming soon!"
                                    });
                                  }}
                                  className="p-2 text-purple-400/70 hover:text-purple-500 transition-colors"
                                  title="Enhance with AI"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAchievement({
                                      item: { ...cert, id: index } as any,
                                      type: 'certificate',
                                      isOpen: true
                                    });
                                  }}
                                  className="p-2 text-muted-foreground/50 hover:text-primary transition-colors"
                                  title="Edit certificate"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({
                                      type: 'certificate',
                                      index,
                                      name: cert.title
                                    });
                                  }}
                                  className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors"
                                  title="Delete certificate"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                                  <GraduationCap className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              </div>

                              <h3 className="text-lg font-bold text-foreground mb-2">
                                {cert.title}
                              </h3>

                              <p className="text-primary font-medium mb-2">{cert.issuer}</p>
                              <p className="text-sm text-muted-foreground mb-3">{cert.date}</p>

                              <div className="text-sm text-muted-foreground mb-4">
                                <p className="mb-2">Professional certification demonstrating expertise in cloud computing fundamentals and best practices.</p>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">ID:</span>
                                  <code className="px-2 py-1 bg-secondary rounded text-xs">{cert.credentialId}</code>
                                </div>
                              </div>

                              <Button variant="outline" size="sm" className="w-full">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Certificate
                              </Button>
                            </Card>
                          ))}
                        </div>

                        <AddButton
                          label="Add Certificate"
                          onClick={() => {
                            setEditingAchievement({
                              item: {
                                id: 0,
                                title: '',
                                issuer: '',
                                date: '',
                                credentialId: '',
                                type: 'certificate'
                              } as any,
                              type: 'certificate',
                              isOpen: true
                            });
                          }}
                          className="mt-8"
                        />
                      </div>
                    </section>

                    {/* Footer */}
                    <footer className="py-12 px-6 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                      <div className="max-w-7xl mx-auto text-center">
                        <div className="flex justify-center space-x-6 mb-6">
                          <Button variant="outline" size="sm">
                            <Github className="w-4 h-4 mr-2" />
                            GitHub
                          </Button>
                          <Button variant="outline" size="sm">
                            <Linkedin className="w-4 h-4 mr-2" />
                            LinkedIn
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </Button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">© 2024 {portfolioData.name}. All rights reserved.</p>
                      </div>
                    </footer>
                  </div>
                )}

                {/* Template 2: Elegant Professional Design */}
                {currentTemplate === 'creative' && (
                  <div className="relative bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-900 dark:via-orange-950 dark:to-slate-900">

                    {/* Elegant Hero Section */}
                    <section className="relative flex items-center justify-center overflow-hidden pt-6 pb-12">
                      {/* Sophisticated Background */}
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
                      </div>

                      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                          {/* Elegant Text Content */}
                          <div className="space-y-8">
                            <div className="space-y-6">
                              <div className="inline-flex items-center px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 animate-pulse"></div>
                                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Available for opportunities</span>
                              </div>

                              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                                <span className="bg-gradient-to-r from-slate-900 via-orange-900 to-slate-900 dark:from-white dark:via-orange-100 dark:to-white bg-clip-text text-transparent">
                                  {portfolioData.name}
                                </span>
                              </h1>

                              <div className="space-y-4">
                                <p className="text-2xl lg:text-3xl font-semibold text-slate-700 dark:text-slate-300">
                                  {portfolioData.title}
                                </p>
                                <div className="w-32 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></div>
                              </div>
                            </div>

                            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                              {portfolioData.tagline}
                            </p>

                            {/* Elegant Contact Row */}
                            <div className="flex flex-wrap gap-4">
                              <Button
                                size="lg"
                                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl px-8"
                              >
                                <Mail className="w-5 h-5 mr-3" />
                                Get In Touch
                              </Button>
                              <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8"
                              >
                                <Download className="w-5 h-5 mr-3" />
                                Download CV
                              </Button>
                            </div>
                          </div>

                          {/* Elegant Profile Section */}
                          <div className="relative">
                            <div className="relative z-10 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
                              <div className="text-center space-y-6">
                                <Avatar className="w-32 h-32 mx-auto ring-4 ring-orange-500/20 shadow-xl">
                                  <AvatarImage src="/placeholder.svg" alt={portfolioData.name} />
                                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 text-white">
                                    {portfolioData.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-center space-x-2 text-slate-600 dark:text-slate-400">
                                    <MapPin className="w-4 h-4" />
                                    <span>{portfolioData.location}</span>
                                  </div>

                                  <div className="flex justify-center space-x-4">
                                    <a href={`https://github.com/${portfolioData.github}`} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                      <Github className="w-5 h-5" />
                                    </a>
                                    <a href={`https://linkedin.com/in/${portfolioData.linkedin}`} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                      <Linkedin className="w-5 h-5" />
                                    </a>
                                    <a href={`mailto:${portfolioData.email}`} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                      <Mail className="w-5 h-5" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-4 -left-4 w-24 h-24 bg-orange-500/20 rounded-full blur-xl"></div>
                            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-red-500/20 rounded-full blur-xl"></div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Refined About Section */}
                    <section className="py-8 px-6 relative">
                      <EditButton section="about" />
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">About Me</h2>
                          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mx-auto mb-6"></div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 shadow-2xl border border-slate-200 dark:border-slate-700">
                          <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                              <EditableTextarea
                                value={portfolioData.about}
                                onSave={(val) => {
                                  const newData = { ...portfolioData };
                                  newData.about = val;
                                  setPortfolioData(newData);
                                }}
                                className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-8 w-full bg-transparent border-transparent hover:border-border focus:border-primary p-2 transition-all"
                                placeholder="Write a brief bio about yourself..."
                              />

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center">
                                    <Target className="w-5 h-5 mr-2 text-orange-500" />
                                    Current Focus
                                  </h4>
                                  <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                    <li>• AI & Machine Learning</li>
                                    <li>• Full-Stack Development</li>
                                    <li>• Open Source Contributions</li>
                                  </ul>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center">
                                    <Lightbulb className="w-5 h-5 mr-2 text-red-500" />
                                    Interests
                                  </h4>
                                  <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                    <li>• Cloud Architecture</li>
                                    <li>• Developer Experience</li>
                                    <li>• Product Strategy</li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-center">
                              <div className="relative">
                                <div className="w-64 h-64 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-3xl flex items-center justify-center">
                                  <div className="text-6xl font-bold text-orange-600 dark:text-orange-400">
                                    {portfolioData.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                </div>
                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-500/20 rounded-full blur-xl"></div>
                                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-red-500/20 rounded-full blur-xl"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Sophisticated Projects Grid */}
                    <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50 relative">
                      <EditButton section="projects" />
                      <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Featured Projects</h2>
                          <p className="text-xl text-slate-600 dark:text-slate-400">Crafting digital experiences with cutting-edge technology</p>
                          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mx-auto mt-6"></div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {portfolioData.projects.map((project, index) => (
                            <div key={project.id} className="group relative">
                              <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative group">
                                {/* Action Bar */}
                                <div className="absolute top-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast({ title: "AI Enhance", description: "AI features coming soon!" });
                                    }}
                                    className="p-2 bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-500/40 transition-colors"
                                    title="Enhance with AI"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingProject(project);
                                    }}
                                    className="p-2 bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors"
                                    title="Edit project"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newData = { ...portfolioData };
                                      newData.projects = newData.projects.filter((_, i) => i !== index);
                                      setPortfolioData(newData);
                                    }}
                                    className="p-2 bg-red-500/20 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-500/40 transition-colors"
                                    title="Delete project"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Project Content */}
                                <div className="p-6">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                                      <Code className="w-6 h-6 text-white" />
                                    </div>
                                    {project.featured && (
                                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                        <Star className="w-4 h-4 mr-1" />
                                        Featured
                                      </div>
                                    )}
                                  </div>

                                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{project.title}</h3>
                                  <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{project.description}</p>

                                  {/* Features Section */}
                                  <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Key Features:</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {project.features?.slice(0, 3).map((feature, index) => (
                                        <span key={index} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                                          {feature}
                                        </span>
                                      ))}
                                      {project.features && project.features.length > 3 && (
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded-full">
                                          +{project.features.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Tech Stack */}
                                  <div className="flex flex-wrap gap-2 mb-6">
                                    {project.tech.slice(0, 3).map((tech) => (
                                      <span key={tech} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-full">
                                        {tech}
                                      </span>
                                    ))}
                                    {project.tech.length > 3 && (
                                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm rounded-full">
                                        +{project.tech.length - 3}
                                      </span>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex space-x-3">
                                    <Button size="sm" className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
                                      <Eye className="w-4 h-4 mr-2" />
                                      Demo
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-slate-300 dark:border-slate-600">
                                      <Github className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* Skills Section - Keep Similar */}
                    <section className="py-24 px-6 relative">
                      <EditButton section="skills" />
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Technical Skills</h2>
                          <p className="text-xl text-slate-600 dark:text-slate-400">Expertise across the full technology stack</p>
                          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mx-auto mt-6"></div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {Object.entries(skillsByCategory).map(([category, skills]) => (
                            <div key={category} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 relative group">
                              {/* Action Bar */}
                              <div className="absolute top-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSection(`skills-${category}`);
                                  }}
                                  className="p-2 bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors"
                                  title="Edit category"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">{category}</h3>
                              <div className="space-y-4">
                                {skills.map((skill) => {
                                  const skillLevel = skill.level || 70;
                                  const getStarLevel = (level: number) => {
                                    if (level >= 85) return 3;
                                    if (level >= 70) return 2;
                                    return 1;
                                  };
                                  const starCount = getStarLevel(skillLevel);

                                  return (
                                    <div key={skill.name} className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{skill.name}</span>
                                      <div className="flex items-center space-x-1">
                                        {[...Array(3)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < starCount
                                              ? 'text-orange-500 fill-orange-500'
                                              : 'text-slate-300 dark:text-slate-600'
                                              }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* Achievements Section - Responsive Layout */}
                    <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/50 relative">
                      <EditButton section="achievements" />
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Key Achievements</h2>
                          <p className="text-xl text-slate-600 dark:text-slate-400">Milestones that shaped my journey</p>
                          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mx-auto mt-6"></div>
                        </div>

                        {/* Mobile/Tablet: Grid Layout */}
                        <div className="block lg:hidden">
                          <div className="grid md:grid-cols-2 gap-6">
                            {portfolioData.achievements.map((achievement, index) => (
                              <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 relative group">
                                {/* Action Bar */}
                                <div className="absolute top-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingAchievement({
                                        item: achievement as unknown as AchievementType,
                                        type: achievement.type as 'internship' | 'award',
                                        isOpen: true
                                      });
                                    }}
                                    className="p-2 bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors"
                                    title="Edit achievement"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex items-center justify-center mb-3">
                                  <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{achievement.date}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">{achievement.title}</h3>
                                <p className="text-orange-600 dark:text-orange-400 text-sm mb-2 font-medium text-center">{achievement.issuer}</p>
                                <p className="text-slate-700 dark:text-slate-300 text-sm mb-3 text-center">{achievement.description}</p>
                                <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                  <p className="mb-1">ID: {achievement.type === 'internship' ? 'INT-2024-001' : 'AWD-2024-002'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Desktop: Timeline Layout */}
                        <div className="hidden lg:block relative max-w-5xl mx-auto">
                          {/* Vertical Line */}
                          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>

                          <div className="space-y-16">
                            {portfolioData.achievements.map((achievement, index) => (
                              <div key={index} className="relative flex items-center">
                                {/* Timeline Dot */}
                                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full border-4 border-white dark:border-slate-900 shadow-lg z-10"></div>

                                {/* Content positioned left or right */}
                                <div className={`w-full flex ${index % 2 === 0 ? 'justify-start pr-8' : 'justify-end pl-8'}`}>
                                  <div className={`w-5/12 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 relative group">
                                      {/* Action Bar */}
                                      <div className="absolute top-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingAchievement({
                                              item: achievement as unknown as AchievementType,
                                              type: achievement.type as 'internship' | 'award',
                                              isOpen: true
                                            });
                                          }}
                                          className="p-2 bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors"
                                          title="Edit achievement"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newData = { ...portfolioData };
                                            newData.achievements = newData.achievements.filter((_, i) => i !== index);
                                            setPortfolioData(newData);
                                          }}
                                          className="p-2 bg-red-500/20 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-500/40 transition-colors"
                                          title="Delete achievement"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-center">
                                          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{achievement.date}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{achievement.title}</h3>
                                        <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">{achievement.issuer}</p>
                                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{achievement.description}</p>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-600">
                                          <p>ID: {achievement.type === 'internship' ? 'INT-2024-001' : 'AWD-2024-002'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Professional Certificates Grid */}
                    <section className="py-24 px-6 relative">
                      <EditButton section="certificates" />
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Certifications</h2>
                          <p className="text-xl text-slate-600 dark:text-slate-400">Professional credentials and continuous learning</p>
                          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mx-auto mt-6"></div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {portfolioData.certificates.map((cert, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 group relative">
                              {/* Action Bar */}
                              <div className="absolute top-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAchievement({
                                      item: { ...cert, id: index } as any,
                                      type: 'certificate',
                                      isOpen: true
                                    });
                                  }}
                                  className="p-2 bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors"
                                  title="Edit certificate"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newData = { ...portfolioData };
                                    newData.certificates = newData.certificates.filter((_, i) => i !== index);
                                    setPortfolioData(newData);
                                  }}
                                  className="p-2 bg-red-500/20 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-500/40 transition-colors"
                                  title="Delete certificate"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                  <GraduationCap className="w-8 h-8 text-white" />
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{cert.title}</h3>
                                <p className="text-orange-600 dark:text-orange-400 font-medium mb-2">{cert.issuer}</p>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">{cert.date}</p>

                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                  <p className="mb-2">Professional certification demonstrating expertise in cloud computing fundamentals and best practices.</p>
                                  <div className="flex items-center justify-center space-x-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Verified</span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    <span className="font-medium">ID:</span> {cert.credentialId}
                                  </div>
                                </div>

                                <Button variant="outline" size="sm" className="w-full border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Certificate
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* Template 3: Futuristic Glassmorphism - 2040 Portfolio */}
                {currentTemplate === 'modern' && (
                  <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden -mt-44 -mb-20">
                    {/* Animated Background Effects */}
                    <div className="fixed inset-0 pointer-events-none">
                      {/* Particle Field */}
                      <div className="absolute inset-0 opacity-30">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1 h-1 bg-electric rounded-full animate-pulse"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              animationDelay: `${Math.random() * 3}s`,
                              animationDuration: `${2 + Math.random() * 2}s`
                            }}
                          />
                        ))}
                      </div>

                      {/* Nebula Gradients */}
                      <div className="absolute top-0 left-0 w-96 h-96 bg-electric/10 rounded-full blur-3xl animate-pulse-slow"></div>
                      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pulse/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                    </div>

                    {/* Enhanced About Section - Moved to Top */}
                    <section className="relative flex items-center justify-center px-6 pt-20 pb-16">
                      <EditButton section="about" />
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-20">
                          <h2 className="text-6xl font-black text-gradient-primary mb-6">About Me</h2>
                          <div className="w-48 h-2 bg-gradient-primary mx-auto rounded-full glow-electric"></div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                          {/* Enhanced Profile Section */}
                          <div className="relative">
                            <div className="glass-card p-12 rounded-3xl border border-electric/20 shadow-2xl backdrop-blur-xl bg-white/5 transform hover:scale-105 transition-all duration-700 hover:shadow-electric/50">
                              <div className="text-center space-y-8">
                                <Avatar className="w-48 h-48 mx-auto ring-4 ring-electric/30 shadow-2xl">
                                  <AvatarImage src="/placeholder.svg" alt={portfolioData.name} />
                                  <AvatarFallback className="text-6xl font-bold bg-gradient-primary text-white">
                                    {portfolioData.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="space-y-4">
                                  <h1 className="text-4xl lg:text-5xl font-black text-gradient-primary">
                                    {portfolioData.name}
                                  </h1>
                                  <p className="text-xl lg:text-2xl font-semibold text-electric">
                                    {portfolioData.title}
                                  </p>
                                  <div className="w-32 h-1 bg-gradient-primary mx-auto rounded-full glow-electric"></div>
                                </div>

                                {/* AI Badge */}
                                <div className="bg-gradient-primary px-6 py-3 rounded-full text-white text-sm font-bold shadow-lg glow-primary inline-block">
                                  <Sparkles className="w-5 h-5 inline mr-2" />
                                  AI Portfolio v3.0
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Professional Content */}
                          <div className="space-y-8">
                            <div className="glass-card p-8 rounded-3xl border border-electric/20 shadow-2xl backdrop-blur-xl bg-white/5">
                              <div className="space-y-6">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center glow-primary">
                                    <User className="w-6 h-6 text-white" />
                                  </div>
                                  <h3 className="text-2xl font-bold text-white">Professional Profile</h3>
                                </div>

                                <div className="text-lg text-white/80 leading-relaxed">
                                  <EditableTextarea
                                    value={portfolioData.about}
                                    onSave={(val) => {
                                      const newData = { ...portfolioData };
                                      newData.about = val;
                                      setPortfolioData(newData);
                                    }}
                                    placeholder="Write a compelling bio about yourself..."
                                    className="text-white/80"
                                  />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 pt-6">
                                  <div className="space-y-4">
                                    <h4 className="font-bold text-white flex items-center">
                                      <Target className="w-5 h-5 mr-3 text-electric" />
                                      Current Focus
                                    </h4>
                                    <ul className="space-y-2 text-white/70">
                                      <li className="flex items-center">
                                        <div className="w-2 h-2 bg-electric rounded-full mr-3"></div>
                                        AI & Machine Learning
                                      </li>
                                      <li className="flex items-center">
                                        <div className="w-2 h-2 bg-electric rounded-full mr-3"></div>
                                        Full-Stack Development
                                      </li>
                                      <li className="flex items-center">
                                        <div className="w-2 h-2 bg-electric rounded-full mr-3"></div>
                                        Open Source Contributions
                                      </li>
                                    </ul>
                                  </div>

                                  <div className="space-y-4">
                                    <h4 className="font-bold text-white flex items-center">
                                      <Lightbulb className="w-5 h-5 mr-3 text-pulse" />
                                      Expertise Areas
                                    </h4>
                                    <ul className="space-y-2 text-white/70">
                                      <li className="flex items-center">
                                        <div className="w-2 h-2 bg-pulse rounded-full mr-3"></div>
                                        Cloud Architecture
                                      </li>
                                      <li className="flex items-center">
                                        <div className="w-2 h-2 bg-pulse rounded-full mr-3"></div>
                                        Developer Experience
                                      </li>
                                      <li className="flex items-center">
                                        <div className="w-2 h-2 bg-pulse rounded-full mr-3"></div>
                                        Product Strategy
                                      </li>
                                    </ul>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-6">
                                  <Button className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-bold hover:glow-primary transition-all duration-300">
                                    <Download className="w-5 h-5 mr-2" />
                                    Download Resume
                                  </Button>
                                  <Button variant="outline" className="border-2 border-electric/50 text-electric hover:bg-electric/20 px-6 py-3 rounded-xl font-bold hover:glow-electric transition-all duration-300">
                                    <Mail className="w-5 h-5 mr-2" />
                                    Get In Touch
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Enhanced Projects Section */}
                    <section className="py-16 px-6 relative">
                      <EditButton section="projects" />
                      <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-8">
                          <h2 className="text-4xl font-black text-gradient-primary mb-4">Projects</h2>
                          <div className="w-32 h-1 bg-gradient-primary mx-auto rounded-full glow-electric"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
                          <EditButton section="Projects" />
                          {portfolioData.projects.map((project, index) => (
                            <div
                              key={project.id}
                              className="group animate-fade-in h-full"
                              style={{ animationDelay: `${index * 200}ms` }}
                            >
                              <div className="glass-card p-8 rounded-3xl border border-electric/20 shadow-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-700 hover:scale-105 hover:shadow-electric/50 h-full flex flex-col relative group">
                                {/* Action Bar */}
                                <div className="absolute top-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast({ title: "AI Enhance", description: "AI features coming soon!" });
                                    }}
                                    className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/40 transition-colors"
                                    title="Enhance with AI"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingProject(project);
                                    }}
                                    className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors"
                                    title="Edit project"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newData = { ...portfolioData };
                                      newData.projects = newData.projects.filter((_, i) => i !== index);
                                      setPortfolioData(newData);
                                    }}
                                    className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40 transition-colors"
                                    title="Delete project"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                {/* Holographic Shimmer Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-electric/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-3xl"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                  <div className="flex items-start justify-between mb-6">
                                    <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center glow-electric">
                                      <Code className="w-7 h-7 text-electric" />
                                    </div>
                                    {project.featured && (
                                      <div className="bg-gradient-primary px-3 py-1.5 rounded-full text-white text-xs font-bold glow-primary">
                                        <Star className="w-3 h-3 inline mr-1" />
                                        Featured
                                      </div>
                                    )}
                                  </div>

                                  <h3 className="text-xl font-black text-white mb-4 group-hover:text-gradient-primary transition-all duration-300">
                                    {project.title}
                                  </h3>

                                  <p className="text-white/70 text-sm mb-6 leading-relaxed flex-grow">
                                    {project.description}
                                  </p>

                                  <div className="space-y-4 mt-auto">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {project.tech.map((tech: string, i: number) => (
                                        <span key={i} className="px-2 py-1 rounded-full text-xs font-medium bg-electric/20 text-electric border border-electric/30">
                                          {tech}
                                        </span>
                                      ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                      <Button
                                        className="flex-1 bg-gradient-primary text-white border-0 rounded-xl px-4 py-2 text-sm font-bold hover:glow-primary transition-all duration-300"
                                        asChild
                                      >
                                        <a href={project.demo} target="_blank" rel="noopener noreferrer">
                                          <Eye className="w-4 h-4 mr-2" />
                                          Demo
                                        </a>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="border-2 border-electric/50 text-electric hover:bg-electric/20 rounded-xl px-4 py-2 text-sm font-bold hover:glow-electric transition-all duration-300"
                                        asChild
                                      >
                                        <a href={project.repo} target="_blank" rel="noopener noreferrer">
                                          <Github className="w-4 h-4" />
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* Enhanced Skills Section */}
                    <section className="py-16 px-6 relative">
                      <EditButton section="skills" />
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-8">
                          <h2 className="text-4xl font-black text-gradient-primary mb-4">Skills</h2>
                          <div className="w-32 h-1 bg-gradient-primary mx-auto rounded-full glow-electric"></div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
                          {Object.entries(skillsByCategory).map(([category, categorySkills], categoryIndex) => (
                            <div
                              key={category}
                              className="glass-card p-8 rounded-3xl border border-electric/20 shadow-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-700 hover:scale-105 hover:shadow-electric/50 animate-fade-in relative group"
                              style={{ animationDelay: `${categoryIndex * 200}ms` }}
                            >
                              {/* Action Bar */}
                              <div className="absolute top-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSection(`skills-${category}`);
                                  }}
                                  className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors"
                                  title="Edit category"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                              {/* Category Header */}
                              <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center glow-primary mr-4">
                                  <Target className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white">{category}</h3>
                              </div>

                              {/* Skills Grid */}
                              <div className="space-y-4">
                                {categorySkills.map((skill, skillIndex) => (
                                  <div
                                    key={skillIndex}
                                    className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-electric/10 hover:border-electric/30 transition-all duration-300"
                                  >
                                    <span className="text-white font-medium">{skill.name}</span>
                                    <div className="flex items-center space-x-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${i < Math.ceil(skill.level / 20)
                                            ? 'text-electric fill-electric'
                                            : 'text-white/20'
                                            }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* Enhanced Achievements Section */}
                    <section className="py-16 px-6 relative">
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-8">
                          <h2 className="text-4xl font-black text-gradient-primary mb-4">Achievements</h2>
                          <div className="w-32 h-1 bg-gradient-primary mx-auto rounded-full glow-electric"></div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 relative">
                          <EditButton section="Achievements" />
                          {portfolioData.achievements.map((achievement, index) => (
                            <div
                              key={index}
                              className="glass-card p-8 rounded-3xl border border-electric/20 shadow-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-700 hover:scale-105 hover:shadow-lg animate-fade-in relative group"
                              style={{ animationDelay: `${index * 200}ms` }}
                            >
                              {/* Action Bar */}
                              <div className="absolute top-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast({
                                      title: "AI Enhance",
                                      description: "AI features coming soon!"
                                    });
                                  }}
                                  className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/40 transition-colors"
                                  title="Enhance with AI"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAchievement({
                                      item: achievement as unknown as AchievementType,
                                      type: achievement.type as 'internship' | 'award',
                                      isOpen: true
                                    });
                                  }}
                                  className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors"
                                  title="Edit achievement"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newData = { ...portfolioData };
                                    newData.achievements = newData.achievements.filter((_, i) => i !== index);
                                    setPortfolioData(newData);
                                    toast({
                                      title: "Achievement deleted",
                                      description: "Removed from achievements."
                                    });
                                  }}
                                  className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40 transition-colors"
                                  title="Delete achievement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center glow-primary">
                                    <Trophy className="w-8 h-8 text-white" />
                                  </div>
                                  <div className="text-right">
                                    <div className="text-electric font-bold text-lg">{achievement.date}</div>
                                    <div className="text-white/60 text-sm">
                                      {achievement.type === 'internship' ? 'Professional Experience' : 'Award & Recognition'}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h3 className="text-2xl font-black text-white">{achievement.title}</h3>
                                  <div className="flex items-center space-x-2">
                                    <Building className="w-5 h-5 text-electric" />
                                    <p className="text-electric font-bold text-lg">{achievement.issuer}</p>
                                  </div>
                                  <p className="text-white/80 leading-relaxed">{achievement.description}</p>
                                </div>

                                <div className="pt-4 border-t border-electric/20">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <User className="w-4 h-4 text-white/60" />
                                      <span className="text-white/60">Role: {achievement.type === 'internship' ? 'Software Engineering Intern' : 'Award Recipient'}</span>
                                    </div>
                                    <div className="text-white/60">
                                      ID: {achievement.type === 'internship' ? 'INT-2024-001' : 'AWD-2024-002'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>


                    {/* Enhanced Certificates Section */}
                    <section className="py-16 px-6 relative pb-0">
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-8">
                          <h2 className="text-4xl font-black text-gradient-primary mb-4">Certifications</h2>
                          <div className="w-32 h-1 bg-gradient-primary mx-auto rounded-full glow-electric"></div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
                          <EditButton section="Certificates" />
                          {portfolioData.certificates.map((cert, index) => (
                            <div
                              key={index}
                              className="glass-card p-8 rounded-3xl border border-electric/20 shadow-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-700 hover:scale-105 hover:shadow-lg animate-fade-in relative group"
                              style={{ animationDelay: `${index * 200}ms` }}
                            >
                              {/* Action Bar */}
                              <div className="absolute top-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast({
                                      title: "AI Enhance",
                                      description: "AI features coming soon!"
                                    });
                                  }}
                                  className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/40 transition-colors"
                                  title="Enhance with AI"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAchievement({
                                      item: { ...cert, id: index } as any,
                                      type: 'certificate',
                                      isOpen: true
                                    });
                                  }}
                                  className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors"
                                  title="Edit certificate"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newData = { ...portfolioData };
                                    newData.certificates = newData.certificates.filter((_, i) => i !== index);
                                    setPortfolioData(newData);
                                    toast({
                                      title: "Certificate deleted",
                                      description: "Certificate removed."
                                    });
                                  }}
                                  className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40 transition-colors"
                                  title="Delete certificate"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center glow-primary">
                                    <GraduationCap className="w-8 h-8 text-white" />
                                  </div>
                                  <div className="bg-gradient-to-r from-green-400/20 to-emerald-400/20 px-3 py-1.5 rounded-full text-green-400 text-xs font-bold border border-green-400/30">
                                    <CheckCircle className="w-3 h-3 inline mr-1" />
                                    Verified
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h3 className="text-xl font-black text-white">{cert.title}</h3>
                                  <div className="flex items-center space-x-2">
                                    <Building className="w-4 h-4 text-electric" />
                                    <p className="text-electric font-bold">{cert.issuer}</p>
                                  </div>
                                  <p className="text-white/60 text-sm">{cert.date}</p>
                                </div>

                                <div className="space-y-3">
                                  <p className="text-white/70 text-sm leading-relaxed">
                                    Professional certification demonstrating expertise in cloud computing fundamentals and best practices.
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-white/50">
                                    <span>Credential ID:</span>
                                    <code className="bg-white/10 px-2 py-1 rounded text-electric">{cert.credentialId}</code>
                                  </div>
                                </div>

                                <Button
                                  variant="outline"
                                  className="w-full border-2 border-electric/50 text-electric hover:bg-electric/20 rounded-xl font-bold transition-all duration-300"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Certificate
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                )}
              </div> {/* Close space-y-6 relative div from line 452 */}
            </main>
          </div>
        </div >

        <VerticalToggle isOpen={isAIPanelOpen} onToggle={() => setIsAIPanelOpen(!isAIPanelOpen)} />

        {/* RIGHT PANEL - AI Assistant */}
        <div className={`transition-all duration-300 overflow-hidden bg-muted/30 ${isAIPanelOpen ? 'w-[35%]' : 'w-0'}`}>
          <AIAssistantPanel />
        </div>

        {
          !isAIPanelOpen && (
            <button
              onClick={() => setIsAIPanelOpen(true)}
              className="fixed right-4 top-24 z-40 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
              aria-label="Open AI Assistant"
            >
              <ChevronLeft size={24} />
            </button>
          )
        }
      </div >

      {/* Keep AI Assistants for edit mode */}
      < AIAssistant />
      {
        editingSection && (
          <AIEditAssistant
            isOpen={!!editingSection}
            section={editingSection}
            onClose={() => setEditingSection(null)}
          />
        )
      }

      {/* Reusable Edit Modals */}
      {
        editingProject && (
          <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              <ProjectForm
                project={{
                  ...editingProject,
                  id: Number(editingProject.id) || 0, // Ensure ID number if needed
                  stack: editingProject.tech,
                  type: 'others',
                  link: editingProject.demo || editingProject.repo,
                  stars: editingProject.stars || 0,
                  forks: 0,
                  // Add any other required mappings
                } as any}
                onSave={async (updated) => {
                  // Remap back to local structure
                  const localProject: Project = {
                    ...editingProject,
                    title: updated.title,
                    description: updated.description || '',
                    tech: updated.stack,
                    features: updated.features,
                    demo: updated.link || editingProject.demo,
                    // maintain other fields
                  };
                  await handleSaveProject(localProject);
                }}
                onClose={() => setEditingProject(null)}
              />
            </DialogContent>
          </Dialog>
        )
      }

      {
        editingAchievement.isOpen && (
          <EditAchievementDialog
            isOpen={editingAchievement.isOpen}
            onClose={() => setEditingAchievement(prev => ({ ...prev, isOpen: false }))}
            achievement={editingAchievement.item}
            type={editingAchievement.type}
            onSave={handleSaveAchievement}
          />
        )
      }

      {
        deleteConfirm && (
          <DeleteConfirmationDialog
            isOpen={!!deleteConfirm}
            itemName={deleteConfirm.name}
            itemType={deleteConfirm.type}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        )
      }

    </div >
  );
};

export default PortfolioEditor;