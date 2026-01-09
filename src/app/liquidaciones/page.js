"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  Plus, 
  Truck, 
  Calendar, 
  TrendingDown,
  Printer,
  CheckSquare,
  X,
  CheckCircle2,
  Loader2,
  Search // Importamos Search
} from "lucide-react";

export default function LiquidacionesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE SELECCIÓN Y BÚSQUEDA ---
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [busqueda, setBusqueda] = useState(""); // Estado para el buscador
  const router = useRouter();

  // Helpers de formato
  const formatMoney = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  const formatDate = (date) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  // Helper para folio seguro (usa numérico si existe, sino ID corto)
  const getFolio = (item) => item.folio ? item.folio.toString().padStart(4, '0') : item.id.slice(0, 4);

  useEffect(() => {
    const q = query(collection(db, "liquidaciones"), orderBy("fecha_registro", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaDate: doc.data().fecha_registro?.toDate() || new Date()
      }));
      setItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- LÓGICA DE FILTRADO POR BÚSQUEDA ---
  const itemsFiltrados = items.filter((item) => {
    if (!busqueda) return true;
    
    const term = busqueda.toLowerCase();
    const proveedor = item.proveedor_nombre?.toLowerCase() || "";
    const folio = getFolio(item).toLowerCase();
    const fecha = formatDate(item.fechaDate).toLowerCase();

    return proveedor.includes(term) || folio.includes(term) || fecha.includes(term);
  });

  // --- LÓGICA DE SELECCIÓN ---
  const toggleSeleccion = (id) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(item => item !== id));
    } else {
      setSeleccionados([...seleccionados, id]);
    }
  };

  const activarModoSeleccion = () => {
    setModoSeleccion(true);
    setSeleccionados([]);
  };

  const cancelarSeleccion = () => {
    setModoSeleccion(false);
    setSeleccionados([]);
  };

  const irAImprimir = () => {
    if (seleccionados.length === 0) return;
    const idsString = seleccionados.join(",");
    router.push(`/liquidaciones/imprimir?ids=${idsString}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 px-4 pt-4 pb-2 space-y-3">
        
        {/* Fila 1: Título y Botones de Selección */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              {modoSeleccion ? `${seleccionados.length} seleccionadas` : "Liquidaciones"}
            </h1>
            <p className="text-xs text-gray-500">
              {modoSeleccion ? "Elige para imprimir" : "Compras a agricultores"}
            </p>
          </div>
          
          <div className="flex gap-2">
            {modoSeleccion ? (
              <button onClick={cancelarSeleccion} className="text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded-xl">
                <X size={20} />
              </button>
            ) : (
              // Botón de selección múltiple
               <button 
                onClick={activarModoSeleccion} 
                className="flex items-center gap-2 text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-3 py-2 rounded-xl text-sm font-bold transition-colors border border-green-200 dark:border-green-800/50"
                title="Seleccionar para imprimir o cobrar"
              >
                <CheckSquare size={18} />
                <span>Seleccionar</span>
              </button>
            )}
          </div>
        </div>

        {/* Fila 2: Buscador (Solo visible si no estamos seleccionando para mantener limpieza) */}
        {!modoSeleccion && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar proveedor, folio o fecha..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white pl-10 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </header>

      {/* Lista */}
      <main className="p-4 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)
        ) : itemsFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3 inline-block">
              <Truck size={32} className="text-gray-400" />
            </div>
            <p>{busqueda ? "No se encontraron resultados." : "No hay recepciones registradas."}</p>
          </div>
        ) : (
          itemsFiltrados.map((item) => (
            <div 
              key={item.id} 
              onClick={() => {
                if (modoSeleccion) {
                  toggleSeleccion(item.id);
                } else {
                  router.push(`/liquidaciones/${item.id}`);
                }
              }}
              className={`relative bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border transition-all cursor-pointer ${
                modoSeleccion && seleccionados.includes(item.id)
                  ? "border-green-500 ring-2 ring-green-500/20 bg-green-50 dark:bg-green-900/10"
                  : "border-gray-100 dark:border-gray-800 active:scale-[0.99]"
              }`}
            >
              {/* Checkbox Visual */}
              {modoSeleccion && (
                <div className={`absolute top-4 right-4 h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                  seleccionados.includes(item.id) ? "border-green-500 bg-green-500 text-white" : "border-gray-300"
                }`}>
                  {seleccionados.includes(item.id) && <CheckCircle2 size={14} />}
                </div>
              )}

              <div className="flex justify-between items-start mb-2 pr-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-sm">
                    {item.proveedor_nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                      {item.proveedor_nombre}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                      <Calendar size={10} className="mr-1" /> 
                      {formatDate(item.fechaDate)}
                      <span className="mx-1">•</span>
                      <span className="bg-gray-100 dark:bg-gray-800 px-1.5 rounded text-[10px]">
                        #{getFolio(item)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="block text-xs text-gray-400 mb-0.5">A Pagar</span>
                  <span className="text-lg font-black text-green-600 dark:text-green-400">
                    {formatMoney(item.total_a_pagar)}
                  </span>
                </div>
              </div>

              {/* Resumen Mini */}
              <div className="flex items-center gap-4 border-t border-gray-50 dark:border-gray-800 pt-2 mt-1 text-xs">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Truck size={12} className="mr-1" />
                  {item.items_entrada?.length || 0} prod.
                </div>
                <div className="flex items-center text-red-500 dark:text-red-400">
                  <TrendingDown size={12} className="mr-1" />
                  -{formatMoney(item.total_gastos)} gastos
                </div>
              </div>

            </div>
          ))
        )}
      </main>

      {/* --- BOTÓN FLOTANTE DE IMPRESIÓN --- */}
      {modoSeleccion ? (
        <button 
          onClick={irAImprimir}
          disabled={seleccionados.length === 0}
          className="fixed bottom-20 right-4 left-4 md:left-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold p-4 rounded-xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 z-40 disabled:opacity-50 disabled:translate-y-20 transition-all duration-300"
        >
          <Printer size={24} />
          <span>Imprimir {seleccionados.length} Recibos</span>
        </button>
      ) : (
        // FAB Normal (Nueva Liquidación)
        <Link href="/liquidaciones/nueva">
          <button className="fixed bottom-20 right-4 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform active:scale-95 z-40">
            <Plus size={24} />
          </button>
        </Link>
      )}
    </div>
  );
}