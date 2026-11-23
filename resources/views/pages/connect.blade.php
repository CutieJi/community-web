@extends('layouts.app')
@section('title', 'Connect — Navi Co.')
@section('content')
<section class="page-hero section-wrap"><div class="eyebrow"><span class="eyebrow-line"></span> YOUR PEOPLE ARE HERE</div><h1>Community <span>conversation.</span></h1></section>
<section class="section-wrap">
@auth
<div class="chat-panel"><div class="chat-messages">
@foreach($messages as $message)<div class="chat-row"><strong>{{ $message->user->username }}</strong><p>{{ $message->body }}</p></div>@endforeach
</div><form method="POST" action="{{ route('messages.store') }}" class="chat-compose">@csrf<input name="body" maxlength="1000" placeholder="Say something kind..." required><button class="button button-accent" type="submit">↗</button></form></div>
@else
<div class="chat-auth-prompt"><p>Sign in or create an account to join the conversation.</p><a class="button button-accent" href="{{ route('login') }}">Log in</a></div>
@endauth
</section>
@endsection
