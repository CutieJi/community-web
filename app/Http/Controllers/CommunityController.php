<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\DiscussionMessage;
use App\Models\FreedomPost;
use App\Models\Promotion;
use App\Models\PromotionRequest;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function home()
    {
        return view('pages.home', [
            'promotions' => Promotion::where('published', true)->latest()->take(6)->get(),
        ]);
    }

    public function freedomWall()
    {
        return view('pages.freedom-wall', [
            'posts' => FreedomPost::where('status', 'approved')->latest()->take(6)->get(),
        ]);
    }

    public function submitFreedomPost(Request $request)
    {
        $validated = $request->validate(['message' => ['required', 'string', 'max:500']]);
        FreedomPost::create(['message' => trim($validated['message']), 'status' => 'pending']);
        return back()->with('success', 'Your anonymous message was submitted for review.');
    }

    public function contact()
    {
        return view('pages.contact');
    }

    public function submitPromotionRequest(Request $request)
    {
        $validated = $request->validate([
            'brand' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:500'],
            'url' => ['required', 'url', 'max:255'],
            'email' => ['required', 'email', 'max:254'],
        ]);
        PromotionRequest::create([
            'brand' => $validated['brand'],
            'description' => $validated['description'],
            'url' => $validated['url'],
            'contact_email' => $validated['email'],
        ]);
        return back()->with('success', 'Your promotion request was submitted.');
    }

    public function connect()
    {
        $messages = auth()->check()
            ? DiscussionMessage::with('user')->latest()->take(80)->get()->reverse()->values()
            : collect();
        $announcements = Announcement::where('published', true)->latest()->take(3)->get();
        return view('pages.connect', compact('messages', 'announcements'));
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate(['body' => ['required', 'string', 'max:1000']]);
        DiscussionMessage::create(['user_id' => $request->user()->id, 'body' => trim($validated['body'])]);
        return back();
    }
}
