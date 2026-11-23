<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('freedom_posts', function (Blueprint $table) {
            $table->id();
            $table->text('message');
            $table->string('status')->default('pending');
            $table->string('facebook_publish_status')->default('pending');
            $table->string('facebook_post_id')->nullable();
            $table->text('facebook_publish_error')->nullable();
            $table->timestamps();
        });

        Schema::create('discussion_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('url')->nullable();
            $table->string('category')->default('COMMUNITY PICK');
            $table->boolean('published')->default(false);
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('url')->nullable();
            $table->boolean('published')->default(false);
            $table->timestamps();
        });

        Schema::create('promotion_requests', function (Blueprint $table) {
            $table->id();
            $table->string('brand');
            $table->text('description');
            $table->string('url');
            $table->string('contact_email');
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotion_requests');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('discussion_messages');
        Schema::dropIfExists('freedom_posts');
    }
};
