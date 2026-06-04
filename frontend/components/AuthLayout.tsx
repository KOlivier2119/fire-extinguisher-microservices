import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop / tablet landscape */}
      <div className="relative hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-red-950 via-red-900 to-red-800 px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-400 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-yellow-400 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <Link href="/" className="mb-6 lg:mb-10">
            <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              TZW LTD <span className="text-orange-300">FEMS</span>
            </span>
          </Link>

          <div className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 mb-6 lg:mb-8">
            <Image
              src="/extinguisher.png"
              alt="Fire extinguisher illustration"
              fill
              priority
              className="object-contain drop-shadow-2xl"
            />
          </div>

          <p className="text-red-100 text-sm sm:text-base leading-relaxed max-w-xs lg:max-w-sm">
            Fire Extinguisher Management System — track inventory, schedule inspections, and stay compliant.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-svh items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:mb-8 text-center lg:text-left">
            <Link href="/" className="inline-flex lg:hidden items-center justify-center gap-2 mb-6">
              <span className="text-lg font-bold tracking-tight text-primary">
                TZW LTD <span className="text-orange-600">FEMS</span>
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
