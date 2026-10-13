<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function create()
    {
        return Inertia::render('Login');
    }

    public function store(Request $r)
    {
        $data = $r->validate(['email' => 'required|email', 'password' => 'required|string']);
        if (! Auth::attempt($data)) {
            throw ValidationException::withMessages(['email' => 'The email or password is incorrect.']);
        }
        $r->session()->regenerate();

        return redirect()->intended('/dashboard');
    }

    public function destroy(Request $r)
    {
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();

        return redirect('/login');
    }
}
