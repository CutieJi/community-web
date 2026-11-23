@extends('layouts.app')
@section('title', 'Freedom Wall — Navi Co.')
@section('content')
<section class="page-hero section-wrap"><div class="eyebrow"><span class="eyebrow-line"></span> NO NAME. NO PRESSURE.</div><h1>Say what's <span>on your mind.</span></h1></section>
<section class="section-wrap"><form method="POST" action="{{ route('freedom-wall.store') }}" class="wall-form">@csrf
    <textarea name="message" maxlength="500" required placeholder="Type it out...">{{ old('message') }}</textarea>
    <button class="button button-dark" type="submit">Send anonymously <span>↗</span></button>
</form>
@if(session('success'))<div class="form-message is-visible">{{ session('success') }}</div>@endif
<div class="wall-posts"><div id="wall-list">
@forelse($posts as $post)<article class="wall-note"><span class="note-mark">“</span><p>{{ $post->message }}</p><span class="note-tag">FROM THE COMMUNITY</span></article>@empty
<div class="empty-note">Nothing on the wall yet.</div>@endforelse
</div></div></section>
@endsection
