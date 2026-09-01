import RapportSavPublicClient from "./RapportSavPublicClient";

export const metadata = {
  title: "Rapport SAV — KPANDJI",
  description: "Téléchargement du rapport de maintenance SAV",
};

export default async function RapportSavPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <RapportSavPublicClient token={token} />;
}
