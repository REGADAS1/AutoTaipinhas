import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stock: resolve(__dirname, 'stock.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        location: resolve(__dirname, 'location.html'),
        carDetails: resolve(__dirname, 'car-details.html'),
        adminLogin: resolve(__dirname, 'painel-acesso-taipinhas.html'),
        adminDashboard: resolve(__dirname, 'painel-gestao-taipinhas.html')
      }
    }
  }
});