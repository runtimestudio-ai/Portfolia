import { Button } from "@/components/ui/button";
import { Eye, Edit3, Palette, CheckCircle, Activity, Send } from "lucide-react";

interface EditorHeaderProps {
    onViewMode: () => void;
    onPublish: () => void;
    onToggleTemplates: () => void;
    saveStatus: 'saved' | 'saving' | 'unsaved';
    showTemplateSelector: boolean; // Keep for now if needed for logic, though button toggles it
}

export const EditorHeader = ({
    onViewMode,
    onPublish,
    onToggleTemplates,
    saveStatus,
}: EditorHeaderProps) => {
    return (
        <div className="px-6 py-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
            {/* Left: Mode Navigation */}
            <div className="flex items-center space-x-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewMode}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    className="bg-primary text-primary-foreground"
                >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                </Button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleTemplates}
                    className="hidden sm:flex"
                >
                    <Palette className="w-4 h-4 mr-2" />
                    Templates
                </Button>

                {/* Save Status Indicator */}
                <div className="hidden md:flex items-center text-sm px-3 py-1.5 rounded-md bg-muted/50">
                    {saveStatus === 'saved' && (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            All changes saved
                        </span>
                    )}
                    {saveStatus === 'saving' && (
                        <span className="flex items-center text-blue-600 dark:text-blue-400">
                            <Activity className="w-4 h-4 mr-1.5 animate-pulse" />
                            Saving...
                        </span>
                    )}
                    {saveStatus === 'unsaved' && (
                        <span className="flex items-center text-orange-600 dark:text-orange-400">
                            <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                            Unsaved changes
                        </span>
                    )}
                </div>

                <Button
                    variant="default"
                    size="sm"
                    onClick={onPublish}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg"
                >
                    <Send className="w-4 h-4 mr-2" />
                    Publish
                </Button>
            </div>
        </div>
    );
};
