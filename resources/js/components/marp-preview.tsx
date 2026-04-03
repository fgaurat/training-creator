import { useMemo } from 'react';

interface MarpPreviewProps {
    content: string;
    className?: string;
}

function parseMarpSlides(content: string): string[] {
    // Remove frontmatter
    let body = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
    // Split on slide separators (--- on its own line)
    return body.split(/\n---\s*\n/).filter((s) => s.trim());
}

function markdownToHtml(md: string): string {
    let html = md;

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
        return `<pre><code class="language-${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    });

    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ol">$1</li>');
    html = html.replace(/((?:<li class="ol">.*<\/li>\n?)+)/g, '<ol>$1</ol>');
    html = html.replace(/ class="ol"/g, '');

    // Unordered lists (- and *)
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, (match) => {
        // Don't wrap if already inside <ol>
        if (match.includes('class="ol"')) return match;
        return `<ul>${match}</ul>`;
    });

    // Tables
    html = html.replace(
        /^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm,
        (_match, header, rows) => {
            const ths = header
                .split('|')
                .map((h: string) => h.trim())
                .filter(Boolean)
                .map((h: string) => `<th>${h}</th>`)
                .join('');
            const trs = rows
                .trim()
                .split('\n')
                .map((row: string) => {
                    const tds = row
                        .split('|')
                        .map((c: string) => c.trim())
                        .filter(Boolean)
                        .map((c: string) => `<td>${c}</td>`)
                        .join('');
                    return `<tr>${tds}</tr>`;
                })
                .join('');
            return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
        },
    );

    // Paragraphs (lines not already wrapped)
    html = html
        .split('\n\n')
        .map((block) => {
            const trimmed = block.trim();
            if (
                !trimmed ||
                trimmed.startsWith('<h') ||
                trimmed.startsWith('<ul') ||
                trimmed.startsWith('<ol') ||
                trimmed.startsWith('<pre') ||
                trimmed.startsWith('<blockquote') ||
                trimmed.startsWith('<table') ||
                trimmed.startsWith('<div')
            ) {
                return trimmed;
            }
            return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
        })
        .join('\n');

    // Strip HTML comments (Marp notes)
    html = html.replace(/<!--[\s\S]*?-->/g, '');

    return html;
}

export function MarpPreview({ content, className = '' }: MarpPreviewProps) {
    const slides = useMemo(() => parseMarpSlides(content), [content]);

    if (!content.trim()) {
        return (
            <div className={`flex items-center justify-center text-muted-foreground ${className}`}>
                Aucun contenu à prévisualiser
            </div>
        );
    }

    return (
        <div className={`overflow-auto space-y-4 p-4 ${className}`}>
            {slides.map((slide, i) => (
                <div
                    key={i}
                    className="relative rounded-lg border bg-white dark:bg-gray-900 shadow-sm aspect-video max-h-80 flex flex-col"
                >
                    <div className="absolute top-2 right-2 z-10 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {i + 1}/{slides.length}
                    </div>
                    <div
                        className="p-5 overflow-auto flex-1 prose prose-sm dark:prose-invert max-w-none
                            [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-0
                            [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h2]:mt-0
                            [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mb-1.5 [&_h3]:mt-0
                            [&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-800 [&_pre]:p-2 [&_pre]:rounded-md [&_pre]:text-[11px] [&_pre]:overflow-x-auto [&_pre]:my-1.5
                            [&_code]:bg-gray-100 [&_code]:dark:bg-gray-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px]
                            [&_pre_code]:bg-transparent [&_pre_code]:p-0
                            [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:px-1.5 [&_th]:py-0.5 [&_th]:bg-gray-50 [&_th]:dark:bg-gray-800 [&_th]:text-left [&_th]:text-[11px]
                            [&_td]:border [&_td]:px-1.5 [&_td]:py-0.5 [&_td]:text-[11px]
                            [&_blockquote]:border-l-3 [&_blockquote]:border-primary [&_blockquote]:pl-2 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:text-xs [&_blockquote]:my-1.5
                            [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_li]:text-xs [&_li]:my-0
                            [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1
                            [&_p]:text-xs [&_p]:mb-1.5 [&_p]:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(slide) }}
                    />
                </div>
            ))}
        </div>
    );
}
