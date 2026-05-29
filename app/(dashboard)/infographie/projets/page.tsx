import InfographieProjetsClient from "./InfographieProjetsClient";

/** Data is loaded client-side with Clerk userId — server auth() is unreliable in this layout. */
export default function ProjetsPage() {
  return <InfographieProjetsClient />;
}
