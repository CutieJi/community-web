<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        return view('pages.profile', ['user' => $request->user()]);
    }

    public function updateUsername(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:2', 'max:32', 'unique:users,username,'.$request->user()->id],
        ]);
        $request->user()->update($validated);
        return back()->with('success', 'Username updated.');
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate(['password' => ['required', 'confirmed', Password::min(8)]]);
        $request->user()->update(['password' => Hash::make($validated['password'])]);
        return back()->with('success', 'Password updated.');
    }

    public function destroy(Request $request)
    {
        if ($request->user()->role === 'admin') {
            abort(403, 'Admin accounts cannot be deleted from this page.');
        }
        $request->validate(['password' => ['required', 'current_password']]);
        $user = $request->user();
        auth()->logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('home');
    }
}
