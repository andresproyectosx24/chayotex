import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
import { AuthGuard } from "@/components/AuthGuard";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// METADATOS PWA
export const metadata = {
  title: "Chayotex",
  description: "Sistema de gestión para comercialización de chayotes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // iOS intenta adaptarse
    title: "Chayotex",
  },
  formatDetection: {
    telephone: false,
  },
};

// VIEWPORT ADAPTATIVO
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Aquí definimos el color dinámico de la barra de estado
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" }, // Blanco para modo claro
    { media: "(prefers-color-scheme: dark)", color: "#111827" },  // Gris oscuro (gray-900) para modo oscuro
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 overscroll-none`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthGuard>
            {children}
            <BottomNav />
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}