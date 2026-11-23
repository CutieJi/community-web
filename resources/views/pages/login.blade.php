@extends('layouts.app')
@section('title', 'Log in — Navi Co.')
@section('content')
<section class="auth-page-main"><div class="auth-card">
    <h1>Come on in.</h1><p class="auth-intro">Sign in to find your people.</p>
    @if($errors->any())<div class="form-message is-error is-visible">{{ $errors->first() }}</div>@endif
    <form method="POST" action="{{ route('login') }}">
        @csrf
        <label>Email address<input name="email" type="email" value="{{ old('email') }}" required></label>
        <label>Password<input name="password" type="password" required></label>
        <label class="checkbox-label"><input type="checkbox" name="remember"> Remember me</label>
        <button class="button button-accent auth-submit" type="submit">Log in <span>↗</span></button>
    </form>
    <p class="auth-switch">New around here? <a href="{{ route('register') }}">Create an account</a></p>
</div></section>
@endsection
