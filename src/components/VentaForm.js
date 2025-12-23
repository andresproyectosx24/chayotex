"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  runTransaction, 
  serverTimestamp,
  where,
  doc // Importante
} from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  User, 
  CreditCard
} from "lucide-react";

export function VentaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Datos Maestros
  const [clientes, setClientes] = useState([]);
  const [inventario, setInventario] = useState([]);

  // Estado del Formulario
  const [clienteId, setClienteId] = useState("");
  const [metodoPago, setMetodoPago] = useState("Credito");
  const [items, setItems] = useState([]);

  // Carga inicial de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const qClientes = query(collection(db, "clientes"), orderBy("nombre", "asc"));
        const snapClientes = await getDocs(qClientes);
        const clientesData = snapClientes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const qInv = query(collection(db, "inventario"), where("stock_cajas", ">", 0));
        const snapInv = await getDocs(qInv);
        const invData = snapInv.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setClientes(clientesData);
        setInventario(invData);
        
        setItems([{ id: Date.now(), productoId: "", cajas: "", precio: "", subtotal: 0 }]);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addItem = () => {
    setItems([...items, { id: Date.now(), productoId: "", cajas: "", precio: "", subtotal: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];
    
    item[field] = value;

    if (field === "cajas" || field === "precio") {
      const cajas = Number(item.cajas) || 0;
      const precio = Number(item.precio) || 0;
      item.subtotal = cajas * precio;
    }

    setItems(newItems);
  };

  const totalVenta = items.reduce((acc, item) => acc + (item.subtotal || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId) return alert("Selecciona un cliente");
    if (items.some(i => !i.productoId || !i.cajas || !i.precio)) return alert("Completa todos los productos");

    setSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. GESTIÓN DE FOLIO
        // Definimos una referencia al contador de este año
        const year = new Date().getFullYear();
        const contadorRef = doc(db, "contadores", `ventas_${year}`);
        const contadorSnap = await transaction.get(contadorRef);

        let nuevoFolio = 1;
        if (contadorSnap.exists()) {
          nuevoFolio = (contadorSnap.data().actual || 0) + 1;
        }

        // 2. VERIFICACIÓN DE INVENTARIO
        const itemsProcesados = [];
        for (const item of items) {
          const invDocRef = doc(db, "inventario", item.productoId);
          const invDoc = await transaction.get(invDocRef);
          
          if (!invDoc.exists()) throw new Error("El producto ya no existe");
          
          const stockActual = invDoc.data().stock_cajas || 0;
          const cajasSolicitadas = Number(item.cajas);

          if (stockActual < cajasSolicitadas) {
            throw new Error(`Stock insuficiente para ${invDoc.data().tipo}. Disponibles: ${stockActual}`);
          }

          itemsProcesados.push({
            ref: invDocRef,
            nuevoStock: stockActual - cajasSolicitadas,
            datosSnap: invDoc.data()
          });
        }

        // 3. ACTUALIZACIONES (ESCRITURAS)
        
        // A. Actualizar Inventario
        itemsProcesados.forEach((item) => {
          transaction.update(item.ref, { stock_cajas: item.nuevoStock });
        });

        // B. Actualizar (o crear) el Contador de Folios
        transaction.set(contadorRef, { actual: nuevoFolio }, { merge: true });

        // C. Crear la Venta con el Folio
        const nuevaVentaRef = doc(collection(db, "ventas"));
        const clienteObj = clientes.find(c => c.id === clienteId);

        transaction.set(nuevaVentaRef, {
          folio: nuevoFolio, // <-- Guardamos el número secuencial
          anio_folio: year,
          cliente_id: clienteId,
          cliente_nombre: clienteObj?.nombre || "Cliente Desconocido",
          fecha: serverTimestamp(),
          items: items.map((item, idx) => ({
            producto_id: item.productoId,
            descripcion: `${itemsProcesados[idx].datosSnap.tipo} ${itemsProcesados[idx].datosSnap.calidad || ""} (${itemsProcesados[idx].datosSnap.origen || ""})`,
            cajas: Number(item.cajas),
            precio_unitario: Number(item.precio),
            subtotal: item.subtotal
          })),
          total: totalVenta,
          estado_pago: metodoPago === "Pagado" ? "Pagado" : "Pendiente",
          saldo_pendiente: metodoPago === "Pagado" ? 0 : totalVenta,
          metodo_pago: metodoPago
        });
      });

      router.push("/ventas");

    } catch (error) {
      console.error("Transacción fallida:", error);
      alert("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-green-600"/></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ... (El resto del JSX se mantiene idéntico) ... */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-3 text-green-600 dark:text-green-500"><User size={20} /></div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Cliente</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            >
              <option value="">-- Seleccionar --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} {c.alias ? `(${c.alias})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-3 text-green-600 dark:text-green-500"><CreditCard size={20} /></div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Condición de Pago</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setMetodoPago("Credito")}
                className={`p-2 rounded-lg text-sm font-bold border transition-all ${
                  metodoPago === "Credito" 
                  ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" 
                  : "border-gray-200 text-gray-500"
                }`}
              >
                A Crédito
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago("Pagado")}
                className={`p-2 rounded-lg text-sm font-bold border transition-all ${
                  metodoPago === "Pagado" 
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                  : "border-gray-200 text-gray-500"
                }`}
              >
                Pagado
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Detalle de Venta</h3>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
            {items.length} items
          </span>
        </div>

        {items.map((item, index) => (
          <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative animate-in slide-in-from-bottom-2">
            {items.length > 1 && (
              <button 
                type="button"
                onClick={() => removeItem(index)}
                className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Producto</label>
                <select
                  value={item.productoId}
                  onChange={(e) => updateItem(index, "productoId", e.target.value)}
                  className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="">-- Elegir --</option>
                  {inventario.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.tipo} {inv.calidad} ({inv.origen}) - Disp: {inv.stock_cajas}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Cajas</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={item.cajas}
                    onChange={(e) => updateItem(index, "cajas", e.target.value)}
                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Precio Caja</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={item.precio}
                      onChange={(e) => updateItem(index, "precio", e.target.value)}
                      className="w-full mt-1 pl-6 pr-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-right focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="text-right border-t border-dashed border-gray-100 dark:border-gray-800 pt-2 mt-2">
                <span className="text-xs text-gray-400 mr-2">Subtotal:</span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="w-full py-3 border-2 border-dashed border-green-200 dark:border-green-900/50 rounded-xl text-green-600 dark:text-green-500 font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Agregar otro producto
        </button>
      </div>

      <div className="sticky bottom-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md p-4 -mx-4 border-t border-gray-200 dark:border-gray-800 shadow-lg mt-8">
        <div className="flex justify-between items-end mb-4 px-2">
          <span className="text-sm font-medium text-gray-500">Total Nota</span>
          <span className="text-3xl font-black text-green-600 dark:text-green-400">
            ${totalVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting || totalVenta === 0}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" /> Registrando...
            </>
          ) : (
            <>
              <Save size={20} /> Guardar Venta
            </>
          )}
        </button>
      </div>
    </form>
  );
}