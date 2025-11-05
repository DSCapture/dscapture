import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const remotePatterns: RemotePattern[] =
  supabaseUrl && supabaseUrl.length > 0
    ? [
        {
          protocol: "https",
          hostname: new URL(supabaseUrl).hostname,
          pathname: "/storage/v1/object/public/**",
        },
      ]
    : [];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
