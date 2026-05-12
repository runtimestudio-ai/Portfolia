import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { enhanceProjectDescription, type AIEnhanceVariant } from '@/utils/api';

interface AIEnhanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: {
        id: number;
        title: string;
        description: string;
        techStack: string[];
    };
    onApply: (newDescription: string) => void;
}

type LengthOption = "short" | "medium" | "long";

const TONE_OPTIONS = [
    { value: "professional", label: "Professional" },
    { value: "ats-optimized", label: "ATS-Optimized" },
    { value: "confident", label: "Confident" },
    { value: "minimal", label: "Minimal" },
    { value: "storytelling", label: "Storytelling" },
];

const LENGTH_INFO = {
    short: "40-60 words",
    medium: "80-120 words",
    long: "150-200 words",
};

export function AIEnhanceModal({ isOpen, onClose, project, onApply }: AIEnhanceModalProps) {
    const [length, setLength] = useState<LengthOption>("medium");
    const [tones, setTones] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [variants, setVariants] = useState<{ id: number; text: string }[]>([]);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleToneToggle = (tone: string) => {
        if (tones.includes(tone)) {
            // Remove if already selected
            setTones(tones.filter(t => t !== tone));
        } else {
            // Add if not selected and less than 2 tones
            if (tones.length < 2) {
                setTones([...tones, tone]);
            }
        }
    };

    const handleGenerate = async () => {
        // If variants already exist, clear them (regenerate mode)
        if (variants.length > 0) {
            setVariants([]);
            setSelectedVariantId(null);
        }

        setLoading(true);
        setError(null);

        try {
            const result = await enhanceProjectDescription({
                title: project.title,
                description: project.description,
                tech_stack: project.techStack,
                length,
                tones,
            });

            // Split the first variant's text by the delimiter |||
            // Since backend returns 3 variants but each might contain combined text
            if (result.length > 0) {
                const firstVariantText = result[0].text;
                const parts = firstVariantText
                    .split('|||')
                    .map(part => part.trim())
                    .filter(part => part.length > 0);

                // Take up to 3 parts and create variant objects
                const processedVariants = parts.slice(0, 3).map((text, index) => ({
                    id: index + 1,
                    text,
                }));

                setVariants(processedVariants);
                setSelectedVariantId(null);
            } else {
                setError("No variants were generated. Please try again.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to generate variants. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        const selectedVariant = variants.find(v => v.id === selectedVariantId);
        if (selectedVariant) {
            onApply(selectedVariant.text);
            handleClose();
        }
    };

    const handleClose = () => {
        // Reset state
        setLength("medium");
        setTones([]);
        setVariants([]);
        setSelectedVariantId(null);
        setError(null);
        setLoading(false);
        onClose();
    };

    const canGenerate = tones.length > 0 && project.description.trim().length > 0 && !loading;
    const canApply = selectedVariantId !== null;

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Enhance Project Description
                    </DialogTitle>
                    <DialogDescription>
                        Optimize your project description for different lengths and tones using AI.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Original Description */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Original Description</Label>
                        <Card className="p-3 bg-muted/50">
                            <p className="text-sm text-foreground-muted">
                                {project.description || "No description provided"}
                            </p>
                        </Card>
                    </div>

                    {/* Length Selector */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Description Length</Label>
                        <RadioGroup value={length} onValueChange={(value) => setLength(value as LengthOption)}>
                            <div className="grid grid-cols-3 gap-3">
                                {(["short", "medium", "long"] as LengthOption[]).map((len) => (
                                    <div key={len} className="flex items-center space-x-2">
                                        <RadioGroupItem value={len} id={`length-${len}`} />
                                        <Label
                                            htmlFor={`length-${len}`}
                                            className="cursor-pointer flex flex-col"
                                        >
                                            <span className="font-medium capitalize">{len}</span>
                                            <span className="text-xs text-foreground-muted">
                                                {LENGTH_INFO[len]}
                                            </span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Tone Selector */}
                    <div className="space-y-3">
                        <div>
                            <Label className="text-sm font-semibold">Tone</Label>
                            <p className="text-xs text-foreground-muted mt-1">
                                Select up to 2 tones (primary + secondary)
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {TONE_OPTIONS.map((tone) => {
                                const isChecked = tones.includes(tone.value);
                                const isDisabled = !isChecked && tones.length >= 2;

                                return (
                                    <div
                                        key={tone.value}
                                        className={`flex items-center space-x-2 ${isDisabled ? 'opacity-50' : ''
                                            }`}
                                    >
                                        <Checkbox
                                            id={`tone-${tone.value}`}
                                            checked={isChecked}
                                            onCheckedChange={() => handleToneToggle(tone.value)}
                                            disabled={isDisabled}
                                        />
                                        <Label
                                            htmlFor={`tone-${tone.value}`}
                                            className={`cursor-pointer ${isDisabled ? 'cursor-not-allowed' : ''}`}
                                        >
                                            {tone.label}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Generate Button */}
                    {tones.length === 0 && (
                        <p className="text-xs text-destructive">Please select at least 1 tone</p>
                    )}
                    {!project.description.trim() && (
                        <p className="text-xs text-destructive">Project description cannot be empty</p>
                    )}
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || tones.length === 0 || !project.description.trim()}
                        className="w-full btn-primary"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                {variants.length > 0 ? 'Regenerate Variants' : 'Generate Variants'}
                            </>
                        )}
                    </Button>

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-destructive font-medium">Error generating variants</p>
                                <p className="text-xs text-destructive/80 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Variants Display */}
                    {variants.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">
                                Select a variant ({variants.length} options)
                            </Label>
                            <RadioGroup
                                value={selectedVariantId?.toString()}
                                onValueChange={(value) => setSelectedVariantId(parseInt(value))}
                            >
                                <div className="space-y-3">
                                    {variants.map((variant) => (
                                        <div
                                            key={variant.id}
                                            className={`relative ${selectedVariantId === variant.id
                                                ? 'ring-2 ring-primary'
                                                : 'hover:bg-muted/50'
                                                } rounded-lg transition-all`}
                                        >
                                            <Card className="p-4 cursor-pointer">
                                                <div className="flex items-start gap-3">
                                                    <RadioGroupItem
                                                        value={variant.id.toString()}
                                                        id={`variant-${variant.id}`}
                                                        className="mt-1"
                                                    />
                                                    <Label
                                                        htmlFor={`variant-${variant.id}`}
                                                        className="cursor-pointer flex-1"
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs font-medium text-primary">
                                                                Option {variant.id}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-foreground leading-relaxed">
                                                            {variant.text}
                                                        </p>
                                                    </Label>
                                                </div>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={!canApply}
                        className="btn-electric"
                    >
                        Apply Selected
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
