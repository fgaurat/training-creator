import { useRef, useEffect, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    dark?: boolean;
}

export function MarkdownEditor({ value, onChange, className = '', dark = false }: MarkdownEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const createExtensions = useCallback(
        () => [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            history(),
            bracketMatching(),
            markdown({ codeLanguages: languages }),
            syntaxHighlighting(defaultHighlightStyle),
            ...(dark ? [oneDark] : []),
            keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    onChangeRef.current(update.state.doc.toString());
                }
            }),
            EditorView.lineWrapping,
            EditorView.theme({
                '&': { height: '100%' },
                '.cm-scroller': { overflow: 'auto' },
                '.cm-content': { fontFamily: 'ui-monospace, monospace', fontSize: '13px' },
            }),
        ],
        [dark],
    );

    useEffect(() => {
        if (!editorRef.current) return;

        const state = EditorState.create({
            doc: value,
            extensions: createExtensions(),
        });

        const view = new EditorView({
            state,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
        // Only create editor once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync external value changes
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;

        const currentValue = view.state.doc.toString();
        if (currentValue !== value) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: currentValue.length,
                    insert: value,
                },
            });
        }
    }, [value]);

    return (
        <div
            ref={editorRef}
            className={`overflow-hidden rounded-md border ${className}`}
        />
    );
}
