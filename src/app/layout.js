import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
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
          {children}
          {/* La barra de navegación se renderiza aquí para estar en todas las páginas */}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}