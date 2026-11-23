<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\FreedomPost;
use App\Models\Promotion;
use App\Models\PromotionRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function index()
    {
        return view('pages.admin', [
            'freedomPosts' => FreedomPost::latest()->get(),
            'requests' => PromotionRequest::latest()->get(),
            'promotions' => Promotion::latest()->get(),
            'announcements' => Announcement::latest()->get(),
            'users' => User::latest()->get(),
        ]);
    }

    public function moderateFreedomPost(Request $request, FreedomPost $post)
    {
        $validated = $request->validate(['status' => ['required', 'in:approved,rejected']]);
        $post->update(['status' => $validated['status']]);
        return back()->with('success', 'Freedom Wall post updated.');
    }

    public function deleteFreedomPost(FreedomPost $post)
    {
        $post->delete();
        return back()->with('success', 'Freedom Wall post deleted.');
    }

    public function approveRequest(PromotionRequest $request)
    {
        if ($request->status !== 'pending') {
            return back()->withErrors(['request' => 'Only pending requests can be approved.']);
        }
        DB::transaction(function () use ($request) {
            Promotion::create([
                'title' => $request->brand,
                'description' => $request->description,
                'url' => $request->url,
                'category' => 'COMMUNITY REQUEST',
                'published' => true,
            ]);
            $request->update(['status' => 'approved']);
        });
        return back()->with('success', 'Request approved and published.');
    }

    public function rejectRequest(PromotionRequest $request)
    {
        $request->update(['status' => 'rejected']);
        return back()->with('success', 'Request rejected.');
    }

    public function deleteRequest(PromotionRequest $request)
    {
        $request->delete();
        return back()->with('success', 'Request deleted.');
    }

    public function storeContent(Request $request)
    {
        $validated = $request->validate([
            'kind' => ['required', 'in:promotions,news'],
            'title' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:500'],
            'url' => ['nullable', 'url'],
            'published' => ['nullable', 'boolean'],
        ]);
        $model = $validated['kind'] === 'news' ? Announcement::class : Promotion::class;
        $model::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'url' => $validated['url'] ?? null,
            'published' => $request->boolean('published'),
        ]);
        return back()->with('success', 'Content saved.');
    }

    public function deleteContent(Request $request)
    {
        $validated = $request->validate([
            'kind' => ['required', 'in:promotions,news'],
            'id' => ['required', 'integer'],
        ]);
        $model = $validated['kind'] === 'news' ? Announcement::class : Promotion::class;
        $model::whereKey($validated['id'])->delete();
        return back()->with('success', 'Content deleted.');
    }

    public function updateMember(Request $request, User $user)
    {
        if ($user->role === 'admin') {
            return back()->withErrors(['member' => 'Admin accounts cannot be suspended.']);
        }
        $user->update(['suspended' => $request->boolean('suspended')]);
        return back()->with('success', 'Member access updated.');
    }
}
