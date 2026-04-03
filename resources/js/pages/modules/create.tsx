import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { index as trainingsIndex, show as trainingsShow } from '@/actions/App/Http/Controllers/TrainingController';
import { store as modulesStore } from '@/actions/App/Http/Controllers/ModuleController';
import InputError from '@/components/input-error';

type Training = {
    id: number;
    title: string;
};

export default function ModulesCreate({ training }: { training: Training }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        duration: '',
        objectives: '',
        content: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(modulesStore.url(training.id));
    }

    return (
        <>
            <Head title={`Nouveau module - ${training.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Nouveau module</h1>
                <p className="text-muted-foreground">Formation : {training.title}</p>

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations du module</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Titre</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Ex: Introduction et mise en place"
                                />
                                <InputError message={errors.title} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Durée</Label>
                                <Input
                                    id="duration"
                                    value={data.duration}
                                    onChange={(e) => setData('duration', e.target.value)}
                                    placeholder="Ex: 2h"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="objectives">Objectifs</Label>
                                <Textarea
                                    id="objectives"
                                    value={data.objectives}
                                    onChange={(e) => setData('objectives', e.target.value)}
                                    placeholder="Objectifs pédagogiques du module"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Contenu (Markdown/Marp)</Label>
                                <Textarea
                                    id="content"
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    placeholder="Contenu du support de cours..."
                                    rows={15}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            Créer le module
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

ModulesCreate.layout = {
    breadcrumbs: [
        { title: 'Formations', href: trainingsIndex() },
        { title: 'Module', href: '#' },
    ],
};
