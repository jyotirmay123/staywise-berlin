import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/staywise-berlin/',plugins:[react()],build:{outDir:'dist',emptyOutDir:true}});