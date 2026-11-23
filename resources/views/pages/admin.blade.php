@extends('layouts.app')
@section('title', 'Admin — Navi Co.')
@section('content')
<section class="admin-main">
<div class="admin-welcome"><div><div class="eyebrow"><span class="eyebrow-line"></span> THE BACK OFFICE</div><h1>Hey, admin<span class="accent-period">.</span></h1></div></div>
@if(session('success'))<div class="form-message is-visible">{{ session('success') }}</div>@endif
@if($errors->any())<div class="form-message is-error is-visible">{{ $errors->first() }}</div>@endif

<div class="admin-panel"><div class="panel-heading"><h2>Freedom wall</h2></div><div class="admin-list">
@foreach($freedomPosts as $post)<article class="admin-row"><div class="admin-row-copy"><span class="admin-meta">{{ strtoupper($post->status) }}</span><p>{{ $post->message }}</p></div><div class="row-actions">
@if($post->status === 'pending')
<form method="POST" action="{{ route('admin.freedom.status', $post) }}">@csrf @method('PATCH')<input type="hidden" name="status" value="approved"><button class="button button-small button-accent">Approve</button></form>
<form method="POST" action="{{ route('admin.freedom.status', $post) }}">@csrf @method('PATCH')<input type="hidden" name="status" value="rejected"><button class="button button-small button-outline">Reject</button></form>
@endif
<form method="POST" action="{{ route('admin.freedom.delete', $post) }}">@csrf @method('DELETE')<button class="button button-small button-outline">Delete</button></form>
</div></article>@endforeach
</div></div>

<div class="admin-panel"><div class="panel-heading"><h2>Promotion requests</h2></div><div class="admin-list">
@foreach($requests as $request)<article class="admin-row"><div class="admin-row-copy"><span class="admin-meta">{{ strtoupper($request->status) }}</span><h3>{{ $request->brand }}</h3><p>{{ $request->description }}</p><p>{{ $request->contact_email }}</p></div><div class="row-actions">
@if($request->status === 'pending')
<form method="POST" action="{{ route('admin.request.approve', $request) }}">@csrf<button class="button button-small button-accent">Approve & publish</button></form>
<form method="POST" action="{{ route('admin.request.reject', $request) }}">@csrf<button class="button button-small button-outline">Reject</button></form>
@endif
<form method="POST" action="{{ route('admin.request.delete', $request) }}">@csrf @method('DELETE')<button class="button button-small button-outline">Delete</button></form>
</div></article>@endforeach
</div></div>

<div class="admin-panel"><div class="panel-heading"><h2>Promotions</h2></div><div class="admin-list">
@foreach($promotions as $promotion)<article class="admin-row"><div class="admin-row-copy"><h3>{{ $promotion->title }}</h3><p>{{ $promotion->description }}</p></div><div class="row-actions"><form method="POST" action="{{ route('admin.content.delete') }}">@csrf @method('DELETE')<input type="hidden" name="kind" value="promotions"><input type="hidden" name="id" value="{{ $promotion->id }}"><button class="button button-small button-outline">Delete</button></form></div></article>@endforeach
</div></div>

<div class="admin-panel"><div class="panel-heading"><h2>Announcements</h2></div><div class="admin-list">
@foreach($announcements as $announcement)<article class="admin-row"><div class="admin-row-copy"><h3>{{ $announcement->title }}</h3><p>{{ $announcement->description }}</p></div><div class="row-actions"><form method="POST" action="{{ route('admin.content.delete') }}">@csrf @method('DELETE')<input type="hidden" name="kind" value="news"><input type="hidden" name="id" value="{{ $announcement->id }}"><button class="button button-small button-outline">Delete</button></form></div></article>@endforeach
</div></div>

<div class="admin-panel"><div class="panel-heading"><h2>Members</h2></div><div class="admin-list">
@foreach($users as $user)<article class="admin-row"><div class="admin-row-copy"><h3>{{ $user->username }}</h3><p>{{ $user->email }}{{ $user->suspended ? ' · SUSPENDED' : '' }}{{ $user->role === 'admin' ? ' · ADMIN' : '' }}</p></div>
@if($user->role !== 'admin')<form method="POST" action="{{ route('admin.member.update', $user) }}">@csrf @method('PATCH')<input type="hidden" name="suspended" value="{{ $user->suspended ? 0 : 1 }}"><button class="button button-small button-outline">{{ $user->suspended ? 'Restore access' : 'Suspend access' }}</button></form>@endif
</article>@endforeach
</div></div>

<div class="admin-panel"><div class="panel-heading"><h2>Add content</h2></div><form method="POST" action="{{ route('admin.content.store') }}">@csrf
<label>Type<select name="kind"><option value="promotions">Promotion</option><option value="news">Announcement</option></select></label>
<label>Title<input name="title" maxlength="120" required></label>
<label>Description<textarea name="description" maxlength="500" required></textarea></label>
<label>Link<input name="url" type="url"></label>
<label class="checkbox-label"><input type="checkbox" name="published" value="1" checked> Visible</label>
<button class="button button-accent" type="submit">Save</button>
</form></div>
</section>
@endsection
