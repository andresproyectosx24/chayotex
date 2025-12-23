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
  manifest: "/manifest.json", // Vinculamos el archivo que acabamos de crear
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chayotex",
  },
  formatDetection: {
    telephone: false, // Evita que los números se vuelvan links azules feos en iOS
  },
};

// VIEWPORT (Zoom y Escala)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Se siente más como app nativa al bloquear el zoom
  themeColor: "#16a34a", // Color de la barra de estado en Android
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