/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is stable in Next.js 15
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/api/:path*'
      }
    ];
  }
};

export default nextConfig;
