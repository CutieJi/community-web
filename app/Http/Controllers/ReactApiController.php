<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\DiscussionMessage;
use App\Models\FreedomPost;
use App\Models\Promotion;
use App\Models\PromotionRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ReactApiController extends Controller
{
    public function session(Request $request)
    {
        return response()->json(['user' => $this->userData($request->user())]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'The provided credentials are invalid.'], 422);
        }

        if ($request->user()->suspended) {
            Auth::logout();

            return response()->json(['message' => 'This account is suspended.'], 403);
        }

        $request->session()->regenerate();

        return response()->json(['user' => $this->userData($request->user())]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:2', 'max:32', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name' => $validated['username'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'member',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $this->userData($user)], 201);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    public function home()
    {
        return response()->json([
            'promotions' => Promotion::where('published', true)->latest()->take(6)->get(),
        ]);
    }

    public function freedomWall()
    {
        return response()->json([
            'posts' => FreedomPost::where('status', 'approved')->latest()->take(6)->get(),
        ]);
    }

    public function submitFreedomPost(Request $request)
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:500'],
        ]);

        $post = FreedomPost::create([
            'message' => trim($validated['message']),
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Your anonymous message was submitted for review.',
            'post' => $post,
        ], 201);
    }

    public function submitPromotionRequest(Request $request)
    {
        $validated = $request->validate([
            'brand' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:500'],
            'url' => ['required', 'url:http,https', 'max:255'],
            'email' => ['required', 'email', 'max:254'],
        ]);

        PromotionRequest::create([
            'brand' => $validated['brand'],
            'description' => $validated['description'],
            'url' => $validated['url'],
            'contact_email' => $validated['email'],
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Your promotion request was submitted.'], 201);
    }

    public function connect()
    {
        return response()->json([
            'messages' => DiscussionMessage::with('user:id,username')
                ->latest()->take(80)->get()->reverse()->values(),
            'announcements' => Announcement::where('published', true)->latest()->take(3)->get(),
        ]);
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        $message = DiscussionMessage::create([
            'user_id' => $request->user()->id,
            'body' => trim($validated['body']),
        ])->load('user:id,username');

        return response()->json(['message' => $message], 201);
    }

    public function profile(Request $request)
    {
        return response()->json(['user' => $this->userData($request->user())]);
    }

    public function updateUsername(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:2', 'max:32', 'unique:users,username,'.$request->user()->id],
        ]);

        $request->user()->update([
            'username' => $validated['username'],
            'name' => $validated['username'],
        ]);

        return response()->json([
            'message' => 'Username updated.',
            'user' => $this->userData($request->user()->fresh()),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $request->user()->update(['password' => Hash::make($validated['password'])]);

        return response()->json(['message' => 'Password updated.']);
    }

    public function deleteAccount(Request $request)
    {
        if ($request->user()->role === 'admin') {
            return response()->json(['message' => 'Admin accounts cannot be deleted from this page.'], 403);
        }

        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();
        Auth::logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Account deleted.']);
    }

    public function admin()
    {
        return response()->json([
            'freedomPosts' => FreedomPost::latest()->take(200)->get(),
            'requests' => PromotionRequest::latest()->take(200)->get(),
            'promotions' => Promotion::latest()->take(200)->get(),
            'announcements' => Announcement::latest()->take(200)->get(),
            'users' => User::select(['id', 'name', 'username', 'email', 'role', 'suspended', 'created_at'])
                ->latest()->take(200)->get(),
        ]);
    }

    public function moderateFreedomPost(Request $request, FreedomPost $post)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $post->update(['status' => $validated['status']]);

        return response()->json(['message' => 'Freedom Wall post updated.', 'post' => $post->fresh()]);
    }

    public function deleteFreedomPost(FreedomPost $post)
    {
        $post->delete();

        return response()->json(['message' => 'Freedom Wall post deleted.']);
    }

    public function approveRequest(PromotionRequest $promotionRequest)
    {
        $promotion = DB::transaction(function () use ($promotionRequest) {
            $request = PromotionRequest::whereKey($promotionRequest->id)->lockForUpdate()->firstOrFail();

            if ($request->status !== 'pending') {
                abort(409, 'Only pending requests can be approved.');
            }

            $promotion = Promotion::create([
                'title' => $request->brand,
                'description' => $request->description,
                'url' => $request->url,
                'category' => 'COMMUNITY REQUEST',
                'published' => true,
            ]);

            $request->update(['status' => 'approved']);

            return $promotion;
        });

        return response()->json(['message' => 'Request approved and published.', 'promotion' => $promotion], 201);
    }

    public function updateRequestStatus(Request $request, PromotionRequest $promotionRequest)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:rejected'],
        ]);

        $promotionRequest->update(['status' => $validated['status']]);

        return response()->json(['message' => 'Promotion request rejected.']);
    }

    public function deleteRequest(PromotionRequest $promotionRequest)
    {
        $promotionRequest->delete();

        return response()->json(['message' => 'Promotion request deleted.']);
    }

    public function storeContent(Request $request)
    {
        $validated = $request->validate([
            'kind' => ['required', 'in:promotions,news'],
            'title' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:500'],
            'url' => ['nullable', 'url:http,https', 'max:255'],
            'published' => ['boolean'],
        ]);

        $model = $validated['kind'] === 'news' ? Announcement::class : Promotion::class;
        $item = $model::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'url' => $validated['url'] ?? null,
            'published' => $request->boolean('published'),
        ]);

        return response()->json(['message' => 'Content saved.', 'item' => $item], 201);
    }

    public function updateContent(Request $request, string $kind, int $id)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:500'],
            'url' => ['nullable', 'url:http,https', 'max:255'],
            'published' => ['boolean'],
        ]);

        $model = $this->contentModel($kind);
        $item = $model::findOrFail($id);
        $item->update([
            ...$validated,
            'url' => $validated['url'] ?? null,
            'published' => $request->boolean('published'),
        ]);

        return response()->json(['message' => 'Content updated.', 'item' => $item->fresh()]);
    }

    public function deleteContent(string $kind, int $id)
    {
        $model = $this->contentModel($kind);
        $model::findOrFail($id)->delete();

        return response()->json(['message' => 'Content deleted.']);
    }

    public function updateMember(Request $request, User $user)
    {
        if ($user->role === 'admin' || $user->is($request->user())) {
            return response()->json(['message' => 'This account cannot be suspended.'], 403);
        }

        $validated = $request->validate([
            'suspended' => ['required', 'boolean'],
        ]);
        $user->update(['suspended' => $validated['suspended']]);

        return response()->json(['message' => 'Member access updated.']);
    }

    private function contentModel(string $kind): string
    {
        return match ($kind) {
            'promotions' => Promotion::class,
            'news' => Announcement::class,
            default => abort(404),
        };
    }

    private function userData(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => $user->created_at,
        ];
    }
}
