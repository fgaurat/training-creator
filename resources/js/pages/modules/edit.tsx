import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Columns2, Eye, Maximize2, Minimize2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { index as trainingsIndex, show as trainingsShow } from '@/actions/App/Http/Controllers/TrainingController';
import { update as modulesUpdate } from '@/actions/App/Http/Controllers/ModuleController';
import InputError from '@/components/input-error';
import { MarkdownEditor } from '@/components/markdown-editor';
import { MarpPreview } from '@/components/marp-preview';

type Module = {
    id: number;
    title: string;
    order: number;
    duration: string | null;
    objectives: string | null;
    content: string | null;
};

type Training = {
    id: number;
    title: string;
};

type ViewMode = 'editor' | 'preview' | 'split';

export default function ModulesEdit({ training, module }: { training: Training; module: Module }) {
    const { data, setData, put, processing, errors } = useForm({
        title: module.title,
        duration: module.duration ?? '',
        objectives: module.objectives ?? '',
        content: module.content ?? '',
    });

    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [fullscreen, setFullscreen] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(modulesUpdate.url({ training: training.id, module: module.id }));
    }

    const editorSection = (
        <div className={fullscreen ? 'h-full' : 'h-[70vh]'}>
            <MarkdownEditor
                value={data.content}
                onChange={(val) => setData('content', val)}
                className="h-full"
            />
        </div>
    );

    const previewSection = (
        <div className={`overflow-auto ${fullscreen ? 'h-full' : 'h-[70vh]'}`}>
            <MarpPreview content={data.content} className="h-full" />
        </div>
    );

    const editorContent = (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant={viewMode === 'editor' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('editor')}
                    >
                        <Pencil className="size-3" />
                        Éditeur
                    </Button>
                    <Button
                        type="button"
                        variant={viewMode === 'split' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('split')}
                    >
                        <Columns2 className="size-3" />
                        Split
                    </Button>
                    <Button
                        type="button"
                        variant={viewMode === 'preview' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('preview')}
                    >
                        <Eye className="size-3" />
                        Preview
                    </Button>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFullscreen(!fullscreen)}
                >
                    {fullscreen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
                </Button>
            </div>

            {/* Editor / Preview */}
            <div className="flex-1 min-h-0">
                {viewMode === 'editor' && editorSection}
                {viewMode === 'preview' && previewSection}
                {viewMode === 'split' && (
                    <div className={`grid grid-cols-2 gap-0 divide-x ${fullscreen ? 'h-full' : 'h-[70vh]'}`}>
                        <div className="h-full overflow-hidden">{editorSection}</div>
                        <div className="h-full overflow-hidden">{previewSection}</div>
                    </div>
                )}
            </div>
        </div>
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-background">
                <div className="flex items-center justify-between border-b px-4 py-2">
                    <div className="flex items-center gap-3">
                        <h2 className="font-semibold">{module.title}</h2>
                        <span className="text-sm text-muted-foreground">{training.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            disabled={processing}
                            onClick={handleSubmit}
                        >
                            Enregistrer
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFullscreen(false)}
                        >
                            <Minimize2 className="size-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex-1 min-h-0">{editorContent}</div>
            </div>
        );
    }

    return (
        <>
            <Head title={`Modifier - ${module.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Modifier le module</h1>
                        <p className="text-muted-foreground">Formation : {training.title}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" disabled={processing} onClick={handleSubmit}>
                            Enregistrer
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={trainingsShow.url(training.id)}>Retour</Link>
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Module info - collapsible compact */}
                    <Card className="mb-4">
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Informations du module</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="title" className="text-xs">Titre</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                    <InputError message={errors.title} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="duration" className="text-xs">Durée</Label>
                                    <Input
                                        id="duration"
                                        value={data.duration}
                                        onChange={(e) => setData('duration', e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="objectives" className="text-xs">Objectifs</Label>
                                    <Input
                                        id="objectives"
                                        value={data.objectives}
                                        onChange={(e) => setData('objectives', e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Editor */}
                    <div className="rounded-lg border overflow-hidden">
                        {editorContent}
                    </div>
                </form>
            </div>
        </>
    );
}

ModulesEdit.layout = {
    breadcrumbs: [
        { title: 'Formations', href: trainingsIndex() },
        { title: 'Module', href: '#' },
    ],
};
