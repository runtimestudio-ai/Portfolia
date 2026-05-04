import { ChevronRight, ChevronsLeftRight, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface VerticalToggleProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const VerticalToggle = ({ isOpen, onToggle }: VerticalToggleProps) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        onClick={onToggle}
                        className={`
              w-3 relative flex-shrink-0 cursor-col-resize transition-all duration-300
              flex items-center justify-center
              hover:bg-purple-500/10 group z-20
              ${isOpen ? 'border-l border-border' : ''}
            `}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onToggle();
                            }
                        }}
                    >
                        {/* Visible Divider Line */}
                        <div className={`
              absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 transition-colors duration-300
              ${isOpen ? 'bg-border group-hover:bg-purple-400' : 'bg-transparent'}
            `} />

                        {/* Toggle Handle - Always visible on hover, or permanently if collapsed */}
                        <div className={`
              flex items-center justify-center w-6 h-12 rounded-full 
              bg-white dark:bg-slate-800 border border-border shadow-sm
              transition-all duration-300 transform
              ${isOpen
                                ? 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                                : 'opacity-100 scale-100 translate-x-1/2 absolute right-0'
                            }
            `}>
                            {isOpen ? (
                                <ChevronRight size={14} className="text-muted-foreground" />
                            ) : (
                                <ChevronLeft size={14} className="text-muted-foreground" />
                            )}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>{isOpen ? "Collapse AI Panel" : "Expand AI Panel"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
