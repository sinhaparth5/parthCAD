import { defineConfig, presetWebFonts } from 'unocss';
import { presetUno } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'DM Sans:400,700',
      }
    })
  ],
})