"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  writeBatch, 
  doc,
  serverTimestamp
} from "firebase/firestore";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Printer,     
  CheckSquare, 
  X,
  DollarSign, 
  Loader2,
  Search 
} from "lucide-react";

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]); 
  const [procesandoPago, setProcesandoPago] = useState(false); 
  const router = useRouter();

  const formatDate = (date) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  const getFolio = (venta) => venta.folio ? venta.folio.toString().padStart(4, '0') : "";

  useEffect(() => {
    let q = query(collection(db, "ventas"), orderBy("fecha", "desc"));

    if (filtro === "pendientes") {
      q = query(
        collection(db, "ventas"), 
        where("estado_pago", "==", "Pendiente"),
        orderBy("fecha", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fechaDate: doc.data().fecha?.toDate() || new Date(), 
      }));
      setVentas(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filtro]);

  const ventasFiltradas = ventas.filter((venta) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    const cliente = venta.cliente_nombre?.toLowerCase() || "";
    const folio = getFolio(venta); 
    const fecha = formatDate(venta.fechaDate).toLowerCase();
    return cliente.includes(term) || folio.includes(term) || fecha.includes(term);
  });

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
    router.push(`/ventas/imprimir?ids=${idsString}`);
  };

  const handleMarcarPagado = async () => {
    if (seleccionados.length === 0) return;
    if (!confirm(`¿Confirmas que recibiste el pago de las ${seleccionados.length} notas seleccionadas?`)) return;

    setProcesandoPago(true);
    try {
      const batch = writeBatch(db);
      seleccionados.forEach((id) => {
        const ventaRef = doc(db, "ventas", id);
        batch.update(ventaRef, {
          estado_pago: "Pagado",
          saldo_pendiente: 0,
          fecha_pago: serverTimestamp(), 
          metodo_cobro: "Caja" 
        });
      });
      await batch.commit();
      cancelarSeleccion();
    } catch (error) {
      console.error("Error al cobrar:", error);
      alert("Hubo un error al registrar el pago.");
    } finally {
      setProcesandoPago(false);
    }
  };

  const formatMoney = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32"> 
      
      {/* Header Fijo */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 px-4 pt-4 pb-2 space-y-3">
        
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {modoSeleccion ? `${seleccionados.length} seleccionadas` : "Notas de Venta"}
          </h1>
          
          <div className="flex gap-2">
            {modoSeleccion ? (
              <button 
                onClick={cancelarSeleccion} 
                className="flex items-center gap-2 text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>
            ) : (
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

        {!modoSeleccion && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por cliente, folio o fecha..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white pl-10 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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

        {!modoSeleccion && (
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button onClick={() => setFiltro("todos")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${filtro === "todos" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
              Todas
            </button>
            <button onClick={() => setFiltro("pendientes")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${filtro === "pendientes" ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
              <AlertCircle size={14} /> Por Cobrar
            </button>
          </div>
        )}
      </header>

      {/* Lista */}
      <main className="p-4 space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)
        ) : ventasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3 inline-block">
              <FileText size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {busqueda ? "No se encontraron resultados." : "No hay ventas registradas."}
            </p>
          </div>
        ) : (
          ventasFiltradas.map((venta) => (
            <div 
              key={venta.id}
              onClick={() => {
                if (modoSeleccion) {
                  toggleSeleccion(venta.id);
                } else {
                  router.push(`/ventas/${venta.id}`);
                }
              }}
              className={`relative bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border transition-all cursor-pointer ${
                modoSeleccion && seleccionados.includes(venta.id)
                  ? "border-green-500 ring-2 ring-green-500/20 bg-green-50 dark:bg-green-900/10"
                  : "border-gray-100 dark:border-gray-800 active:scale-[0.99]"
              }`}
            >
              {modoSeleccion && (
                <div className={`absolute top-4 right-4 h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                  seleccionados.includes(venta.id) ? "border-green-500 bg-green-500 text-white" : "border-gray-300"
                }`}>
                  {seleccionados.includes(venta.id) && <CheckCircle2 size={14} />}
                </div>
              )}

              <div className="flex justify-between items-start mb-2 pr-8">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {venta.cliente_nombre}
                    {venta.folio && <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-1 rounded">#{getFolio(venta)}</span>}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock size={10} className="mr-1" /> {formatDate(venta.fechaDate)}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-gray-50 dark:border-gray-800 pt-3 mt-1">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${venta.estado_pago === "Pagado" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>
                  {venta.estado_pago}
                </span>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-800 dark:text-white">{formatMoney(venta.total)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* --- Acciones Flotantes Mejoradas --- */}
      {/* md:left-auto: Evita que se estire en escritorio.
          md:w-auto: Ancho automático según contenido.
          transition-all + active:scale: Efecto de pulsación.
          disabled:translate-y-20: Se esconden hacia abajo si no están activos (efecto "move").
      */}
      {modoSeleccion ? (
        <div className="fixed bottom-20 right-4 left-4 md:left-auto flex gap-3 z-40">
          
          <button 
            onClick={irAImprimir}
            disabled={seleccionados.length === 0 || procesandoPago}
            className="flex-1 md:flex-none md:w-48 bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold p-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:translate-y-20 hover:shadow-2xl hover:-translate-y-1"
          >
            <Printer size={20} />
            <span className="text-sm">Imprimir ({seleccionados.length})</span>
          </button>

          <button 
            onClick={handleMarcarPagado}
            disabled={seleccionados.length === 0 || procesandoPago}
            className="flex-1 md:flex-none md:w-48 bg-green-600 hover:bg-green-500 text-white font-bold p-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:translate-y-20 hover:shadow-2xl hover:-translate-y-1"
          >
            {procesandoPago ? <Loader2 className="animate-spin" size={20}/> : <DollarSign size={20} />}
            <span className="text-sm">Marcar Pagado</span>
          </button>
        </div>
      ) : (
        <Link href="/ventas/nueva">
          <button className="fixed bottom-20 right-4 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-transform active:scale-95 z-40 hover:shadow-xl hover:-translate-y-1 duration-300">
            <Plus size={24} />
          </button>
        </Link>
      )}
    </div>
  );
}