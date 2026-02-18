import "./globals.css";

import { LanguageProvider } from "@/context/LanguageContext";

export const metadata = {
  title: "Vacanze Mare | Affitti Turistici di Pregio",
  description: "Appartamenti eleganti tra mare e natura. Prenota il tuo soggiorno ideale.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <LanguageProvider>
        <body>
          {children}
        </body>
      </LanguageProvider>
    </html>
  );
}
