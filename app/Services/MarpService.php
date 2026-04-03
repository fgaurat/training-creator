<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;

class MarpService
{
    protected string $marpBin;

    public function __construct()
    {
        $this->marpBin = base_path('node_modules/.bin/marp');
    }

    public function toPptx(string $markdownContent): string
    {
        $tmpDir = storage_path('app/temp');
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }

        $id = Str::uuid();
        $mdPath = "{$tmpDir}/{$id}.md";
        $pptxPath = "{$tmpDir}/{$id}.pptx";

        file_put_contents($mdPath, $markdownContent);

        $result = Process::timeout(60)->run([
            $this->marpBin,
            $mdPath,
            '--pptx',
            '-o', $pptxPath,
            '--allow-local-files',
        ]);

        Log::info('Marp: conversion', [
            'exit_code' => $result->exitCode(),
            'output' => $result->output(),
            'error' => $result->errorOutput(),
        ]);

        // Cleanup markdown
        @unlink($mdPath);

        if ($result->exitCode() !== 0 || !file_exists($pptxPath)) {
            throw new \RuntimeException('Marp conversion failed: ' . $result->errorOutput());
        }

        return $pptxPath;
    }
}
