const SECTEUR_ACTIVITE_OPTIONS_RAW = [
	"Secteur Public",
	"Agro-Industrie",
	"Sécurité",
	"Santé",
	"Education",
	"Recherche",
	"Environnement",
	"Tourisme",
	"Hôtellerie",
	"Restauration",
	"Commerce",
	"Industrie",
	"Agriculture",
	"Artisanat",
	"Services",
	"Finance",
	"Culture",
	"Sport",
	"Technologie",
	"Autres",
	"Mines & Énergie",
	"Services & Finance",
	"BTP & Infrastructures",
	"Transport & Logistique",
	"Santé & Social",
	"Professions Libérales",
	"Hôtellerie de Luxe & Affaires",
	"Tourisme & Loisirs",
	"Grande Distribution",
	"Commerce de Détail & E-commerce",
	"Événementiel & Traiteurs",
] as const;

export type SecteurActivite = (typeof SECTEUR_ACTIVITE_OPTIONS_RAW)[number];

/** Unique secteur options (deduped) for selects and forms. */
export const SECTEUR_ACTIVITE_OPTIONS: SecteurActivite[] = [
	...new Set(SECTEUR_ACTIVITE_OPTIONS_RAW),
];
