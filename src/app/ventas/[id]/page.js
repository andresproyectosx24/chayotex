"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Usamos useRouter
import { db } from "@/lib/firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { 
  ArrowLeft, 
  Loader2,
  Trash2,
  Pencil,
  AlertTriangle,
  PackageCheck,
  Calendar,
  User
} from "lucide-react";

export default function DetalleVentaPage({ params }) {
  const [id, setId] = useState(null);
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false); // Para el loading de borrar
  const router = useRouter();

  // Resolución de params
  useEffect(() => {
    Promise.resolve(params).then(p => setId(p.id));
  }, [params]);

  // Carga de datos
  useEffect(() => {
    const fetchVenta = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "ventas", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setVenta({ 
            id: docSnap.id, 
            ...docSnap.data(),
            fechaDate: docSnap.data().fecha?.toDate() || new Date()
          });
        } else {
          router.push("/ventas");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenta();
  }, [id, router]);

  // --- LÓGICA DE BORRADO SEGURO (Devolución de Stock) ---
  const handleBorrar = async () => {
    if (!window.confirm("⚠️ ¿Estás seguro de ELIMINAR esta venta?\n\nEsta acción devolverá los productos al inventario automáticamente.")) {
      return;
    }

    setProcesando(true);
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Leer la venta para asegurar consistencia
        const ventaRef = doc(db, "ventas", venta.id);
        const ventaSnap = await transaction.get(ventaRef);
        if (!ventaSnap.exists()) throw "La venta no existe";

        const items = ventaSnap.data().items;
        
        // 2. FASE DE LECTURA MASIVA:
        // Primero leemos TODOS los stocks actuales antes de escribir nada.
        // Si intentamos leer después de escribir, la transacción fallará.
        const inventarioUpdates = [];
        
        for (const item of items) {
          const productoRef = doc(db, "inventario", item.producto_id);
          const productoSnap = await transaction.get(productoRef);

          if (productoSnap.exists()) {
            // Calculamos el nuevo stock en memoria, pero NO escribimos todavía
            const nuevoStock = (productoSnap.data().stock_cajas || 0) + item.cajas;
            inventarioUpdates.push({ ref: productoRef, stock: nuevoStock });
          }
        }

        // 3. FASE DE ESCRITURA:
        // Ahora que ya leímos todo, ejecutamos todas las actualizaciones
        for (const update of inventarioUpdates) {
          transaction.update(update.ref, { stock_cajas: update.stock });
        }

        // Finalmente borramos la venta
        transaction.delete(ventaRef);
      });

      alert("Venta eliminada y stock restaurado correctamente.");
      router.push("/ventas");

    } catch (error) {
      console.error("Error al borrar:", error);
      alert("Error al borrar: " + error);
    } finally {
      setProcesando(false);
    }
  };

  const handleEditar = () => {
    // Redirigimos a la página de edición (que crearemos si la necesitas)
    // Usaremos el mismo formulario VentaForm pero en modo edición
    router.push(`/ventas/editar/${venta.id}`);
  };

  const getFolio = (v) => v.folio ? v.folio.toString().padStart(4, '0') : v.id.slice(0, 6).toUpperCase();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="animate-spin text-green-600" size={40} />
    </div>
  );

  if (!venta) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      
      {/* --- HEADER --- */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 px-4 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-right">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FOLIO</span>
             <h1 className="text-xl font-black text-gray-900 dark:text-white font-mono leading-none">
               #{getFolio(venta)}
             </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* --- TARJETA DE RESUMEN --- */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
            {/* Info Cliente */}
            <div className="flex items-start gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Cliente</p>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{venta.cliente_nombre}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                     venta.estado_pago === "Pagado" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                   }`}>
                     {venta.estado_pago}
                   </span>
                   <span className="text-xs text-gray-500">
                     • {venta.metodo_pago}
                   </span>
                </div>
              </div>
            </div>

            {/* Info Fecha */}
            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl self-start">
               <Calendar size={18} />
               <span className="text-sm font-medium">
                 {venta.fechaDate.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
               </span>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="border rounded-xl overflow-hidden border-gray-100 dark:border-gray-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium text-center">Cajas</th>
                  <th className="px-4 py-3 font-medium text-right">$$</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {venta.items.map((item, idx) => (
                  <tr key={idx} className="dark:text-gray-300">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.descripcion}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{item.cajas}</td>
                    <td className="px-4 py-3 text-right text-gray-500">${item.precio_unitario}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                      ${item.subtotal?.toLocaleString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-500">TOTAL VENTA</td>
                  <td className="px-4 py-3 text-right font-black text-lg text-gray-900 dark:text-white">
                    ${venta.total?.toLocaleString('es-MX')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* --- ZONA DE PELIGRO / ACCIONES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <button 
            onClick={handleEditar}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
          >
            <Pencil size={20} />
            Editar Venta
          </button>

          <button 
            onClick={handleBorrar}
            disabled={procesando}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors disabled:opacity-50"
          >
            {procesando ? <Loader2 className="animate-spin" /> : <Trash2 size={20} />}
            Eliminar Venta
          </button>

        </div>

        <div className="flex items-start gap-2 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-500 text-xs">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>
            <strong>Nota:</strong> Al eliminar la venta, las cajas se devolverán automáticamente al inventario. Si editas la venta, asegúrate de verificar que el inventario cuadre.
          </p>
        </div>

      </main>
    </div>
  );
}