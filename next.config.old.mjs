import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@excalidraw/excalidraw'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const reactPath = path.resolve(__dirname, 'node_modules/react')
      const reactDomPath = path.resolve(__dirname, 'node_modules/react-dom')
      
      config.resolve.alias = {
        ...config.resolve.alias,
        'react': reactPath,
        'react-dom': reactDomPath,
        'react/jsx-runtime': path.join(reactPath, 'jsx-runtime'),
        'react/jsx-dev-runtime': path.join(reactPath, 'jsx-dev-runtime'),
      }
    }
    return config
  },
}

export default nextConfig