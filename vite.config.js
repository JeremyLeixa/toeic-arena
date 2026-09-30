import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Le CSS part tel qu'il est écrit (2026-09-30). Jusque-là injecté en <style>{CSS}</style>, il
    // n'était jamais minifié ; devenu fichier (CSP style-src 'self'), le minifieur le RÉÉCRIVAIT
    // selon la cible : `@media (max-width:480px)` → `@media (width <= 480px)`, syntaxe ignorée
    // avant Safari 16.4 (règle perdue en silence sur les vieux iPhone). Rien de perdu : ce CSS était déjà servi non minifié, dans le bundle JS.
    cssMinify: false,
  },
})
