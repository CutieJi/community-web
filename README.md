# Navi Co. community website

A Laravel 12 MVC implementation of the Navi Co. community site.

## Run locally

1. Install PHP 8.2+ and Composer.
2. Run `composer install`.
3. Copy `.env.example` to `.env` if you do not already have one.
4. Start MySQL in the XAMPP Control Panel. In phpMyAdmin, create a database named `navi_co` with `utf8mb4_unicode_ci` collation.
5. Set the MySQL connection in `.env` (`DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=navi_co`, and your MySQL username/password).
6. Run `php artisan key:generate` only if `APP_KEY` is empty, then run `php artisan migrate`.
7. Run `npm install` and `npm run build`.
8. Start the app with `php artisan serve`.

## Main pages

- `/` — home
- `/freedomwall.html` — anonymous Freedom Wall
- `/connect.html` — authenticated community chat
- `/contact.html` — promotion requests
- `/profile.html` — member account settings
- `/admin.html` — admin moderation dashboard

Create the first admin account through Laravel Tinker:

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
