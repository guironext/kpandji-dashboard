export {}

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role: string, 
            onboardingCompleted: boolean, 
            userId: string, 
            pendingValidation?: boolean,
            disabled?: boolean,
            invitationRejected?: boolean,
            invitedRole?: string,
        }
    }
}