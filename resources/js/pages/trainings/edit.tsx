import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    index as trainingsIndex,
    show as trainingsShow,
    update as trainingsUpdate,
} from '@/actions/App/Http/Controllers/TrainingController';
import InputError from '@/components/input-error';

type Training = {
    id: number;
    title: string;
    description: string | null;
    duration: string | null;
    level: string | null;
    status: string;
    source_plan: string | null;
};

export default function TrainingsEdit({ training }: { training: Training }) {
    const { data, setData, put, processing, errors } = useForm({
        title: training.title,
        description: training.description ?? '',
        duration: training.duration ?? '',
        level: training.level ?? '',
        status: training.status,
        source_plan: training.source_plan ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(trainingsUpdate.url(training.id));
    }

    return (
        <>
            <Head title={`Modifier - ${training.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Modifier la formation</h1>

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations générales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Titre</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Durée</Label>
                                    <Input
                                        id="duration"
                                        value={data.duration}
                                        onChange={(e) => setData('duration', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="level">Niveau</Label>
                                    <Input
                                        id="level"
                                        value={data.level}
                                        onChange={(e) => setData('level', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Statut</Label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                    >
                                        <option value="draft">Brouillon</option>
                                        <option value="in_progress">En cours</option>
                                        <option value="published">Publiée</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Plan de cours</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={data.source_plan}
                                onChange={(e) => setData('source_plan', e.target.value)}
                                rows={10}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            Enregistrer
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={trainingsShow.url(training.id)}>Annuler</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

TrainingsEdit.layout = {
    breadcrumbs: [
        { title: 'Formations', href: trainingsIndex() },
        { title: 'Modifier', href: '#' },
    ],
};
