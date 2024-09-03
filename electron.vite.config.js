import { defineConfig } from 'electron-vite'
import vitePluginPug from 'vite-plugin-pug-transformer'

import config from './config.js'

config.LCH = config.COLOR_FN !== '"oklch"'

export default defineConfig({
  // publicDir: false,
  main: {},
  preload: {},
  renderer: {
    build: {
      assetsDir: '.',
      rollupOptions: {
        output: {
          chunkFileNames: 'model-[hash].js'
        }
      }
    },
    define: config,
    plugins: [
      vitePluginPug({
        pugLocals: config
      })
    ]
  }
})

// import { defineConfig } from "electron-vite";
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//     publicDir: false,
//     main: {},
//     preload: {},
//     renderer: {
//         plugins: [react()]
//     }
// });
