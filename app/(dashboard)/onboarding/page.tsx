//import OnboardingForm from '@/components/Onboarding';
import OnboardingForm from '@/components/Onboarding';
import { currentUser } from '@clerk/nextjs/server';
import Image from 'next/image';
import React from 'react'

const page = async () => {

  const user = await currentUser();

    if (!user) {
        return <div>Loading...</div>
    }
    
  
  return (
    <div className="flex flex-col gap-y-6 md:flex-row items-center justify-center min-h-screen bg-gradient-to-tl from-amber-700 via-orange-300 to-amber-800 m-6 sm:m-12 rounded-3xl shadow-lg p-8">
     <div className="w-full md:w-1/2 flex justify-center">
        <Image
          className="dark:invert"
          src="/logo.png"
          alt="KPANDJI logo"
          width={250}
          height={80}
          priority
        />
      </div>

      {/* Text & auth section */}
      <div className="w-full md:w-1/2 text-center flex flex-col items-center">
        <div className="container max-w-md mx-auto py-10">

        <OnboardingForm 
            userEmail={user.emailAddresses[0].emailAddress}
            firstName={user.firstName || ""}
            lastName={user.lastName || ""}
        />
    </div>
      </div>
    </div>
  )
}

export default page
