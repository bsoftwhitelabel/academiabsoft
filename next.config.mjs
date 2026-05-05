/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },

  // Keep heavy server-only packages out of the client bundle entirely.
  // @react-pdf/renderer (5+ MB) only runs in API routes; bcryptjs is server-only.
  // resend is also server-only (used inside server actions).
  serverComponentsExternalPackages: [
    "@react-pdf/renderer",
    "bcryptjs",
    "resend",
  ],

  experimental: {
    // Tree-shake big icon/util barrels — Next.js generates per-icon imports.
    // Cuts compile time and final bundle dramatically (lucide has 3900+ icons).
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
    ],

    // Keep client-side router cache fresher for snappier back/forward + repeat navigations.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
