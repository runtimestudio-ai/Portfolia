import { useEffect, useState } from 'react';
import { Github, Plus, Edit3, Trash2, ExternalLink, Star, GitBranch, Code, Sparkles, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AIAssistant from '@/components/AIAssistant';
import { AIEnhanceModal } from '@/components/AIEnhanceModal';
import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { getUserProjects as getUserProjectsAPI, addProject as addProjectAPI, updateProject as updateProjectAPI, deleteProject as deleteProjectAPI, fetchGithubSummary as fetchGithubSummaryAPI } from '@/utils/api';
import type { Project } from '@/types/project';
import { ProjectForm } from '@/components/forms/ProjectForm';


const Projects = () => {
  const [openedit, setOpenEdit] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openProject, setOpenProject] = useState(false);
  const [openGithub, setOpenGithub] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedProjectForAI, setSelectedProjectForAI] = useState<Project | null>(null);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);

  const { projects, addProject, deleteProject, updateProject } = usePortfolio();

  const { user, loading: authLoading } = useAuthContext();

  const [selectedTab, setSelectedTab] = useState('all');
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;            // wait for /me result
    if (!user) {                        // no user → clear data
      setLocalProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getUserProjectsAPI()
      .then((data: any[]) => {
        const mapped: Project[] = data.map((p: any) => ({
          ...p,
          status: {
            imported: Boolean(p.imported),
            aiSummary: Boolean(p.ai_summary), // backend snake_case → UI camelCase
            saved: Boolean(p.saved),
          },
        }));
        setLocalProjects(mapped);
      })
      .catch((e) => {
        console.error(e);
        setError('Failed to load projects');
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]); // ✅ don't forget dependencies


  const handleDeleteProject = async (projectId: number) => {
    try {
      await deleteProjectAPI(projectId); // call backend first
      setLocalProjects(localProjects.filter(p => p.id !== projectId)); // then update UI
    } catch (error) {
      console.error(error);
      setError("Failed to delete project");
    }
  };


  const handleAddProject = async (newProject: any) => {
    // build payload for backend
    const payload = {
      title: newProject.title,
      description: newProject.description ?? '',
      type: 'others',
      stack: newProject.stack ?? [],
      features: newProject.features ?? [],
      stars: 0,
      forks: 0,
      link: newProject.link ?? '',
      imported: false,
      ai_summary: false,
      saved: true,
    };

    // call API
    const created = await addProjectAPI(payload);

    // map backend -> UI shape
    const mapped = {
      ...created,
      status: {
        imported: Boolean(created.imported),
        aiSummary: Boolean(created.ai_summary),
        saved: Boolean(created.saved),
      },
    };

    // append to UI
    setLocalProjects((prev) => [...prev, mapped]);
  };

  const handleImportFromGitHub = async (projectData: any) => {
    try {
      // 1. Build payload in backend format
      const payload = {
        title: projectData.title,
        description: projectData.description ?? '',
        type: 'github',
        stack: projectData.stack ?? [],
        features: projectData.features ?? [],
        stars: projectData.githubStars ?? 0,
        forks: projectData.githubForks ?? 0,
        link: projectData.githubLink ?? '',
        imported: true,
        ai_summary: false,
        saved: true,
      };

      // 2. Call backend
      const created = await addProjectAPI(payload);

      // 3. Map backend → UI format
      const mapped: Project = {
        ...created,
        status: {
          imported: Boolean(created.imported),
          aiSummary: Boolean(created.ai_summary),
          saved: Boolean(created.saved),
        },
      };

      // 4. Add to local UI
      setLocalProjects((prev) => [...prev, mapped]);
    } catch (err) {
      console.error("Failed to import from GitHub:", err);
      setError("Failed to import from GitHub");
    }
  };




  const filteredProjects = localProjects.filter(project => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'github') return project.type === 'github';
    if (selectedTab === 'others') return project.type === 'others';
    return true;
  });

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="glass-card interactive group overflow-hidden">
      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:glow-primary transition-all">
        <Code className="w-6 h-6 text-white" />
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <div className="flex space-x-1">
            <Dialog open={openedit} onOpenChange={setOpenEdit}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0"
                  onClick={() => {
                    setSelectedProject(project);
                    setOpenEdit(true);
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>

                {selectedProject && ( // ✅ render only when we have data
                  <ProjectForm
                    project={selectedProject}
                    onSave={async (updatedProject) => {
                      const payload = {
                        ...updatedProject,
                        type: updatedProject.type || 'others',
                        imported: Boolean(updatedProject.status?.imported ?? updatedProject.imported),
                        ai_summary: Boolean(updatedProject.status?.aiSummary ?? updatedProject.ai_summary),
                        saved: Boolean(updatedProject.status?.saved ?? updatedProject.saved ?? true),
                      };
                      const updatedFromServer = await updateProjectAPI(updatedProject.id, payload);
                      const mapped = {
                        ...updatedFromServer,
                        status: {
                          imported: Boolean(updatedFromServer.imported),
                          aiSummary: Boolean(updatedFromServer.ai_summary),
                          saved: Boolean(updatedFromServer.saved),
                        },
                      };
                      setLocalProjects(localProjects.map(p => p.id === updatedProject.id ? mapped : p));
                    }}
                    onClose={() => setOpenEdit(false)}
                  />
                )}
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDeleteProject(project.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <a href={project.link} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0"
                title="Open project"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>

            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0"
              title="Enlarge card"
              onClick={() => {
                setSelectedProjectForDetails(project);
                setProjectDetailsOpen(true);
              }}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-foreground-muted line-clamp-2">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {project.stack.map((tech, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
        </div>

        {project.features && project.features.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-foreground mb-2">Key Features:</h4>
            <div className="flex flex-wrap gap-1">
              {project.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(
          <div className="flex items-center space-x-4 text-xs text-foreground-muted">
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>{project.stars}</span>
            </div>
            <div className="flex items-center space-x-1">
              <GitBranch className="w-3 h-3" />
              <span>{project.forks}</span>
            </div>
            <span>{project.lastUpdated}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 pt-2">
          <div className="flex space-x-1">
            <div className={`w-2 h-2 rounded-full ${project.status.imported ? 'bg-success' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${project.status.aiSummary ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${project.status.saved ? 'bg-electric' : 'bg-muted'}`} />
          </div>
          <div className="flex-1" />
          <Button
            size="sm"
            className="btn-primary text-xs"
            onClick={() => {
              setSelectedProjectForAI({
                ...project,
                stack: project.stack || [],
              });
              setAiModalOpen(true);
            }}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {project.status.aiSummary ? "Enhance Again" : "AI Enhance"}
          </Button>
        </div>
      </div>
    </Card>
  );
  const simulateProgress = () => {
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setProgress(current);
      if (current >= 100) clearInterval(interval);
    }, 100);
  };

  return (
    <div className="min-h-screen pt-1 bg-gradient-soft">
      <div className="container mx-auto px-3 py-3">
        {/* Background with mesh effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-slate-900" />
          <div className="mesh-bg absolute inset-0" />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10"></div>
        {/* Header */}
        <div className="container mx-auto px-4 py-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl lg:text-4xl font-space font-bold text-gradient-primary mb-2">
                Projects
              </h1>
              <p className="text-foreground-muted">
                Showcase your best work and let AI enhance your descriptions
              </p>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Dialog open={openGithub} onOpenChange={setOpenGithub}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Github className="w-4 h-4 mr-2" />
                    Import from GitHub
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import from GitHub</DialogTitle>
                  </DialogHeader>
                  <GitHubImportForm
                    onImport={handleImportFromGitHub}
                    onClose={() => {
                      const dialog = document.querySelector('[role="dialog"]');
                      const closeButton = dialog?.querySelector('[aria-label="Close"]') as HTMLButtonElement;
                      closeButton?.click(); setOpenGithub(false)
                    }}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={openProject} onOpenChange={setOpenProject}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Project Manually</DialogTitle>
                  </DialogHeader>
                  <ManualProjectForm
                    onAdd={handleAddProject}
                    onCloseProject={() => setOpenProject(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="others">Others</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <ProjectGrid projects={filteredProjects} />
          </TabsContent>
          <TabsContent value="github" className="mt-6">
            <ProjectGrid projects={localProjects.filter(p => p.type === 'github')} />
          </TabsContent>
          <TabsContent value="others" className="mt-6">
            <ProjectGrid projects={localProjects.filter(p => p.type === 'others')} />
          </TabsContent>
        </Tabs>

      </div>

      {/* AI Enhance Modal */}
      {selectedProjectForAI && (
        <AIEnhanceModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          project={{
            id: selectedProjectForAI.id,
            title: selectedProjectForAI.title,
            description: selectedProjectForAI.description || '',
            techStack: selectedProjectForAI.stack || [],
          }}
          onApply={async (newDescription) => {
            try {
              // Build payload for update
              const payload = {
                title: selectedProjectForAI.title,
                description: newDescription,
                type: selectedProjectForAI.type || 'others',
                stack: selectedProjectForAI.stack || [],
                features: selectedProjectForAI.features || [],
                stars: selectedProjectForAI.stars ?? 0,
                forks: selectedProjectForAI.forks ?? 0,
                link: selectedProjectForAI.link || '',
                imported: selectedProjectForAI.status?.imported ?? selectedProjectForAI.imported ?? false,
                ai_summary: true, // Mark as AI-enhanced
                saved: true,
              };

              // Update via API
              const updatedFromServer = await updateProjectAPI(selectedProjectForAI.id, payload);

              // Map to UI format
              const mapped = {
                ...updatedFromServer,
                status: {
                  imported: Boolean(updatedFromServer.imported),
                  aiSummary: Boolean(updatedFromServer.ai_summary),
                  saved: Boolean(updatedFromServer.saved),
                },
              };

              // Update local state only on success
              setLocalProjects(localProjects.map(p => p.id === selectedProjectForAI.id ? mapped : p));

              // Close modal only on success
              setAiModalOpen(false);
            } catch (error) {
              console.error('Failed to apply AI enhancement:', error);
              // User can retry or close manually
            }
          }}
        />
      )}

      {/* Project Details Modal */}
      {selectedProjectForDetails && (
        <ProjectDetailsModal
          isOpen={projectDetailsOpen}
          onClose={() => setProjectDetailsOpen(false)}
          project={selectedProjectForDetails}
        />
      )}

      <AIAssistant />
    </div>
  );

  function ProjectGrid({ projects }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <div key={project.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    );
  }

  function GitHubImportForm({ onImport, onClose }) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleImport = async () => {
      if (!url) return;
      setLoading(true);
      setError(null);

      try {
        const data = await fetchGithubSummaryAPI(url); // ✅ use API wrapper
        if (data.error) {
          setError(data.error);
        } else {
          onImport(data);    // ✅ Pass parsed project back to parent
          onClose?.();       // ✅ Close the dialog if onClose provided
          setUrl('');
        }
      } catch (err) {
        setError('Failed to import from GitHub. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="github-url">GitHub Repository URL</Label>
          <Input
            id="github-url"
            placeholder="https://github.com/username/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-foreground-muted">
            We'll automatically extract project details, tech stack, and generate an AI-enhanced description.
          </p>
        </div>
        {/* ✅ Display error message if any */}
        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
        <div className="flex space-x-3">
          <Button
            className="btn-primary flex-1 relative overflow-hidden"
            onClick={handleImport}
            disabled={!url || loading}
          >
            {/* Progress Fill Layer */}
            {loading && (
              <div
                className="absolute left-0 top-0 h-full bg-purple-900/40 z-0 transition-all duration-300 ease-out"
                style={{ width: '100%', animation: 'progressFill 1.5s linear infinite' }}
              />
            )}

            {/* Button Content */}
            <div className="flex items-center relative z-10">
              <Code className="w-4 h-4 mr-2" />
              {loading ? 'Importing...' : 'Import Project'}
            </div>
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    );
  }

  function ManualProjectForm({ onAdd, onCloseProject }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [stack, setStack] = useState('');
    const [link, setUrl] = useState('');
    const [features, setFeatures] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const handleSubmit = async () => {
      if (!title.trim() || !description.trim()) {
        setErr('Title and description are required');
        return;
      }

      const payload = {
        title,
        description,
        stack: stack.split(',').map(s => s.trim()).filter(Boolean),
        features: features.split(',').map(s => s.trim()).filter(Boolean),
        link,
      };

      try {
        setSubmitting(true);
        setErr(null);
        await onAdd(payload); // <-- will call API & update parent state
        // reset local fields
        setTitle('');
        setDescription('');
        setStack('');
        setFeatures('');
        setUrl('');
        // close dialog after success
        onCloseProject();
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || 'Failed to add project');
      } finally {
        setSubmitting(false);
      }
    };
    const handleClose = () => {
      onCloseProject();
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="project-title">Project Title</Label>
          <Input
            id="project-title"
            placeholder="My Awesome Project"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            placeholder="Describe your project..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-stack">Tech Stack (comma-separated)</Label>
          <Input
            id="project-stack"
            placeholder="React, Node.js, MongoDB"
            value={stack}
            onChange={(e) => setStack(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-features">Key Features (comma-separated)</Label>
          <Input
            id="project-features"
            placeholder="User Authentication, Real-time Updates, Payment Integration"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-url">Project URL (optional)</Label>
          <Input
            id="project-url"
            placeholder="https://myproject.com"
            value={link}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="flex space-x-3">
          <Button
            className="btn-primary flex-1"
            onClick={handleSubmit}
            disabled={!title || !description}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    );
  }




};

export default Projects;