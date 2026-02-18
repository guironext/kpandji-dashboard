"use client";

import { SignInButton, useClerk } from "@clerk/nextjs";
import Link from "next/link";

export function SignInButtonWithFallback({
  children,
  href = "/sign-in",
  ...props
}: React.PropsWithChildren<Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> & { href?: string }>) {
  const { loaded } = useClerk();

  // When Clerk isn't loaded, use a plain link so the button still works
  if (!loaded) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <SignInButton mode="redirect" forceRedirectUrl="/">
      <span {...props}>{children}</span>
    </SignInButton>
  );
}
