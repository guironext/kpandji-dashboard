import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/api/webhooks/(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);

const isAdminRoute = createRouteMatcher(["/admin", "/admin/(.*)"]);
const isEmployeeRoute = createRouteMatcher(["/employee", "/employee/(.*)"]);
const isManagerRoute = createRouteMatcher(["/manager", "/manager/(.*)"]);
const isMagasinierRoute = createRouteMatcher(["/magasinier", "/magasinier/(.*)"]);
const isChefusineRoute = createRouteMatcher(["/chefusine", "/chefusine/(.*)"]);
const isChefequipeRoute = createRouteMatcher(["/chefequipe", "/chefequipe/(.*)"]);
const isChefqualiteRoute = createRouteMatcher(["/chefqualite", "/chefqualite/(.*)"]);
const isCommercialRoute = createRouteMatcher(["/commercial", "/commercial/(.*)"]);
const isRhRoute = createRouteMatcher(["/rh", "/rh/(.*)"]);
const isSavRoute = createRouteMatcher(["/sav", "/sav/(.*)"]);
const isLogistiqueRoute = createRouteMatcher(["/logistique", "/logistique/(.*)"]);
const isFinanceRoute = createRouteMatcher(["/finance", "/finance/(.*)"]);
const isDirecteurGeneralRoute = createRouteMatcher(["/directeurgeneral", "/directeurgeneral/(.*)"]);
const isClientelleRoute = createRouteMatcher(["/clientelle", "/clientelle/(.*)"]);
const isComptableRoute = createRouteMatcher(["/comptable", "/comptable/(.*)"]);
const isConcessionnaireRoute = createRouteMatcher(["/concessionnaire", "/concessionnaire/(.*)"]);


export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  console.log(sessionClaims?.metadata);
  console.log(req.nextUrl.searchParams.get("onboardingCompleted"));

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
    const role = sessionClaims?.metadata?.role;
    let redirectUrl: string;

    switch (role) {
      case "ADMIN":
        redirectUrl = "/admin";
        break;
      case "EMPLOYEE":
        redirectUrl = "/employee";
        break;
      case "MANAGER":
        redirectUrl = "/manager";
        break;
      case "MAGASINIER":
        redirectUrl = "/magasinier";
        break;
      case "CHEFUSINE":
        redirectUrl = "/chefusine";
        break;
      case "CHEFEQUIPE":
        redirectUrl = "/chefequipe";
        break;
      case "CHEFQUALITE":
        redirectUrl = "/chefqualite";
        break;
      case "COMMERCIAL":
        redirectUrl = "/commercial";
        break;
      case "RH":
        redirectUrl = "/rh";
        break;
      case "SAV":
        redirectUrl = "/sav";
        break;
      case "LOGISTIQUE":
        redirectUrl = "/logistique";
        break;
      case "FINANCE":
        redirectUrl = "/finance";
        break;
      case "DIRECTEUR_GENERAL":
        redirectUrl = "/directeurgeneral";
        break;
      case "CLIENTELLE":
        redirectUrl = "/clientelle";
        break;
      case "COMPTABLE":
        redirectUrl = "/comptable";
        break;
      case "CONCESSIONAIRE":
        redirectUrl = "/concessionnaire";
        break;
      default:
        return NextResponse.next();
    }

    const targetUrl = new URL(redirectUrl, req.url);
    return NextResponse.redirect(targetUrl);
  }

  if (isPublicRoute(req)) return NextResponse.next();

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
    console.log("Onboarding completed, redirecting to appropriate page");

    const role = sessionClaims?.metadata?.role;
    let redirectUrl: string;

    switch (role) {
      case "ADMIN":
        redirectUrl = "/admin";
        break;
      case "EMPLOYEE":
        redirectUrl = "/employee";
        break;
      case "MANAGER":
        redirectUrl = "/manager";
        break;
      case "MAGASINIER":
        redirectUrl = "/magasinier";
        break;
      case "CHEFUSINE":
        redirectUrl = "/chefusine";
        break;
      case "CHEFEQUIPE":
        redirectUrl = "/chefequipe";
        break;
      case "CHEFQUALITE":
        redirectUrl = "/chefqualite";
        break;
      case "COMMERCIAL":
        redirectUrl = "/commercial";
        break;
      case "RH":
        redirectUrl = "/rh";
        break;
      case "SAV":
        redirectUrl = "/sav";
        break;
      case "LOGISTIQUE":
        redirectUrl = "/logistique";
        break;
      case "FINANCE":
        redirectUrl = "/finance";
        break;
      case "DIRECTEUR_GENERAL":
        redirectUrl = "/directeurgeneral";
        break;
      case "CLIENTELLE":
        redirectUrl = "/clientelle";
        break;
      case "COMPTABLE":
        redirectUrl = "/comptable";
        break;
      case "CONCESSIONAIRE":
        redirectUrl = "/concessionnaire";
        break;
      default:
        return NextResponse.next();
    }

    console.log(`Redirecting ${role.toLowerCase()} to ${redirectUrl} page`);
    const targetUrl = new URL(redirectUrl, req.url);
    return NextResponse.redirect(targetUrl);
  }

  // Handle onboarding completion via query parameter
  if (userId && isOnboardingRoute(req)) {
    if (req.nextUrl.searchParams.get("onboardingCompleted")) {
      console.log("Onboarding completed, redirecting to appropriate page");

      const role = sessionClaims?.metadata?.role;
      let redirectUrl: string;

      switch (role) {
        case "ADMIN":
          redirectUrl = "/admin";
          break;
        case "EMPLOYEE":
          redirectUrl = "/employee";
          break;
        case "MANAGER":
          redirectUrl = "/manager";
          break;
        case "MAGASINIER":
          redirectUrl = "/magasinier";
          break;
        case "CHEFUSINE":
          redirectUrl = "/chefusine";
          break;
        case "CHEFEQUIPE":
          redirectUrl = "/chefequipe";
          break;
        case "CHEFQUALITE":
          redirectUrl = "/chefqualite";
          break;
        case "COMMERCIAL":
          redirectUrl = "/commercial";
          break;
        case "RH":
          redirectUrl = "/rh";
          break;
        case "SAV":
          redirectUrl = "/sav";
          break;
        case "LOGISTIQUE":
          redirectUrl = "/logistique";
          break;
        case "FINANCE":
          redirectUrl = "/finance";
          break;
        case "DIRECTEUR_GENERAL":
          redirectUrl = "/directeurgeneral";
          break;
        case "CLIENTELLE":
          redirectUrl = "/clientelle";
          break;
        case "COMPTABLE":
          redirectUrl = "/comptable";
          break;
        case "CONCESSIONAIRE":
          redirectUrl = "/concessionnaire";
          break;
        default:
          return NextResponse.next();
      }

      const targetUrl = new URL(redirectUrl, req.url);
      return NextResponse.redirect(targetUrl);
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
  if (isAdminRoute(req)) {
    if (sessionClaims?.metadata?.role === "ADMIN") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isEmployeeRoute(req)) {
    if (sessionClaims?.metadata?.role === "EMPLOYEE") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isManagerRoute(req)) {
    if (sessionClaims?.metadata?.role === "MANAGER") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isChefusineRoute(req)) {
    if (sessionClaims?.metadata?.role === "CHEFUSINE") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isChefequipeRoute(req)) {
    if (sessionClaims?.metadata?.role === "CHEFEQUIPE") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isMagasinierRoute(req)) {
    if (sessionClaims?.metadata?.role === "MAGASINIER") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isChefqualiteRoute(req)) {
    if (sessionClaims?.metadata?.role === "CHEFQUALITE") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isCommercialRoute(req)) {
    if (sessionClaims?.metadata?.role === "COMMERCIAL") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isRhRoute(req)) {
    if (sessionClaims?.metadata?.role === "RH") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isSavRoute(req)) {
    if (sessionClaims?.metadata?.role === "SAV") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isLogistiqueRoute(req)) {
    if (sessionClaims?.metadata?.role === "LOGISTIQUE") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isFinanceRoute(req)) {
    if (sessionClaims?.metadata?.role === "FINANCE") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isDirecteurGeneralRoute(req)) {
    if (sessionClaims?.metadata?.role === "DIRECTEUR_GENERAL") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (isClientelleRoute(req)) {
    if (sessionClaims?.metadata?.role === "CLIENTELLE") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }
  if (isComptableRoute(req)) {
    if (sessionClaims?.metadata?.role === "COMPTABLE") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }
  if (isConcessionnaireRoute(req)) {
    if (sessionClaims?.metadata?.role === "CONCESSIONAIRE") {
      return NextResponse.next();
    } else {
      const homepageUrl = new URL("/", req.url);
      return NextResponse.redirect(homepageUrl);
    }
  }

  if (userId) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
