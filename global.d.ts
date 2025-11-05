export {}

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role: string, 
            onboardingCompleted: boolean, 
            userId: string, 
        }
    }
}