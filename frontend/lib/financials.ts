/**
 * Chiffres extraits des rapports indexés et vérifiés par l'agent (sources : pages des rapports AMMC).
 * Seuls les chiffres réellement vérifiés figurent ici : les sociétés en cours d'indexation
 * renvoient vers l'agent au lieu d'afficher des valeurs inventées.
 */
export type Metric = { label: string; unit: string; values: Record<string, number>; source?: string };

export type Company = {
  slug: string;
  name: string;
  ticker: string;
  sector: string;
  hue: number; // couleur de l'aura de la fiche
  status: "indexed" | "indexing";
  reports: string[];
  income: Metric[];
  balance: Metric[];
};

export const COMPANIES: Company[] = [
  {
    slug: "maroc_telecom",
    name: "Maroc Telecom",
    ticker: "IAM",
    sector: "Télécommunications",
    hue: 265,
    status: "indexed",
    reports: ["2025"],
    income: [
      {
        label: "Chiffre d'affaires consolidé",
        unit: "MDH",
        values: { "2023": 36786, "2024": 36699, "2025": 36681 },
        source: "Rapport 2025, p. 59 et 65",
      },
      {
        label: "Résultat net part du groupe",
        unit: "MDH",
        values: { "2024": 1792, "2025": 6969 },
        source: "Rapport 2025, p. 9 et 10",
      },
      {
        label: "Résultat net ajusté",
        unit: "MDH",
        values: { "2024": 5938, "2025": 5649 },
        source: "Rapport 2025, p. 10",
      },
      {
        label: "Résultat net par action",
        unit: "DH",
        values: { "2024": 2.05, "2025": 7.93 },
        source: "Rapport 2025, p. 24",
      },
    ],
    balance: [
      {
        label: "CA Maroc",
        unit: "MDH",
        values: { "2023": 19543, "2024": 19143 },
        source: "Rapport 2025, p. 15 et 59",
      },
      {
        label: "CA International (Moov Africa)",
        unit: "MDH",
        values: { "2023": 18381, "2024": 18706 },
        source: "Rapport 2025, p. 15 et 59",
      },
    ],
  },
  {
    slug: "attijariwafa",
    name: "Attijariwafa bank",
    ticker: "ATW",
    sector: "Banque",
    hue: 38,
    status: "indexing",
    reports: ["2022", "2023"],
    income: [],
    balance: [],
  },
  {
    slug: "cosumar",
    name: "Cosumar",
    ticker: "CSR",
    sector: "Agroalimentaire",
    hue: 160,
    status: "indexing",
    reports: ["2022", "2023"],
    income: [],
    balance: [],
  },
];

/** Variation en % entre les deux dernières années disponibles d'un indicateur. */
export function lastChange(m: Metric): { from: string; to: string; pct: number } | null {
  const years = Object.keys(m.values).sort();
  if (years.length < 2) return null;
  const [from, to] = years.slice(-2);
  const a = m.values[from];
  const b = m.values[to];
  if (!a) return null;
  return { from, to, pct: ((b - a) / Math.abs(a)) * 100 };
}

/** Marge nette = résultat net / chiffre d'affaires, calculée ici et non saisie à la main. */
export function netMargin(c: Company): Record<string, number> {
  const ca = c.income.find((m) => m.label.startsWith("Chiffre d'affaires"));
  const rn = c.income.find((m) => m.label.startsWith("Résultat net part"));
  if (!ca || !rn) return {};
  return Object.fromEntries(
    Object.keys(rn.values)
      .filter((y) => ca.values[y])
      .map((y) => [y, (rn.values[y] / ca.values[y]) * 100]),
  );
}

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
