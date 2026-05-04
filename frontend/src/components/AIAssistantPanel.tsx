import { useState } from 'react';
import { Sparkles, Briefcase, FileText, X } from 'lucide-react';
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

export default function AIAssistantPanel() {
    const [role, setRole] = useState('full-stack');
    const [customRole, setCustomRole] = useState('');
    const [jd, setJd] = useState('');

    return (
        <div className="h-full flex flex-col">
            {/* STICKY HEADER - Always visible */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 p-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">AI Assistant</h2>
                        <p className="text-xs text-muted-foreground">Smart portfolio suggestions</p>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE CONTENT - Fills remaining space */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-6 space-y-6">
                    {/* Role Selector */}
                    <div className="space-y-2">
                        <Label htmlFor="role-select" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Target Role
                        </Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger id="role-select" className="w-full">
                                <SelectValue placeholder="Select target role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full-stack">Full-Stack Developer</SelectItem>
                                <SelectItem value="frontend">Frontend Developer</SelectItem>
                                <SelectItem value="backend">Backend Developer</SelectItem>
                                <SelectItem value="ai-ml">AI/ML Engineer</SelectItem>
                                <SelectItem value="devops">DevOps Engineer</SelectItem>
                                <SelectItem value="data-science">Data Scientist</SelectItem>
                                <SelectItem value="mobile">Mobile Developer</SelectItem>
                                <SelectItem value="custom">Custom Role</SelectItem>
                            </SelectContent>
                        </Select>

                        {role === 'custom' && (
                            <div className="animate-in fade-in slide-in-from-top-2 pt-1">
                                <Input
                                    placeholder="Enter your custom role..."
                                    value={customRole}
                                    onChange={(e) => setCustomRole(e.target.value)}
                                    className="bg-background"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>

                    {/* Job Description Input */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="jd-input" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Job Description <span className="text-xs text-muted-foreground">(Optional)</span>
                            </Label>
                            {jd && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={() => setJd('')}
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                        <Textarea
                            id="jd-input"
                            value={jd}
                            onChange={(e) => setJd(e.target.value)}
                            placeholder="Paste job description here to get tailored suggestions..."
                            className="min-h-[120px] text-sm resize-none"
                            rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                            💡 Used only for this session. Not stored or shared.
                        </p>
                    </div>

                    {/* Placeholder Content Area */}
                    <Card className="flex items-center justify-center bg-muted/30 border-dashed p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="font-medium text-foreground mb-2">AI Suggestions Coming Soon</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Start editing sections on the left to see smart AI-powered suggestions here.
                            </p>
                        </div>
                    </Card>

                    {/* Footer Note */}
                    <div className="text-xs text-muted-foreground border-t border-border pt-4 space-y-1">
                        <p className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Manual editing is always available
                        </p>
                        <p className="text-[10px] opacity-60">
                            AI features will enhance but never replace your control
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
