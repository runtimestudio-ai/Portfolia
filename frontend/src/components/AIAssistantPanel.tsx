import { useState, useEffect } from 'react';
import { Sparkles, Briefcase, FileText, X, User, Code, Award, GraduationCap, MapPin, Mail, Github, Linkedin, Globe, Trash2, Plus, ChevronDown, ChevronUp, Zap, Target, Lightbulb, Trophy, Edit3 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIAssistantPanelProps {
    data: any;
    onDataUpdate: (newData: any) => void;
    activeSection: string;
    onSectionChange: (section: string) => void;
}

export default function AIAssistantPanel({ data, onDataUpdate, activeSection, onSectionChange }: AIAssistantPanelProps) {
    const [role, setRole] = useState('full-stack');
    const [customRole, setCustomRole] = useState('');
    const [jd, setJd] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    // If data is null, show a loading or empty state
    if (!data) return <div className="p-8 text-center text-muted-foreground">Loading editor...</div>;

    const updateField = (field: string, value: any) => {
        onDataUpdate({ ...data, [field]: value });
    };

    const updateArrayItem = (arrayField: string, index: number, updatedItem: any) => {
        const array = [...(data[arrayField] || [])];
        array[index] = updatedItem;
        onDataUpdate({ ...data, [arrayField]: array });
    };

    const addArrayItem = (arrayField: string, newItem: any) => {
        const array = [...(data[arrayField] || []), newItem];
        onDataUpdate({ ...data, [arrayField]: array });
    };

    const removeArrayItem = (arrayField: string, index: number) => {
        const array = (data[arrayField] || []).filter((_: any, i: number) => i !== index);
        onDataUpdate({ ...data, [arrayField]: array });
    };

    const handleGenerateSuggestions = () => {
        setIsGenerating(true);
        // Simulate AI generation for now
        setTimeout(() => {
            const mockSuggestions = [
                {
                    title: "Add 'Real-time Sync'",
                    description: "Based on your tech stack, adding real-time synchronization would demonstrate high-level engineering skills.",
                    impact: "High Impact"
                },
                {
                    title: "Rewrite Bio",
                    description: "Your bio could be more 'Storytelling' focused to highlight your journey as a student.",
                    impact: "Medium Impact"
                }
            ];
            setSuggestions(mockSuggestions);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col bg-background border-l">
            {/* STICKY HEADER */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 p-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">AI Assistant</h2>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Smart Portfolio Co-Pilot</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleGenerateSuggestions} 
                        disabled={isGenerating}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-none shadow-md"
                    >
                        {isGenerating ? "Analyzing..." : "Analyze Portfolio"}
                    </Button>
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <ScrollArea className="flex-1">
                <div className="p-5 space-y-8">
                    {/* 1. CONFIGURATION SECTION */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="role-select" className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-3 h-3" />
                                Target Career Path
                            </Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger id="role-select" className="w-full bg-muted/30 border-muted-foreground/10 h-11">
                                    <SelectValue placeholder="Select target role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full-stack">Full-Stack Developer</SelectItem>
                                    <SelectItem value="frontend">Frontend Developer</SelectItem>
                                    <SelectItem value="backend">Backend Developer</SelectItem>
                                    <SelectItem value="ai-ml">AI/ML Engineer</SelectItem>
                                    <SelectItem value="devops">DevOps Engineer</SelectItem>
                                    <SelectItem value="custom">Custom Role</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jd-input" className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Briefcase className="w-3 h-3" />
                                Target Job Description
                            </Label>
                            <Textarea
                                id="jd-input"
                                value={jd}
                                onChange={(e) => setJd(e.target.value)}
                                placeholder="Paste a JD to get hyper-tailored advice..."
                                className="min-h-[100px] text-sm resize-none bg-muted/30 border-muted-foreground/10 focus:bg-background transition-colors"
                            />
                        </div>
                    </div>

                    {/* 2. AI SUGGESTIONS SECTION */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-500" />
                            Smart Suggestions
                        </h3>
                        
                        {suggestions.length > 0 ? (
                            <div className="grid gap-3">
                                {suggestions.map((s, i) => (
                                    <Card key={i} className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border-purple-100 dark:border-purple-900/30 group hover:shadow-md transition-all cursor-pointer">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-bold text-sm text-purple-900 dark:text-purple-100 group-hover:text-purple-600 transition-colors">{s.title}</h4>
                                            <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-black/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 uppercase tracking-tighter">{s.impact}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                                        <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-[10px] text-purple-600 font-bold uppercase tracking-widest">Apply suggestion →</Button>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted rounded-xl bg-muted/10 text-center space-y-2 opacity-60">
                                <Lightbulb className="w-8 h-8 text-muted-foreground mb-1" />
                                <p className="text-xs font-medium">Click "Analyze Portfolio" to get AI-powered improvement ideas.</p>
                            </div>
                        )}
                    </div>

                    {/* 3. MANUAL EDIT FORMS SECTION */}
                    <div className="space-y-4 pb-8">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Edit3 className="w-3 h-3 text-blue-500" />
                            Manual Controls
                        </h3>

                        <Accordion type="single" value={activeSection} onValueChange={onSectionChange} className="w-full space-y-3">
                            {/* Personal Info */}
                            <AccordionItem value="personal" className="border rounded-xl bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                                <AccordionTrigger className="hover:no-underline px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-bold text-sm text-blue-900 dark:text-blue-100">Personal Identity</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 space-y-4">
                                    <div className="grid grid-cols-1 gap-4 pt-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ml-1">Full Name</Label>
                                            <Input value={data.name} onChange={(e) => updateField('name', e.target.value)} className="h-10 text-sm bg-white dark:bg-black/20" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ml-1">Professional Title</Label>
                                            <Input value={data.title} onChange={(e) => updateField('title', e.target.value)} className="h-10 text-sm bg-white dark:bg-black/20" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ml-1">Brief Bio</Label>
                                            <Textarea value={data.about} onChange={(e) => updateField('about', e.target.value)} className="text-sm min-h-[100px] bg-white dark:bg-black/20" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ml-1">Email</Label>
                                                <Input value={data.email} onChange={(e) => updateField('email', e.target.value)} className="h-10 text-sm bg-white dark:bg-black/20" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground/70 ml-1">Location</Label>
                                                <Input value={data.location} onChange={(e) => updateField('location', e.target.value)} className="h-10 text-sm bg-white dark:bg-black/20" />
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Projects */}
                            <AccordionItem value="projects" className="border rounded-xl bg-green-50/30 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
                                <AccordionTrigger className="hover:no-underline px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shadow-md shadow-green-500/20">
                                            <Code className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-bold text-sm text-green-900 dark:text-green-100">Featured Projects</span>
                                        <Badge variant="secondary" className="ml-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">{data.projects?.length || 0}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 space-y-4">
                                    {data.projects?.map((project: any, idx: number) => (
                                        <Card key={idx} className="p-4 space-y-3 relative bg-white dark:bg-black/20 border-green-100 dark:border-green-900/30 shadow-sm">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                                onClick={() => removeArrayItem('projects', idx)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <div className="space-y-3 pt-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Project Title</Label>
                                                    <Input value={project.title} onChange={(e) => updateArrayItem('projects', idx, { ...project, title: e.target.value })} className="h-9 text-sm" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Description</Label>
                                                    <Textarea value={project.description} onChange={(e) => updateArrayItem('projects', idx, { ...project, description: e.target.value })} className="text-xs min-h-[80px]" />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    <Button variant="outline" size="sm" className="w-full border-dashed border-green-300 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950" onClick={() => addArrayItem('projects', { title: '', description: '', tech: [], features: [], demo: '', repo: '', stars: 0 })}>
                                        <Plus className="w-3 h-3 mr-2" />
                                        Add New Project
                                    </Button>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Skills */}
                            <AccordionItem value="skills" className="border rounded-xl bg-orange-50/30 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
                                <AccordionTrigger className="hover:no-underline px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                                            <Zap className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-bold text-sm text-orange-900 dark:text-orange-100">Technical Skills</span>
                                        <Badge variant="secondary" className="ml-2 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">{data.skills?.length || 0}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 space-y-4">
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {data.skills?.map((skill: any, idx: number) => (
                                            <Badge key={idx} variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-black/20 border-orange-200 dark:border-orange-800 group">
                                                <span className="text-xs font-bold text-orange-900 dark:text-orange-100">{skill.name}</span>
                                                <button onClick={() => removeArrayItem('skills', idx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input placeholder="Enter a new skill..." onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                addArrayItem('skills', { name: e.currentTarget.value.trim(), category: 'Other', level: 80 });
                                                e.currentTarget.value = '';
                                            }
                                        }} className="h-9 text-xs" />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Achievements */}
                            <AccordionItem value="achievements" className="border rounded-xl bg-purple-50/30 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
                                <AccordionTrigger className="hover:no-underline px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center shadow-md shadow-purple-500/20">
                                            <Trophy className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-bold text-sm text-purple-900 dark:text-purple-100">Achievements</span>
                                        <Badge variant="secondary" className="ml-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">{data.achievements?.length || 0}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 space-y-4">
                                    {data.achievements?.map((achievement: any, idx: number) => (
                                        <Card key={idx} className="p-4 space-y-3 relative bg-white dark:bg-black/20 border-purple-100 dark:border-purple-900/30 shadow-sm">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                                onClick={() => removeArrayItem('achievements', idx)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <div className="space-y-3 pt-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Achievement Title</Label>
                                                    <Input value={achievement.title} onChange={(e) => updateArrayItem('achievements', idx, { ...achievement, title: e.target.value })} className="h-9 text-sm" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Issuer / Organization</Label>
                                                    <Input value={achievement.issuer} onChange={(e) => updateArrayItem('achievements', idx, { ...achievement, issuer: e.target.value })} className="h-9 text-sm" />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    <Button variant="outline" size="sm" className="w-full border-dashed border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950" onClick={() => addArrayItem('achievements', { title: '', issuer: '', date: '', description: '', type: 'award' })}>
                                        <Plus className="w-3 h-3 mr-2" />
                                        Add Achievement
                                    </Button>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Certificates */}
                            <AccordionItem value="certificates" className="border rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
                                <AccordionTrigger className="hover:no-underline px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                                            <GraduationCap className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-bold text-sm text-indigo-900 dark:text-indigo-100">Certifications</span>
                                        <Badge variant="secondary" className="ml-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">{data.certificates?.length || 0}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 space-y-4">
                                    {data.certificates?.map((cert: any, idx: number) => (
                                        <Card key={idx} className="p-4 space-y-3 relative bg-white dark:bg-black/20 border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                                onClick={() => removeArrayItem('certificates', idx)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <div className="space-y-3 pt-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Certification Name</Label>
                                                    <Input value={cert.title} onChange={(e) => updateArrayItem('certificates', idx, { ...cert, title: e.target.value })} className="h-9 text-sm" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Issuer</Label>
                                                    <Input value={cert.issuer} onChange={(e) => updateArrayItem('certificates', idx, { ...cert, issuer: e.target.value })} className="h-9 text-sm" />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    <Button variant="outline" size="sm" className="w-full border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950" onClick={() => addArrayItem('certificates', { title: '', issuer: '', date: '', credentialId: '' })}>
                                        <Plus className="w-3 h-3 mr-2" />
                                        Add Certificate
                                    </Button>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );

}
