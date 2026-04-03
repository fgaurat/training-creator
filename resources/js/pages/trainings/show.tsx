import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Download, ExternalLink, FileText, MessageSquarePlus, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import {
    index as trainingsIndex,
    show as trainingsShow,
    destroy as trainingsDestroy,
    duplicate as trainingsDuplicate,
} from '@/actions/App/Http/Controllers/TrainingController';
import { edit as modulesEdit, destroy as modulesDestroy } from '@/actions/App/Http/Controllers/ModuleController';
import { store as contextsStore, destroy as contextsDestroy } from '@/actions/App/Http/Controllers/ContextController';
import { generateModules, generateContent, generateExercises, generateQuizzes } from '@/actions/App/Http/Controllers/AiGenerateController';
import { googleSlides as exportGoogleSlides } from '@/actions/App/Http/Controllers/ExportController';
import { redirect as googleRedirect } from '@/actions/App/Http/Controllers/GoogleAuthController';

type QuizOption = {
    id: number;
    label: string;
    is_correct: boolean;
};

type Quiz = {
    id: number;
    question: string;
    type: string;
    options: QuizOption[];
};

type Exercise = {
    id: number;
    title: string;
    type: string;
    instructions: string | null;
    solution: string | null;
};

type Module = {
    id: number;
    title: string;
    order: number;
    duration: string | null;
    objectives: string | null;
    content: string | null;
    exercises: Exercise[];
    quizzes: Quiz[];
};

type Context = {
    id: number;
    title: string;
    client_name: string | null;
    type: string;
    content: string | null;
};

type Export = {
    id: number;
    type: string;
    file_path: string | null;
    external_url: string | null;
    generated_at: string | null;
};

type Training = {
    id: number;
    title: string;
    description: string | null;
    duration: string | null;
    level: string | null;
    status: string;
    source_plan: string | null;
    parent_id: number | null;
    parent: { id: number; title: string } | null;
    modules: Module[];
    contexts: Context[];
    exports: Export[];
};

const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    in_progress: 'En cours',
    published: 'Publiée',
};

export default function TrainingsShow({ training, googleConnected }: { training: Training; googleConnected: boolean }) {
    const [aiLoading, setAiLoading] = useState<string | null>(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [showContextForm, setShowContextForm] = useState(false);
    const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

    function toggleModuleContent(moduleId: number) {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    }

    const contextForm = useForm({
        title: '',
        client_name: '',
        type: 'client_brief',
        content: '',
    });

    function handleDelete() {
        if (confirm('Supprimer cette formation et tout son contenu ?')) {
            router.delete(trainingsDestroy.url(training.id));
        }
    }

    function handleDuplicate() {
        router.post(trainingsDuplicate.url(training.id));
    }

    function getXsrfToken(): string {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    }

    function aiFetch(url: string) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': getXsrfToken(),
            },
            credentials: 'same-origin',
        });
    }

    function handleAiGenerateModules() {
        setAiLoading('modules');
        aiFetch(generateModules.url(training.id))
            .then((r) => r.json())
            .then(() => router.reload())
            .finally(() => setAiLoading(null));
    }

    function handleAiContent(moduleId: number) {
        setAiLoading(`content-${moduleId}`);
        aiFetch(generateContent.url({ training: training.id, module: moduleId }))
            .then((r) => r.json())
            .then(() => router.reload())
            .finally(() => setAiLoading(null));
    }

    function handleAiExercises(moduleId: number) {
        setAiLoading(`exercises-${moduleId}`);
        aiFetch(generateExercises.url({ training: training.id, module: moduleId }))
            .then((r) => r.json())
            .then(() => router.reload())
            .finally(() => setAiLoading(null));
    }

    function handleAiQuizzes(moduleId: number) {
        setAiLoading(`quizzes-${moduleId}`);
        aiFetch(generateQuizzes.url({ training: training.id, module: moduleId }))
            .then((r) => r.json())
            .then(() => router.reload())
            .finally(() => setAiLoading(null));
    }

    function handleExportGoogleSlides() {
        if (!googleConnected) {
            window.location.href = googleRedirect.url();
            return;
        }
        setExportLoading(true);
        aiFetch(exportGoogleSlides.url(training.id))
            .then((r) => r.json())
            .then((data) => {
                if (data.url) {
                    window.open(data.url, '_blank');
                    router.reload();
                } else if (data.redirect) {
                    window.location.href = data.redirect;
                } else if (data.error) {
                    alert(data.error);
                }
            })
            .catch(() => alert('Erreur lors de l\'export'))
            .finally(() => setExportLoading(false));
    }

    function handleDeleteModule(moduleId: number) {
        if (confirm('Supprimer ce module ?')) {
            router.delete(modulesDestroy.url({ training: training.id, module: moduleId }));
        }
    }

    function handleSubmitContext(e: React.FormEvent) {
        e.preventDefault();
        contextForm.post(contextsStore.url(training.id), {
            onSuccess: () => {
                contextForm.reset();
                setShowContextForm(false);
            },
        });
    }

    function handleDeleteContext(contextId: number) {
        if (confirm('Supprimer ce contexte ?')) {
            router.delete(contextsDestroy.url({ training: training.id, context: contextId }));
        }
    }

    return (
        <>
            <Head title={training.title} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{training.title}</h1>
                        {training.description && (
                            <p className="mt-1 text-muted-foreground">{training.description}</p>
                        )}
                        <div className="mt-2 flex gap-2">
                            <Badge variant="secondary">{statusLabels[training.status] ?? training.status}</Badge>
                            {training.duration && <Badge variant="outline">{training.duration}</Badge>}
                            {training.level && <Badge variant="outline">{training.level}</Badge>}
                            {training.parent && (
                                <Badge variant="outline">
                                    Clone de{' '}
                                    <Link
                                        href={trainingsShow.url(training.parent.id)}
                                        className="underline"
                                    >
                                        {training.parent.title}
                                    </Link>
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/trainings/${training.id}/edit`}>
                                <Pencil />
                                Modifier
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDuplicate}>
                            <Copy />
                            Cloner
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportGoogleSlides}
                            disabled={exportLoading}
                        >
                            <Download />
                            {exportLoading ? 'Export...' : 'Google Slides'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 />
                        </Button>
                    </div>
                </div>

                {/* Exports */}
                {training.exports.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Exports</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {training.exports.map((exp) => (
                                    <div key={exp.id} className="flex items-center justify-between rounded-md border p-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{exp.type}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {exp.generated_at ? new Date(exp.generated_at).toLocaleDateString('fr-FR') : ''}
                                            </span>
                                        </div>
                                        {exp.external_url && (
                                            <a
                                                href={exp.external_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                                            >
                                                Ouvrir <ExternalLink className="size-3" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Source Plan */}
                {training.source_plan && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="size-4" />
                                Plan de cours source
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                                {training.source_plan}
                            </pre>
                        </CardContent>
                    </Card>
                )}

                {/* Contexts */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Contextes</h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowContextForm(!showContextForm)}
                        >
                            <MessageSquarePlus />
                            Ajouter un contexte
                        </Button>
                    </div>

                    {showContextForm && (
                        <Card className="mb-4">
                            <form onSubmit={handleSubmitContext}>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ctx-title">Titre</Label>
                                            <Input
                                                id="ctx-title"
                                                value={contextForm.data.title}
                                                onChange={(e) => contextForm.setData('title', e.target.value)}
                                                placeholder="Ex: Brief client Acme"
                                            />
                                            <InputError message={contextForm.errors.title} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ctx-client">Client</Label>
                                            <Input
                                                id="ctx-client"
                                                value={contextForm.data.client_name}
                                                onChange={(e) => contextForm.setData('client_name', e.target.value)}
                                                placeholder="Nom du client"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ctx-content">Contenu</Label>
                                        <Textarea
                                            id="ctx-content"
                                            value={contextForm.data.content}
                                            onChange={(e) => contextForm.setData('content', e.target.value)}
                                            placeholder="CR de réunion, brief client, spécificités..."
                                            rows={6}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="gap-2">
                                    <Button type="submit" disabled={contextForm.processing}>
                                        Ajouter
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowContextForm(false)}>
                                        Annuler
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    )}

                    {training.contexts.length > 0 && (
                        <div className="grid gap-3 md:grid-cols-2">
                            {training.contexts.map((ctx) => (
                                <Card key={ctx.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-sm">{ctx.title}</CardTitle>
                                                {ctx.client_name && (
                                                    <CardDescription>{ctx.client_name}</CardDescription>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                onClick={() => handleDeleteContext(ctx.id)}
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    {ctx.content && (
                                        <CardContent>
                                            <p className="line-clamp-4 text-sm text-muted-foreground">
                                                {ctx.content}
                                            </p>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modules */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Modules ({training.modules.length})
                        </h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAiGenerateModules}
                                disabled={aiLoading !== null}
                            >
                                <Sparkles />
                                {aiLoading === 'modules' ? 'Génération...' : 'Générer avec IA'}
                            </Button>
                            <Button size="sm" asChild>
                                <Link href={`/trainings/${training.id}/modules/create`}>
                                    <Plus />
                                    Ajouter
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {training.modules.map((mod) => (
                            <Card key={mod.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle>
                                                <span className="text-muted-foreground">
                                                    {mod.order + 1}.
                                                </span>{' '}
                                                {mod.title}
                                            </CardTitle>
                                            <CardDescription>
                                                {mod.duration && <span>{mod.duration}</span>}
                                                {mod.objectives && (
                                                    <span className="ml-2">{mod.objectives}</span>
                                                )}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="size-7" asChild>
                                                <Link
                                                    href={modulesEdit.url({
                                                        training: training.id,
                                                        module: mod.id,
                                                    })}
                                                >
                                                    <Pencil className="size-3" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                onClick={() => handleDeleteModule(mod.id)}
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Content status */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {mod.content ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleModuleContent(mod.id)}
                                                className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                            >
                                                {expandedModules.has(mod.id) ? (
                                                    <ChevronDown className="size-3" />
                                                ) : (
                                                    <ChevronRight className="size-3" />
                                                )}
                                                Support (rédigé)
                                            </button>
                                        ) : (
                                            <Badge variant="outline">Support (vide)</Badge>
                                        )}
                                        <Badge variant={mod.exercises.length > 0 ? 'default' : 'outline'}>
                                            {mod.exercises.length} exercice(s)
                                        </Badge>
                                        <Badge variant={mod.quizzes.length > 0 ? 'default' : 'outline'}>
                                            {mod.quizzes.length} quiz(s)
                                        </Badge>
                                    </div>

                                    {/* Content preview */}
                                    {mod.content && expandedModules.has(mod.id) && (
                                        <div className="rounded-md border bg-muted/50 p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    Aperçu du support (Markdown/Marp)
                                                </span>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link
                                                        href={modulesEdit.url({
                                                            training: training.id,
                                                            module: mod.id,
                                                        })}
                                                    >
                                                        <Pencil className="size-3" />
                                                        Éditer
                                                    </Link>
                                                </Button>
                                            </div>
                                            <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm font-mono">
                                                {mod.content}
                                            </pre>
                                        </div>
                                    )}

                                    {/* AI actions */}
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAiContent(mod.id)}
                                            disabled={aiLoading !== null}
                                        >
                                            <Sparkles className="size-3" />
                                            {aiLoading === `content-${mod.id}`
                                                ? 'Génération...'
                                                : 'Générer le support'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAiExercises(mod.id)}
                                            disabled={aiLoading !== null}
                                        >
                                            <Sparkles className="size-3" />
                                            {aiLoading === `exercises-${mod.id}`
                                                ? 'Génération...'
                                                : 'Générer exercices'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAiQuizzes(mod.id)}
                                            disabled={aiLoading !== null}
                                        >
                                            <Sparkles className="size-3" />
                                            {aiLoading === `quizzes-${mod.id}`
                                                ? 'Génération...'
                                                : 'Générer quizzes'}
                                        </Button>
                                    </div>

                                    {/* Exercises */}
                                    {mod.exercises.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-medium">Exercices</h4>
                                            <div className="space-y-2">
                                                {mod.exercises.map((ex) => (
                                                    <div
                                                        key={ex.id}
                                                        className="rounded-md border p-3"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">
                                                                {ex.title}
                                                            </span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {ex.type}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quizzes */}
                                    {mod.quizzes.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-medium">Quizzes</h4>
                                            <div className="space-y-2">
                                                {mod.quizzes.map((quiz) => (
                                                    <div
                                                        key={quiz.id}
                                                        className="rounded-md border p-3"
                                                    >
                                                        <p className="text-sm font-medium">
                                                            {quiz.question}
                                                        </p>
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {quiz.options.map((opt) => (
                                                                <Badge
                                                                    key={opt.id}
                                                                    variant={
                                                                        opt.is_correct
                                                                            ? 'default'
                                                                            : 'outline'
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    {opt.label}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

TrainingsShow.layout = {
    breadcrumbs: [
        { title: 'Formations', href: trainingsIndex() },
        { title: 'Détail', href: '#' },
    ],
};
