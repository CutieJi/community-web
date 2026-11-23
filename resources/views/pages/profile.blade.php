@extends('layouts.app')
@section('title', 'My account — Navi Co.')
@section('content')
<section class="profile-page section-wrap"><div class="profile-card">
<h1>{{ $user->username }}</h1><p>{{ $user->email }} · Member since {{ $user->created_at->format('M j, Y') }}</p>
@if(session('success'))<div class="form-message is-visible">{{ session('success') }}</div>@endif
<form method="POST" action="{{ route('profile.username') }}" class="profile-form">@csrf @method('PATCH')
<label>Username<input name="username" minlength="2" maxlength="32" value="{{ $user->username }}" required></label>
<button class="button button-accent" type="submit">Update username</button></form>
<form method="POST" action="{{ route('profile.password') }}" class="profile-form">@csrf @method('PATCH')
<label>New password<input name="password" type="password" minlength="8" required></label>
<label>Confirm password<input name="password_confirmation" type="password" minlength="8" required></label>
<button class="button button-dark" type="submit">Update password</button></form>
@if($user->role !== 'admin')
<form method="POST" action="{{ route('profile.destroy') }}" class="profile-form">@csrf @method('DELETE')
<label>Confirm with password<input name="password" type="password" required></label>
<button class="button button-danger" type="submit">Delete my account</button></form>
@endif
</div></section>
@endsection
