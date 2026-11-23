@extends('layouts.app')
@section('title', 'Navi Co. — Find your people.')
@section('body-page', 'home')
@section('content')
<section class="hero section-wrap">
    <div class="hero-copy">
        <div class="eyebrow"><span class="eyebrow-line"></span> YOUR PEOPLE. YOUR PLACE.</div>
        <h1>Find your<br>people<span class="accent-period">.</span><br><span class="outline-text">Make your</span><br>mark<span class="accent-period">.</span></h1>
        <p class="hero-description">A community built for the things you love. Share what you're making, say what's on your mind, and find your people along the way.</p>
        <div class="hero-actions"><a class="button button-accent button-large" href="{{ route('register') }}">Come on in <span>↗</span></a><a class="text-link" href="{{ route('about') }}">Get to know us <span>↗</span></a></div>
    </div>
    <div class="hero-art" aria-label="Community conversations">
        <div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div>
        <div class="art-center"><span class="sun-rays">✳</span><span class="art-word">NAVI<br><b>CO.</b></span><span class="art-caption">a place to be you</span></div>
    </div>
</section>
<section class="ticker"><div class="ticker-track"><span>GOOD VIBES ONLY</span><i>✳</i><span>MADE FOR THE COMMUNITY</span><i>✳</i><span>GOOD VIBES ONLY</span></div></section>
<section class="section-wrap promotions-section">
    <div class="section-label"><span>COMMUNITY PICKS</span><a class="text-link" href="{{ route('contact') }}">Promote your brand <span>↗</span></a></div>
    <div class="promo-grid">
        @forelse($promotions as $promotion)
            <article class="promo-card">
                <div class="promo-visual visual-community"><span>{{ $promotion->category }}</span><i>♡</i></div>
                <div class="promo-info"><div><span class="promo-type">{{ $promotion->category }}</span><h3>{{ $promotion->title }}</h3><p>{{ $promotion->description }}</p></div>
                @if($promotion->url)<a href="{{ $promotion->url }}" target="_blank" rel="noopener">↗</a>@endif</div>
            </article>
        @empty
            <article class="promo-card"><div class="promo-visual visual-community"><span>LOCAL LOVE CLUB</span><i>♡</i></div><div class="promo-info"><div><span class="promo-type">COMMUNITY PICK</span><h3>Good people, good finds.</h3></div></div></article>
        @endforelse
    </div>
</section>
@endsection
