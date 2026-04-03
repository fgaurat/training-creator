<?php

namespace App\Services;

use App\Models\User;
use Google\Client as GoogleClient;
use Google\Service\Slides;
use Google\Service\Slides\Presentation;
use Google\Service\Slides\Request as SlidesRequest;
use Google\Service\Slides\BatchUpdatePresentationRequest;
use Illuminate\Support\Facades\Log;

class GoogleSlidesService
{
    protected GoogleClient $client;
    protected Slides $slidesService;

    public function __construct()
    {
        $this->client = new GoogleClient();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
    }

    public function authenticateAs(User $user): self
    {
        $this->client->setAccessToken($user->google_token);

        if ($this->client->isAccessTokenExpired() && $user->google_refresh_token) {
            $newToken = $this->client->fetchAccessTokenWithRefreshToken($user->google_refresh_token);
            $user->update([
                'google_token' => $newToken['access_token'],
                'google_token_expires_at' => now()->addSeconds($newToken['expires_in']),
            ]);
        }

        $this->slidesService = new Slides($this->client);

        return $this;
    }

    public function createPresentation(string $title, array $slides): array
    {
        // Create empty presentation
        $presentation = new Presentation(['title' => $title]);
        $presentation = $this->slidesService->presentations->create($presentation);

        $presentationId = $presentation->getPresentationId();

        // Remove the default blank slide
        $defaultSlideId = $presentation->getSlides()[0]->getObjectId();

        $requests = [];

        // Create all slides first
        $slideIds = [];
        foreach ($slides as $i => $slide) {
            $slideId = 'slide_' . $i;
            $slideIds[] = $slideId;

            $layout = $i === 0 ? 'TITLE' : 'TITLE_AND_BODY';

            $requests[] = new SlidesRequest([
                'createSlide' => [
                    'objectId' => $slideId,
                    'insertionIndex' => $i + 1,
                    'slideLayoutReference' => [
                        'predefinedLayout' => $layout,
                    ],
                ],
            ]);
        }

        // Delete the default slide
        $requests[] = new SlidesRequest([
            'deleteObject' => ['objectId' => $defaultSlideId],
        ]);

        // Execute slide creation
        $this->batchUpdate($presentationId, $requests);

        // Now get the presentation to find placeholder IDs
        $presentation = $this->slidesService->presentations->get($presentationId);

        // Fill each slide with content
        foreach ($presentation->getSlides() as $i => $slideObj) {
            if (!isset($slides[$i])) continue;

            $slideData = $slides[$i];
            $requests = [];

            $placeholders = $slideObj->getPageElements();
            $titleId = null;
            $bodyId = null;

            foreach ($placeholders as $element) {
                $shape = $element->getShape();
                if (!$shape || !$shape->getPlaceholder()) continue;

                $type = $shape->getPlaceholder()->getType();
                if ($type === 'TITLE' || $type === 'CENTER_TITLE') {
                    $titleId = $element->getObjectId();
                } elseif ($type === 'BODY' || $type === 'SUBTITLE') {
                    $bodyId = $element->getObjectId();
                }
            }

            // Insert title
            if ($titleId && !empty($slideData['title'])) {
                $requests[] = new SlidesRequest([
                    'insertText' => [
                        'objectId' => $titleId,
                        'text' => $slideData['title'],
                    ],
                ]);

                // Style the title
                $requests[] = new SlidesRequest([
                    'updateTextStyle' => [
                        'objectId' => $titleId,
                        'style' => [
                            'bold' => true,
                            'fontSize' => ['magnitude' => $i === 0 ? 30 : 24, 'unit' => 'PT'],
                        ],
                        'textRange' => ['type' => 'ALL'],
                        'fields' => 'bold,fontSize',
                    ],
                ]);
            }

            // Insert body content
            if ($bodyId && !empty($slideData['body'])) {
                $bodyText = $this->formatBodyText($slideData['body']);

                $requests[] = new SlidesRequest([
                    'insertText' => [
                        'objectId' => $bodyId,
                        'text' => $bodyText,
                    ],
                ]);

                // Style body text
                $requests[] = new SlidesRequest([
                    'updateTextStyle' => [
                        'objectId' => $bodyId,
                        'style' => [
                            'fontSize' => ['magnitude' => 14, 'unit' => 'PT'],
                        ],
                        'textRange' => ['type' => 'ALL'],
                        'fields' => 'fontSize',
                    ],
                ]);

                // Apply bold styling for lines that had **bold**
                $this->applyBoldRanges($requests, $bodyId, $bodyText);
            }

            if (!empty($requests)) {
                $this->batchUpdate($presentationId, $requests);
            }
        }

        $url = "https://docs.google.com/presentation/d/{$presentationId}/edit";

        Log::info('GoogleSlides: created presentation', [
            'id' => $presentationId,
            'title' => $title,
            'slides' => count($slides),
            'url' => $url,
        ]);

        return [
            'id' => $presentationId,
            'url' => $url,
        ];
    }

    /**
     * Parse Marp markdown into slide data arrays.
     */
    public function parseMarpToSlides(string $markdown): array
    {
        // Remove frontmatter
        $body = preg_replace('/^---\s*\n[\s\S]*?\n---\s*\n/', '', $markdown);

        // Split on slide separators
        $rawSlides = preg_split('/\n---\s*\n/', $body);

        $slides = [];
        foreach ($rawSlides as $raw) {
            $raw = trim($raw);
            if (empty($raw)) continue;

            // Strip HTML comments (presenter notes)
            $raw = preg_replace('/<!--[\s\S]*?-->/', '', $raw);

            $lines = explode("\n", $raw);
            $title = '';
            $bodyLines = [];

            foreach ($lines as $line) {
                if (empty($title) && preg_match('/^#{1,2}\s+(.+)$/', $line, $m)) {
                    $title = $this->cleanInlineMarkdown($m[1]);
                } else {
                    $bodyLines[] = $line;
                }
            }

            $body = $this->markdownToPlainText($bodyLines);

            $slides[] = [
                'title' => $title,
                'body' => $body,
            ];
        }

        return $slides;
    }

    /**
     * Convert markdown body lines to plain text suitable for Google Slides.
     */
    protected function markdownToPlainText(array $lines): string
    {
        $result = [];
        $inCodeBlock = false;

        foreach ($lines as $line) {
            // Code block toggle
            if (preg_match('/^```/', $line)) {
                $inCodeBlock = !$inCodeBlock;
                if ($inCodeBlock) {
                    // Start code block - nothing to add
                } else {
                    // End code block
                }
                continue;
            }

            if ($inCodeBlock) {
                $result[] = '    ' . $line;
                continue;
            }

            // Sub-headers → bold line
            if (preg_match('/^#{2,}\s+(.+)$/', $line, $m)) {
                $result[] = '**' . $this->cleanInlineMarkdown($m[1]) . '**';
                continue;
            }

            // Unordered list items
            if (preg_match('/^[-*]\s+(.+)$/', $line, $m)) {
                $result[] = '• ' . $this->cleanInlineMarkdown($m[1]);
                continue;
            }

            // Ordered list items
            if (preg_match('/^\d+\.\s+(.+)$/', $line, $m)) {
                $result[] = $this->cleanInlineMarkdown($line);
                continue;
            }

            // Blockquotes
            if (preg_match('/^>\s*(.+)$/', $line, $m)) {
                $result[] = '» ' . $this->cleanInlineMarkdown($m[1]);
                continue;
            }

            // Table rows - format as tab-separated
            if (preg_match('/^\|(.+)\|$/', $line)) {
                // Skip separator rows
                if (preg_match('/^\|[-| :]+\|$/', $line)) continue;

                $cells = array_map('trim', array_filter(explode('|', $line)));
                $result[] = implode('  |  ', $cells);
                continue;
            }

            // Skip HTML divs (column layouts) - extract inner text
            if (preg_match('/<div/', $line) || preg_match('/<\/div>/', $line)) {
                continue;
            }

            // Regular text
            $cleaned = $this->cleanInlineMarkdown($line);
            if (!empty(trim($cleaned))) {
                $result[] = $cleaned;
            }
        }

        return implode("\n", $result);
    }

    /**
     * Remove inline markdown formatting but track bold for later styling.
     */
    protected function cleanInlineMarkdown(string $text): string
    {
        // Keep **bold** markers - we'll apply them via API later
        // Remove inline code backticks
        $text = preg_replace('/`([^`]+)`/', '$1', $text);
        // Remove images
        $text = preg_replace('/!\[.*?\]\(.*?\)/', '', $text);
        // Remove links but keep text
        $text = preg_replace('/\[([^\]]+)\]\(.*?\)/', '$1', $text);
        // Remove italic markers (single *)
        $text = preg_replace('/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/', '$1', $text);

        return $text;
    }

    /**
     * Format body text: clean up double blank lines.
     */
    protected function formatBodyText(string $text): string
    {
        // Remove trailing/leading whitespace
        $text = trim($text);
        // Collapse 3+ newlines into 2
        $text = preg_replace('/\n{3,}/', "\n\n", $text);

        // Strip **bold** markers from the final text (they'll be applied via API)
        // Actually, we keep them for applyBoldRanges to find, then strip
        return $text;
    }

    /**
     * Find **bold** ranges in text and add styling requests.
     */
    protected function applyBoldRanges(array &$requests, string $objectId, string $text): void
    {
        // Find all **bold** patterns and their positions
        $offset = 0;
        $cleanText = '';
        $boldRanges = [];

        $parts = preg_split('/(\*\*[^*]+\*\*)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);

        foreach ($parts as $part) {
            if (preg_match('/^\*\*(.+)\*\*$/', $part, $m)) {
                $inner = $m[1];
                $boldRanges[] = [
                    'start' => strlen($cleanText),
                    'end' => strlen($cleanText) + strlen($inner),
                ];
                $cleanText .= $inner;
            } else {
                $cleanText .= $part;
            }
        }

        // If we have bold ranges, we need to first delete the text and reinsert without markers
        if (!empty($boldRanges)) {
            // Delete current text
            $requests[] = new SlidesRequest([
                'deleteText' => [
                    'objectId' => $objectId,
                    'textRange' => ['type' => 'ALL'],
                ],
            ]);

            // Reinsert clean text
            $requests[] = new SlidesRequest([
                'insertText' => [
                    'objectId' => $objectId,
                    'text' => $cleanText,
                ],
            ]);

            // Style body text again
            $requests[] = new SlidesRequest([
                'updateTextStyle' => [
                    'objectId' => $objectId,
                    'style' => [
                        'fontSize' => ['magnitude' => 14, 'unit' => 'PT'],
                    ],
                    'textRange' => ['type' => 'ALL'],
                    'fields' => 'fontSize',
                ],
            ]);

            // Apply bold to each range
            foreach ($boldRanges as $range) {
                $requests[] = new SlidesRequest([
                    'updateTextStyle' => [
                        'objectId' => $objectId,
                        'style' => ['bold' => true],
                        'textRange' => [
                            'type' => 'FIXED_RANGE',
                            'startIndex' => $range['start'],
                            'endIndex' => $range['end'],
                        ],
                        'fields' => 'bold',
                    ],
                ]);
            }
        }
    }

    protected function batchUpdate(string $presentationId, array $requests): void
    {
        $batchRequest = new BatchUpdatePresentationRequest(['requests' => $requests]);
        $this->slidesService->presentations->batchUpdate($presentationId, $batchRequest);
    }
}
