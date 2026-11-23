@extends('layouts.app')
@section('title', 'Sign up — Navi Co.')
@section('content')
<section class="auth-page-main"><div class="auth-card">
    <h1>Create your account.</h1><p class="auth-intro">Your people are here.</p>
    @if($errors->any())<div class="form-message is-error is-visible">{{ $errors->first() }}</div>@endif
    <form method="POST" action="{{ route('register') }}">
        @csrf
        <label>Username<input name="username" minlength="2" maxlength="32" value="{{ old('username') }}" required></label>
        <label>Email address<input name="email" type="email" value="{{ old('email') }}" required></label>
        <label>Password<input name="password" type="password" minlength="8" required></label>
        <label>Confirm password<input name="password_confirmation" type="password" minlength="8" required></label>
        <button class="button button-accent auth-submit" type="submit">Create account <span>↗</span></button>
    </form>
    <p class="auth-switch">Already have an account? <a href="{{ route('login') }}">Log in</a></p>
</div></section>
@endsection
