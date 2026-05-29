import PublicationsPageClient from "./PublicationsPageClient";


/** Data is loaded client-side with Clerk userId — server auth() is unreliable in this layout. */
export default function PublicationsPage() {
  return <PublicationsPageClient />;
}
