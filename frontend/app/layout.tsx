import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astrolabe · Analyste financier IA",
  description: "RAG agentique multilingue sur les rapports des sociétés cotées à Casablanca",
};

// Applique le thème sauvegardé avant l'affichage, pour éviter un flash clair en mode sombre
const themeScript = `try{const t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
