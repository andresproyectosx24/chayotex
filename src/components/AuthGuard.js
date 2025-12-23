"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, Sprout } from "lucide-react";

export function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // LÓGICA DE PROTECCIÓN DE RUTAS
      
      // 1. Si NO hay usuario y NO estamos en login -> Mandar a Login
      if (!user && pathname !== "/login") {
        router.push("/login");
      }
      // 2. Si SI hay usuario y estamos en Login -> Mandar a Inicio (Dashboard)
      else if (user && pathname === "/login") {
        router.push("/");
      }
      
      // Terminamos de verificar
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  // PANTALLA DE CARGA GLOBAL
  // Se muestra mientras Firebase verifica si estás conectado
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="animate-bounce mb-4">
          <div className="bg-green-100 p-4 rounded-2xl text-green-600">
            <Sprout size={48} />
          </div>
        </div>
        <Loader2 className="animate-spin text-green-600 mb-2" size={24} />
        <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando Chayotex...</p>
      </div>
    );
  }

  // Si ya verificamos, mostramos la app (o el login)
  return <>{children}</>;
}