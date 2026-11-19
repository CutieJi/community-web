import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: [
        'index.html',
        'about.html',
        'freedomwall.html',
        'connect.html',
        'contact.html',
        'login.html',
        'signup.html',
        'profile.html',
        'admin.html'
      ]
    }
  }
});
