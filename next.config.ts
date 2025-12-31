import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.chamberlininnovations.fr",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
