import { RedirectIfAuthenticated } from '@/components/auth/redirect-if-authenticated';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
        {/* Animated SVG Background */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/ProjectFlow_AnimatedBG.svg"
            alt="Background"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full px-4">
          {children}
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
}
