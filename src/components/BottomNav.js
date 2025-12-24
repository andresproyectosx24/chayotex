"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, FileText, Truck, Users } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Inicio",
      href: "/",
      icon: Home,
    },
    {
      name: "Inventario",
      href: "/inventario",
      icon: Package,
    },
    {
      name: "Notas",
      href: "/ventas", // Aquí irán el historial y creación de notas
      icon: FileText,
    },
    {
      name: "Liquid.", // Abreviado de Liquidaciones para móvil
      href: "/liquidaciones",
      icon: Truck,
    },
    {
      name: "Contactos", // Clientes y Proveedores juntos
      href: "/contactos",
      icon: Users,
    },
  ];

  // Ocultar en login
  if (pathname === "/login") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 pb-safe md:hidden">
      <div className="max-w-md mx-auto flex justify-between items-center h-16 px-1">
        {navItems.map((item) => {
          // Detectar si la ruta está activa (exacta o sub-ruta, excepto inicio)
          const isActive = 
            pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
            
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full py-1 ${
                isActive
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <div className={`transition-all duration-200 ${isActive ? "-translate-y-1" : ""}`}>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "drop-shadow-sm" : ""}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                isActive ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-500"
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}