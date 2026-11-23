# Navi Co. community website

A React SPA frontend backed by Laravel 12 JSON endpoints.

## Run locally

1. Install PHP 8.2+ and Composer.
2. Run `composer install`.
3. Copy `.env.example` to `.env` if you do not already have one.
4. Start MySQL in the XAMPP Control Panel. In phpMyAdmin, create a database named `navi_co` with `utf8mb4_unicode_ci` collation.
5. Set the MySQL connection in `.env` (`DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=navi_co`, and your MySQL username/password).
6. Run `php artisan key:generate` only if `APP_KEY` is empty, then run `php artisan migrate`.
7. Run `npm install` and `npm run build`.
8. Start the app with `php artisan serve`.

## React pages

- `/` — home
- `/about` — about Navi Co.
- `/freedomwall` — anonymous Freedom Wall
- `/connect` — authenticated community chat
- `/contact` — promotion requests
- `/profile` — member account settings
- `/admin` — admin moderation dashboard

The React app is in `resources/js/app.jsx`; Laravel serves a minimal Blade mount shell and the JSON API. Create the first admin account through Laravel Tinker:

```powershell
php artisan tinker
```

```php
$user = App\Models\User::create([
    'name' => 'Admin',
    'username' => 'admin',
    'email' => 'admin@example.com',
    'password' => Illuminate\Support\Facades\Hash::make('change-this-password'),
    'role' => 'admin',
]);
```

Use a strong unique password and change it before deployment.
