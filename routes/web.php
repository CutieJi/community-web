<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\ProfileController;

Route::get('/', [CommunityController::class, 'home'])->name('home');
Route::get('/about.html', fn () => view('pages.about'))->name('about');
Route::get('/freedomwall.html', [CommunityController::class, 'freedomWall'])->name('freedom-wall');
Route::post('/freedomwall.html', [CommunityController::class, 'submitFreedomPost'])->name('freedom-wall.store');
Route::get('/contact.html', [CommunityController::class, 'contact'])->name('contact');
Route::post('/promotion-requests', [CommunityController::class, 'submitPromotionRequest'])->name('promotion-request.store');
Route::get('/connect.html', [CommunityController::class, 'connect'])->name('connect');

Route::middleware('guest')->group(function () {
    Route::get('/login.html', fn () => view('pages.login'))->name('login');
    Route::post('/login.html', [AuthController::class, 'login']);
    Route::get('/signup.html', fn () => view('pages.signup'))->name('register');
    Route::post('/signup.html', [AuthController::class, 'register']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('/connect/messages', [CommunityController::class, 'sendMessage'])->name('messages.store');
    Route::get('/profile.html', [ProfileController::class, 'edit'])->name('profile');
    Route::patch('/profile/username', [ProfileController::class, 'updateUsername'])->name('profile.username');
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/admin.html', [AdminController::class, 'index'])->name('admin');
    Route::patch('/admin/freedom-wall/{post}/status', [AdminController::class, 'moderateFreedomPost'])->name('admin.freedom.status');
    Route::delete('/admin/freedom-wall/{post}', [AdminController::class, 'deleteFreedomPost'])->name('admin.freedom.delete');
    Route::post('/admin/promotion-requests/{request}/approve', [AdminController::class, 'approveRequest'])->name('admin.request.approve');
    Route::post('/admin/promotion-requests/{request}/reject', [AdminController::class, 'rejectRequest'])->name('admin.request.reject');
    Route::delete('/admin/promotion-requests/{request}', [AdminController::class, 'deleteRequest'])->name('admin.request.delete');
    Route::post('/admin/content', [AdminController::class, 'storeContent'])->name('admin.content.store');
    Route::delete('/admin/content', [AdminController::class, 'deleteContent'])->name('admin.content.delete');
    Route::patch('/admin/users/{user}', [AdminController::class, 'updateMember'])->name('admin.member.update');
});
