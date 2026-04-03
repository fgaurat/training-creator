import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { index as trainingsIndex, create as trainingsCreate, show as trainingsShow } from '@/actions/App/Http/Controllers/TrainingController';

type Training = {
    id: number;
    title: string;
    description: string | null;
    duration: string | null;
    level: string | null;
    status: string;
    parent_id: number | null;
    modules_count: number;
    contexts_count: number;
    updated_at: string;
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    draft: { label: 'Brouillon', variant: 'secondary' },
    in_progress: { label: 'En cours', variant: 'default' },
    published: { label: 'Publiée', variant: 'outline' },
};

export default function TrainingsIndex({ trainings }: { trainings: Training[] }) {
    return (
        <>
            <Head title="Formations" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Formations</h1>
                    <Button asChild>
                        <Link href={trainingsCreate().url}>
                            <Plus />
                            Nouvelle formation
                        </Link>
                    </Button>
                </div>

                {trainings.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">Aucune formation pour le moment.</p>
                            <Button asChild className="mt-4">
                                <Link href={trainingsCreate().url}>
                                    <Plus />
                                    Créer ma première formation
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {trainings.map((training) => {
                            const status = statusLabels[training.status] ?? statusLabels.draft;
                            return (
                                <Card
                                    key={training.id}
                                    className="cursor-pointer transition-shadow hover:shadow-md"
                                    onClick={() => router.visit(trainingsShow.url(training.id))}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="line-clamp-2">{training.title}</CardTitle>
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </div>
                                        {training.description && (
                                            <CardDescription className="line-clamp-2">{training.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            {training.duration && <span>{training.duration}</span>}
                                            {training.level && <span>{training.level}</span>}
                                            <span>{training.modules_count} module(s)</span>
                                            {training.contexts_count > 0 && (
                                                <span>{training.contexts_count} contexte(s)</span>
                                            )}
                                        </div>
                                        {training.parent_id && (
                                            <Badge variant="outline" className="mt-2">Clone</Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

TrainingsIndex.layout = {
    breadcrumbs: [
        { title: 'Formations', href: trainingsIndex() },
    ],
};
