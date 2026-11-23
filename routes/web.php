<?php

use App\Http\Controllers\ReactApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    Route::get('/session', [ReactApiController::class, 'session']);
    Route::post('/login', [ReactApiController::class, 'login']);
    Route::post('/register', [ReactApiController::class, 'register']);
    Route::post('/logout', [ReactApiController::class, 'logout'])->middleware('auth');

    Route::get('/home', [ReactApiController::class, 'home']);
    Route::get('/freedom-wall', [ReactApiController::class, 'freedomWall']);
    Route::post('/freedom-wall', [ReactApiController::class, 'submitFreedomPost'])->middleware('throttle:10,1');
    Route::post('/promotion-requests', [ReactApiController::class, 'submitPromotionRequest'])->middleware('throttle:5,1');
    Route::get('/connect', [ReactApiController::class, 'connect'])->middleware('auth');
    Route::post('/connect/messages', [ReactApiController::class, 'sendMessage'])->middleware('auth');

    Route::middleware('auth')->group(function () {
        Route::get('/profile', [ReactApiController::class, 'profile']);
        Route::patch('/profile/username', [ReactApiController::class, 'updateUsername']);
        Route::patch('/profile/password', [ReactApiController::class, 'updatePassword']);
        Route::delete('/profile', [ReactApiController::class, 'deleteAccount']);
    });

    Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
        Route::get('/', [ReactApiController::class, 'admin']);
        Route::patch('/freedom-wall/{post}/status', [ReactApiController::class, 'moderateFreedomPost']);
        Route::delete('/freedom-wall/{post}', [ReactApiController::class, 'deleteFreedomPost']);
        Route::post('/promotion-requests/{promotionRequest}/approve', [ReactApiController::class, 'approveRequest']);
        Route::patch('/promotion-requests/{promotionRequest}', [ReactApiController::class, 'updateRequestStatus']);
        Route::delete('/promotion-requests/{promotionRequest}', [ReactApiController::class, 'deleteRequest']);
        Route::post('/content', [ReactApiController::class, 'storeContent']);
        Route::patch('/content/{kind}/{id}', [ReactApiController::class, 'updateContent']);
        Route::delete('/content/{kind}/{id}', [ReactApiController::class, 'deleteContent']);
        Route::patch('/users/{user}', [ReactApiController::class, 'updateMember']);
    });
});

Route::view('/', 'app')->name('home');
Route::view('/{path}', 'app')->where('path', '^(?!api/).*$');
