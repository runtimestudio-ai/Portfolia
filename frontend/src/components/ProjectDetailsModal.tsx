import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ExternalLink, Star, GitBranch } from 'lucide-react';
import type { Project } from '@/types/project';

interface ProjectDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
}

export function ProjectDetailsModal({ isOpen, onClose, project }: ProjectDetailsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gradient-primary">
                        {project.title}
                    </DialogTitle>
                    <DialogDescription>
                        Full details and statistics for this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Description</h3>
                        <Card className="p-4 bg-muted/30">
                            <p className="text-foreground leading-relaxed">
                                {project.description || "No description provided."}
                            </p>
                        </Card>
                    </div>

                    {/* Tech Stack */}
                    {project.stack && project.stack.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Tech Stack</h3>
                            <div className="flex flex-wrap gap-2">
                                {project.stack.map((tech, index) => (
                                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                                        {tech}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Key Features */}
                    {project.features && project.features.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Key Features</h3>
                            <div className="flex flex-wrap gap-2">
                                {project.features.map((feature, index) => (
                                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                                        {feature}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-sm text-foreground-muted">
                        <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4" />
                            <span>{project.stars || 0} stars</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <GitBranch className="w-4 h-4" />
                            <span>{project.forks || 0} forks</span>
                        </div>
                        {project.lastUpdated && <span>Updated: {project.lastUpdated}</span>}
                    </div>

                    {/* Status Indicators */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${project.status?.imported ? 'bg-success' : 'bg-muted'}`} />
                            <span className="text-sm">GitHub Import</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${project.status?.aiSummary ? 'bg-primary' : 'bg-muted'}`} />
                            <span className="text-sm">AI Enhanced</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${project.status?.saved ? 'bg-electric' : 'bg-muted'}`} />
                            <span className="text-sm">Saved</span>
                        </div>
                    </div>

                    {/* View Link */}
                    {project.link && (
                        <div className="flex justify-end pt-4">
                            <a href={project.link} target="_blank" rel="noopener noreferrer">
                                <Button className="btn-primary">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open Project
                                </Button>
                            </a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
