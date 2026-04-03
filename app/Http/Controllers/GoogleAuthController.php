<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/presentations',
            ])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();

        $request->user()->update([
            'google_token' => $googleUser->token,
            'google_refresh_token' => $googleUser->refreshToken,
            'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn),
        ]);

        return redirect()->intended('/trainings')
            ->with('status', 'Compte Google connecté !');
    }
}
