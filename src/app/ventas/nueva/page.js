"use client";
import { VentaForm } from "@/components/VentaForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NuevaVentaPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header Simple con botón atrás */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 px-4 py-4 flex items-center gap-4">
        <Link 
          href="/ventas" 
          className="p-2 -ml-2 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Nueva Venta
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Crear nota de remisión
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* Aquí cargamos el formulario inteligente */}
        <VentaForm />
      </main>
    </div>
  );
}