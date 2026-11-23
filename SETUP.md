# Navi Co. Laravel setup (XAMPP)

## Requirements

- XAMPP with Apache and MySQL (MariaDB) installed
- PHP 8.2+ and Composer
- Node.js and npm for compiling frontend assets

The UI is a React SPA served by Laravel. Its API uses the same-origin Laravel session and CSRF protection.

## Configure MySQL

1. Start **MySQL** in the XAMPP Control Panel. Apache is only needed if you want to serve the app through XAMPP; Laravel's local development server works separately.
2. Open `http://localhost/phpmyadmin`.
3. Create a database named `navi_co` using the `utf8mb4_unicode_ci` collation.
4. In the project root, copy `.env.example` to `.env` if `.env` does not already exist. Set:

   ```dotenv
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=navi_co
   DB_USERNAME=root
   DB_PASSWORD=
   ```

   The defaults match a typical local XAMPP installation. If you have configured a MySQL password, set `DB_PASSWORD` to it. Do not overwrite an existing `APP_KEY` or share your `.env` file.

## Install and run

From the project directory:

```powershell
composer install
php artisan key:generate
php artisan migrate
npm install
npm run build
php artisan serve
```

Open the URL printed by `php artisan serve`, usually `http://127.0.0.1:8000`.

If PHP is not recognized in the terminal, run the commands using the PHP executable bundled with your XAMPP installation, for example `C:\xampp\php\php.exe artisan migrate`, or add `C:\xampp\php` to your Windows PATH.

## First admin

Register a normal account, then use Laravel Tinker to promote it:

```powershell
php artisan tinker
```

```php
App\Models\User::where('email', 'admin@example.com')->update(['role' => 'admin']);
```

Use the email address of the account you registered. Admin permissions are stored server-side and must not be assigned from a public form.
