# Mark all pending migrations as applied (database schema already exists)
# Run this when migrations fail because schema already exists (e.g. "already exists" errors)
$migrations = @(
  "20250916144758_etapes",
  "20251027141246_accessoires",
  "20250916153854_etape_sparepart",
  "20250916185802_decharge",
  "20250917114551_verication_status",
  "20250917163823_ranger",
  "20250922142007_client",
  "20251025001213_update_rapport_rendez_vous_fields",
  "20251025184013_chute_update",
  "20251025184644_table_reltion",
  "20251025190053_ajout_table_chute",
  "20251026082609_adding_chte_rendez_vous",
  "20251026170151_add_transmission_motorisation_to_facture_ligne",
  "20251027141246_accessoires",
  "20251027152323_add_accessoire_fields_to_facture",
  "20251027153133_make_accessoire_voitureid_optional",
  "20251027180512_accessoires",
  "20251027181834_add_accessoire_fields",
  "20251027205824_accessoire_reaction",
  "20251028124839_bon_commande",
  "20251030163741_client_activation",
  "20251030165625_client_entreprise_premiere",
  "20251031145945_add_bon_pour_acquis_column",
  "20251031155012_add_prefix_numero_to_bon_de_commande",
  "20251031162310_bon_pour_acquis",
  "20251103122755_add_accessoires_to_commande",
  "20251103125529_fournisseur_locaux",
  "20251103150656_fournisseurlocaux",
  "20251103153641_make_commande_locale_optional",
  "20251103161954_local_fournisseur",
  "20251103164601_remove_fournisseur_id_from_local",
  "20260102142137_add_charge_to_etape_commande"
)

foreach ($m in $migrations) {
  Write-Host "Resolving $m..."
  npx prisma migrate resolve --applied $m
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "`nDone. Run: npx prisma migrate deploy"
Write-Host "Or: npx prisma migrate status"
