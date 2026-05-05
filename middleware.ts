import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
	"/",
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/api/webhooks/(.*)",
	"/api/numero-chassis",
	"/api/dev-bypass",
	"/api/health",
	"/api/ping",
	"/api/reservation-vehicule",
	// Auto-inscription des participants via QR code (accessible sans compte)
	"/participer/(.*)",
	"/api/public/(.*)",
]);
// Skip middleware for prospects API - uses userId from body, avoids fetch issues
const isProspectsApi = createRouteMatcher(["/api/prospects/(.*)"]);
const isSavApi = createRouteMatcher(["/api/sav/(.*)"]);
const isRendezVousApi = createRouteMatcher(["/api/rendez-vous(.*)"]);
const isRapportRendezVousApi = createRouteMatcher(["/api/rapport-rendez-vous(.*)"]);
const isFactureApi = createRouteMatcher(["/api/facture(.*)"]);
const isReservationVehiculeApi = createRouteMatcher(["/api/reservation-vehicule(.*)"]);
const isDocumentationDownloadApi = createRouteMatcher(["/api/documentation(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);

const isAdminRoute = createRouteMatcher(["/admin", "/admin/(.*)"]);
const isEmployeeRoute = createRouteMatcher(["/employee", "/employee/(.*)"]);
const isManagerRoute = createRouteMatcher(["/manager", "/manager/(.*)"]);
const isJuristeRoute = createRouteMatcher(["/juriste", "/juriste/(.*)"]);
const isMagasinierRoute = createRouteMatcher([
	"/magasinier",
	"/magasinier/(.*)",
]);
const isChefusineRoute = createRouteMatcher(["/chefusine", "/chefusine/(.*)"]);
const isChefequipeRoute = createRouteMatcher([
	"/chefequipe",
	"/chefequipe/(.*)",
]);
const isChefqualiteRoute = createRouteMatcher([
	"/chefqualite",
	"/chefqualite/(.*)",
]);
const isCommercialRoute = createRouteMatcher([
	"/commercial",
	"/commercial/(.*)",
]);
const isResponsablecommercialRoute = createRouteMatcher([
	"/responsablecommercial",
	"/responsablecommercial/(.*)",
]);
const isRhRoute = createRouteMatcher(["/rh", "/rh/(.*)"]);
const isSavRoute = createRouteMatcher(["/sav", "/sav/(.*)"]);
const isLogistiqueRoute = createRouteMatcher([
	"/logistique",
	"/logistique/(.*)",
]);
const isFinanceRoute = createRouteMatcher(["/finance", "/finance/(.*)"]);
const isDirecteurGeneralRoute = createRouteMatcher([
	"/directeurgeneral",
	"/directeurgeneral/(.*)",
]);
const isClienteleRoute = createRouteMatcher([
	"/clientele",
	"/clientele/(.*)",
]);
const isComptableRoute = createRouteMatcher(["/comptable", "/comptable/(.*)"]);
const isConcessionnaireRoute = createRouteMatcher([
	"/concessionnaire",
	"/concessionnaire/(.*)",
]);
const isSuperviseurRoute = createRouteMatcher([
	"/superviseur",
	"/superviseur/(.*)",
]);
const isCommunicationRoute = createRouteMatcher([
	"/communication",
	"/communication/(.*)",
]);
const isInfographieRoute = createRouteMatcher([
	"/infographie",
	"/infographie/(.*)",
]);
const isCommunityManagerRoute = createRouteMatcher([
	"/communityManager",
	"/communityManager/(.*)",
]);
const isAssistanteRoute = createRouteMatcher([
	"/assistante",
	"/assistante/(.*)",
]);

const ROLE_REDIRECTS: Record<string, string> = {
	ADMIN: "/admin",
	EMPLOYEE: "/employee",
	MANAGER: "/manager",
	MAGASINIER: "/magasinier",
	CHEFUSINE: "/chefusine",
	JURISTE: "/juriste",
	CHEFEQUIPE: "/chefequipe",
	CHEFQUALITE: "/chefqualite",
	COMMERCIAL: "/commercial",
	RESPONSABLE_COMMERCIAL: "/responsablecommercial",
	COMMUNICATION: "/communication",
	RH: "/rh",
	SAV: "/sav",
	LOGISTIQUE: "/logistique",
	FINANCE: "/finance",
	DIRECTEUR_GENERAL: "/directeurgeneral",
	CLIENTELLE: "/clientele",
	COMPTABLE: "/comptable",
	CONCESSIONAIRE: "/concessionnaire",
	SUPERVISEUR: "/superviseur",
	INFORGRAPHIE: "/infographie",
	COMMUNITY_MANAGER: "/communityManager",
	ASSISTANTE: "/assistante",
};

function getRedirectForRole(role: string | undefined): string | null {
	return (role && ROLE_REDIRECTS[role]) ?? null;
}

type RouteMatcher = (req: NextRequest) => boolean;
const ROLE_ROUTES: Array<{ match: RouteMatcher; role: string }> = [
	{ match: isAdminRoute, role: "ADMIN" },
	{ match: isEmployeeRoute, role: "EMPLOYEE" },
	{ match: isManagerRoute, role: "MANAGER" },
	{ match: isChefusineRoute, role: "CHEFUSINE" },
	{ match: isJuristeRoute, role: "JURISTE" },
	{ match: isChefequipeRoute, role: "CHEFEQUIPE" },
	{ match: isMagasinierRoute, role: "MAGASINIER" },
	{ match: isChefqualiteRoute, role: "CHEFQUALITE" },
	{ match: isCommercialRoute, role: "COMMERCIAL" },
	{ match: isResponsablecommercialRoute, role: "RESPONSABLE_COMMERCIAL" },
	{ match: isCommunicationRoute, role: "COMMUNICATION" },
	{ match: isRhRoute, role: "RH" },
	{ match: isSavRoute, role: "SAV" },
	{ match: isLogistiqueRoute, role: "LOGISTIQUE" },
	{ match: isFinanceRoute, role: "FINANCE" },
	{ match: isDirecteurGeneralRoute, role: "DIRECTEUR_GENERAL" },
	{ match: isClienteleRoute, role: "CLIENTELLE" },
	{ match: isComptableRoute, role: "COMPTABLE" },
	{ match: isConcessionnaireRoute, role: "CONCESSIONAIRE" },
	{ match: isSuperviseurRoute, role: "SUPERVISEUR" },
	{ match: isInfographieRoute, role: "INFORGRAPHIE" },
	{ match: isCommunityManagerRoute, role: "COMMUNITY_MANAGER" },
	{ match: isAssistanteRoute, role: "ASSISTANTE" },
];

const clerkHandler = clerkMiddleware(async (auth, req: NextRequest) => {
	const { userId, sessionClaims, redirectToSignIn } = await auth();

	// Handle root path redirects based on role and onboarding status
	if (
		userId &&
		req.nextUrl.pathname === "/" &&
		!sessionClaims?.metadata?.onboardingCompleted
	) {
		const onboardingUrl = new URL("/onboarding", req.url);
		return NextResponse.redirect(onboardingUrl);
	}

	if (
		userId &&
		req.nextUrl.pathname === "/" &&
		sessionClaims?.metadata?.onboardingCompleted
	) {
		const redirectUrl = getRedirectForRole(sessionClaims?.metadata?.role);
		if (redirectUrl) {
			return NextResponse.redirect(new URL(redirectUrl, req.url));
		}
		return NextResponse.next();
	}

	if (isPublicRoute(req)) return NextResponse.next();
	if (isProspectsApi(req)) return NextResponse.next();
	if (isSavApi(req)) return NextResponse.next();
	if (isRendezVousApi(req)) return NextResponse.next();
	if (isRapportRendezVousApi(req)) return NextResponse.next();
	if (isFactureApi(req)) return NextResponse.next();
	if (isReservationVehiculeApi(req)) return NextResponse.next();
	if (isDocumentationDownloadApi(req)) return NextResponse.next();
	if (isAssistanteRoute(req)) return NextResponse.next();

	if (!userId && !isPublicRoute(req)) {
		return redirectToSignIn({
			returnBackUrl: req.url,
		});
	}

	// Handle onboarding route redirects for completed users
	if (
		userId &&
		sessionClaims?.metadata?.onboardingCompleted &&
		isOnboardingRoute(req)
	) {
		const redirectUrl = getRedirectForRole(sessionClaims?.metadata?.role);
		if (redirectUrl) {
			return NextResponse.redirect(new URL(redirectUrl, req.url));
		}
		return NextResponse.next();
	}

	// Handle onboarding completion via query parameter
	if (userId && isOnboardingRoute(req)) {
		if (req.nextUrl.searchParams.get("onboardingCompleted")) {
			const redirectUrl = getRedirectForRole(sessionClaims?.metadata?.role);
			if (redirectUrl) {
				return NextResponse.redirect(new URL(redirectUrl, req.url));
			}
		}
		return NextResponse.next();
	}

	// Redirect users without completed onboarding
	if (
		userId &&
		!sessionClaims?.metadata?.onboardingCompleted &&
		!isOnboardingRoute(req)
	) {
		const onboardingUrl = new URL("/onboarding", req.url);
		return NextResponse.redirect(onboardingUrl);
	}

	// Role-based route protection
	for (const { match, role } of ROLE_ROUTES) {
		if (match(req)) {
			if (sessionClaims?.metadata?.role === role) {
				return NextResponse.next();
			}
			return NextResponse.redirect(new URL("/", req.url));
		}
	}

	return NextResponse.next();
});

// Minimal Clerk handler for server actions: runs Clerk so auth() works, but no redirects
const serverActionClerkHandler = clerkMiddleware(() => NextResponse.next());

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
	// Server actions: run Clerk (no redirects) so auth() works in server actions
	if (req.headers.get("Next-Action")) {
		return serverActionClerkHandler(req, event);
	}
	// Dev bypass: skip auth when Clerk fails to load (ad-blocker, etc.)
	if (
		process.env.NODE_ENV === "development" &&
		req.cookies.get("__clerk_dev_bypass")?.value === "1"
	) {
		return NextResponse.next();
	}
	return clerkHandler(req, event);
}

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|pdf|docx?|pptx?|odt|ods|rtf|txt|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
