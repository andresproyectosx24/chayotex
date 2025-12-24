"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link"; // Importamos Link
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  Loader2, 
  Sprout, 
  Home, 
  Package, 
  FileText, 
  Truck, 
  Users 
} from "lucide-react"; // Importamos los iconos aquí

export function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && pathname === "/login") {
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="animate-spin text-green-600 mb-2" size={30} />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  const isLoginPage = pathname === "/login";

  // Definimos la navegación aquí mismo para asegurar que se renderice correctamente
  const navItems = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Notas", href: "/ventas", icon: FileText },
    { name: "Liquid.", href: "/liquidaciones", icon: Truck },
    { name: "Contactos", href: "/contactos", icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      
      {/* --- SISTEMA DE NAVEGACIÓN (Integrado) --- */}
      {!isLoginPage && (
        <>
          {/* MÓVIL Y TABLET: Barra Inferior (Se oculta SOLO en desktop grande 'lg:hidden') */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
            <div className="flex justify-between items-center h-16 px-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex flex-col items-center justify-center w-full h-full py-1 ${
                      isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                  >
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "-translate-y-1 transition-transform" : ""} />
                    <span className={`text-[10px] font-medium ${isActive ? "text-green-600 dark:text-green-400" : ""}`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ESCRITORIO: Sidebar Lateral (Solo visible en desktop grande 'hidden lg:flex') */}
          <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col z-50">
            <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
              <div className="bg-green-600 p-2 rounded-xl text-white shadow-lg shadow-green-600/20">
                <Sprout size={24} />
              </div>
              <div>
                <h1 className="font-black text-xl text-gray-800 dark:text-white tracking-tight">Chayotex</h1>
                <p className="text-xs text-gray-400 font-medium">Panel de Control</p>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold shadow-sm" 
                        : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon size={22} className={isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 group-hover:text-gray-600"} />
                    <span className="text-sm">{item.name === "Liquid." ? "Liquidaciones" : item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
               <p className="text-[10px] text-center text-gray-400">v1.0 Desktop</p>
            </div>
          </aside>
        </>
      )}

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main 
        className={`flex-1 w-full min-w-0 flex flex-col transition-all duration-300 ${
          !isLoginPage 
            ? "lg:pl-64 pb-20 lg:pb-0" // Padding izquierdo SOLO en desktop grande
            : "" 
        }`}
      >
        {children}
      </main>
    </div>
  );
}