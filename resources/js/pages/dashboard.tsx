import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, ClipboardList, FileQuestion, GraduationCap, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { index as trainingsIndex, create as trainingsCreate, show as trainingsShow } from '@/actions/App/Http/Controllers/TrainingController';

type Stats = {
    trainings: number;
    trainings_draft: number;
    trainings_in_progress: number;
    trainings_published: number;
    modules: number;
    exercises: number;
    quizzes: number;
};

type Training = {
    id: number;
    title: string;
    status: string;
    duration: string | null;
    level: string | null;
    modules_count: number;
    contexts_count: number;
    updated_at: string;
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    draft: { label: 'Brouillon', variant: 'secondary' },
    in_progress: { label: 'En cours', variant: 'default' },
    published: { label: 'Publiée', variant: 'outline' },
};

export default function Dashboard({ stats, recentTrainings }: { stats: Stats; recentTrainings: Training[] }) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <Button asChild>
                        <Link href={trainingsCreate().url}>
                            <Plus />
                            Nouvelle formation
                        </Link>
                    </Button>
                </div>

                {/* Stats cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Formations</CardTitle>
                            <GraduationCap className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.trainings}</div>
                            <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                                <span>{stats.trainings_draft} brouillon(s)</span>
                                <span>{stats.trainings_in_progress} en cours</span>
                                <span>{stats.trainings_published} publiée(s)</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Modules</CardTitle>
                            <BookOpen className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.modules}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.trainings > 0
                                    ? `~${Math.round(stats.modules / stats.trainings)} par formation`
                                    : 'Aucune formation'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Exercices</CardTitle>
                            <ClipboardList className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.exercises}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.modules > 0
                                    ? `~${Math.round(stats.exercises / stats.modules)} par module`
                                    : 'Aucun module'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
                            <FileQuestion className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.quizzes}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.modules > 0
                                    ? `~${Math.round(stats.quizzes / stats.modules)} par module`
                                    : 'Aucun module'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent trainings */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Formations récentes</CardTitle>
                            <CardDescription>Les 5 dernières formations modifiées</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={trainingsIndex().url}>Voir tout</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentTrainings.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                Aucune formation. Commencez par en créer une !
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {recentTrainings.map((training) => {
                                    const status = statusLabels[training.status] ?? statusLabels.draft;
                                    return (
                                        <div
                                            key={training.id}
                                            className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                                            onClick={() => router.visit(trainingsShow.url(training.id))}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">{training.title}</span>
                                                <div className="flex gap-3 text-xs text-muted-foreground">
                                                    {training.duration && <span>{training.duration}</span>}
                                                    {training.level && <span>{training.level}</span>}
                                                    <span>{training.modules_count} module(s)</span>
                                                    {training.contexts_count > 0 && (
                                                        <span>{training.contexts_count} contexte(s)</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
