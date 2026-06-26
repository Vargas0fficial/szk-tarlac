/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: false,

  // ETO ANG PINAKAMALAKAS NA TRIPWIRE PARA MAPILITAN SIYANG MAG-BUILD, GAR:
  staticPageGenerationTimeout: 1000,

  // Pinapatay nito ang strict routing safety triggers ng dynamic assets
  experimental: {
    workerThreads: false,
    cpus: 1
  }
};

export default nextConfig;