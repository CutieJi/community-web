@extends('layouts.app')
@section('title', 'Promote — Navi Co.')
@section('content')
<section class="page-hero section-wrap"><div class="eyebrow"><span class="eyebrow-line"></span> COMMUNITY SPOTLIGHT</div><h1>Put your <span>brand in the room.</span></h1></section>
<section class="section-wrap"><form method="POST" action="{{ route('promotion-request.store') }}">
@csrf
<label>Brand or creator name<input name="brand" maxlength="120" value="{{ old('brand') }}" required></label>
<label>A short intro<textarea name="description" maxlength="500" required>{{ old('description') }}</textarea></label>
<label>Website or social link<input name="url" type="url" value="{{ old('url') }}" required></label>
<label>Contact email<input name="email" type="email" value="{{ old('email') }}" required></label>
<button class="button button-accent" type="submit">Submit request <span>↗</span></button>
</form>
@if(session('success'))<div class="form-message is-visible">{{ session('success') }}</div>@endif
@if($errors->any())<div class="form-message is-error is-visible">{{ $errors->first() }}</div>@endif
</section>
@endsection
