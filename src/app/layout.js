import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
import { AuthGuard } from "@/components/AuthGuard"; // Importamos el guardia
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Chayotex",
  description: "Sistema de gestión para comercialización de chayotes",
  manifest: "/manifest.json", 
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Envolvemos la App con el Guardia de Seguridad */}
          <AuthGuard>
            {children}
            <BottomNav />
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}