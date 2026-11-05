<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;

class UserLanguageController extends Controller
{
    public function update(Request $request)
    {
        $request->validate([
            'language' => 'required|string|max:5'
        ]);

        $languageCode = $request->input('language');

        // RTL languages that should automatically set layoutDirection to 'right'
        $rtlLanguages = ['ar', 'he'];
        $isRtl = in_array($languageCode, $rtlLanguages);

        $dir = $isRtl ? 'right' : 'left';
        if (config('app.is_demo')) {
            return redirect()->back()
                ->cookie('layoutPosition', $dir, 60 * 24 * 365)
                ->cookie('app_language', $languageCode, 60 * 24 * 365);
        }

        $user = $request->user();

        if ($user) {
            $user->update(['lang' => $languageCode]);
            // Auto-update layoutDirection for RTL languages
            updateSetting('layoutDirection', $dir, $user->id, $user->current_store);
            return redirect()->back();
        }
        return back()->withErrors(['error' => 'Unauthorized']);
    }
}
