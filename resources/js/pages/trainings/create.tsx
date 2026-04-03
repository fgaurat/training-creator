import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { index as trainingsIndex, store as trainingsStore } from '@/actions/App/Http/Controllers/TrainingController';
import InputError from '@/components/input-error';

export default function TrainingsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        duration: '',
        level: '',
        source_plan: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(trainingsStore().url);
    }

    return (
        <>
            <Head title="Nouvelle formation" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Nouvelle formation</h1>

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
                                    placeholder="Ex: Introduction à Python"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Description courte de la formation"
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Durée</Label>
                                    <Input
                                        id="duration"
                                        value={data.duration}
                                        onChange={(e) => setData('duration', e.target.value)}
                                        placeholder="Ex: 3 jours"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="level">Niveau</Label>
                                    <Input
                                        id="level"
                                        value={data.level}
                                        onChange={(e) => setData('level', e.target.value)}
                                        placeholder="Ex: Débutant, Intermédiaire"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Plan de cours (optionnel)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                id="source_plan"
                                value={data.source_plan}
                                onChange={(e) => setData('source_plan', e.target.value)}
                                placeholder="Collez ici le plan de cours fourni par le centre de formation..."
                                rows={10}
                            />
                            <InputError message={errors.source_plan} />
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            Créer la formation
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={trainingsIndex().url}>Annuler</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

TrainingsCreate.layout = {
    breadcrumbs: [
        { title: 'Formations', href: trainingsIndex() },
        { title: 'Nouvelle', href: '#' },
    ],
};
