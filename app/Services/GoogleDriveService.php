<?php

namespace App\Services;

use App\Models\User;
use Google\Client as GoogleClient;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Illuminate\Support\Facades\Log;

class GoogleDriveService
{
    protected GoogleClient $client;

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

        return $this;
    }

    public function uploadPptx(string $filePath, string $fileName): DriveFile
    {
        $driveService = new Drive($this->client);

        $fileMetadata = new DriveFile([
            'name' => $fileName,
            'mimeType' => 'application/vnd.google-apps.presentation',
        ]);

        $content = file_get_contents($filePath);

        $file = $driveService->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'uploadType' => 'multipart',
            'fields' => 'id, name, webViewLink',
        ]);

        Log::info('GoogleDrive: uploaded PPTX', [
            'file_id' => $file->id,
            'name' => $file->name,
            'link' => $file->webViewLink,
        ]);

        return $file;
    }
}
