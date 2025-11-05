import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Main container with better contrast */}
        <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl border border-orange-200/50 shadow-2xl">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/30 to-yellow-100/30" />
          
          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Logo Section */}
              <div className="flex-1 flex justify-center lg:justify-start">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg">
                    <Image
                      src="/logo.png"
                      alt="KPANDJI Management Board Logo"
                      width={280}
                      height={90}
                      priority
                      className="drop-shadow-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 text-center lg:text-left space-y-6">
                {/* Main Heading */}
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                    <span className="bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
                      KPANDJI
                    </span>
                    <br />
                    <span className="text-gray-800">MANAGEMENT BOARD</span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-gray-700 max-w-md lg:max-w-lg leading-relaxed">
                    Bienvenue sur le tableau de bord de gestion de KPANDJI AUTOMOBILES.
                  </p>
                </div>

                {/* Authentication Section */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <SignedIn>
                    <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3 border border-orange-200">
                      <span className="text-orange-800 text-sm font-medium">Connecté</span>
                      <UserButton 
                        appearance={{
                          elements: {
                            avatarBox: "w-8 h-8"
                          }
                        }}
                      />
                    </div>
                  </SignedIn>

                  <SignedOut>
                    <Button 
                      asChild 
                      size="lg"
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold"
                    >
                      <SignInButton mode="modal">
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Se connecter
                        </span>
                      </SignInButton>
                    </Button>
                  </SignedOut>
                </div>

                {/* Additional Features Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 hover:bg-orange-100 transition-colors">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-orange-800 text-sm font-medium">Tableaux de bord</p>
                  </div>
                  
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 hover:bg-amber-100 transition-colors">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <p className="text-amber-800 text-sm font-medium">Gestion des projets</p>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 hover:bg-yellow-100 transition-colors">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-yellow-800 text-sm font-medium">Suivi en temps réel</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
