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
  doc,
  where
} from "firebase/firestore";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Truck, 
  PackagePlus, 
  MinusCircle, 
  Plus, 
  Trash2,
  Box
} from "lucide-react";

export default function NuevaLiquidacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Catálogos
  const [proveedores, setProveedores] = useState([]);
  const [inventario, setInventario] = useState([]); // Para saber qué productos manejamos

  // Estado del Formulario
  const [proveedorId, setProveedorId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  // LISTA 1: PRODUCTOS QUE ENTRAN (Suman $$)
  const [entradas, setEntradas] = useState([
    { id: Date.now(), productoId: "", cajas: "", precio: "", subtotal: 0 }
  ]);

  // LISTA 2: GASTOS A DESCONTAR (Restan $$)
  const [gastos, setGastos] = useState([
    { id: Date.now(), concepto: "Flete", monto: "" }
  ]);

  // Carga inicial
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar Proveedores
        const qProv = query(collection(db, "proveedores"), orderBy("nombre", "asc"));
        const snapProv = await getDocs(qProv);
        setProveedores(snapProv.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Cargar Catálogo de Productos (Inventario)
        // Traemos todo para que pueda elegir qué producto está recibiendo
        const qInv = query(collection(db, "inventario"), where("categoria", "==", "chayote")); 
        const snapInv = await getDocs(qInv);
        setInventario(snapInv.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- MANEJO DE ENTRADAS (PRODUCTOS) ---
  const addEntrada = () => {
    setEntradas([...entradas, { id: Date.now(), productoId: "", cajas: "", precio: "", subtotal: 0 }]);
  };

  const removeEntrada = (index) => {
    setEntradas(entradas.filter((_, i) => i !== index));
  };

  const updateEntrada = (index, field, value) => {
    const newEntradas = [...entradas];
    const item = newEntradas[index];
    item[field] = value;

    // Calcular subtotal
    if (field === "cajas" || field === "precio") {
      const cajas = Number(item.cajas) || 0;
      const precio = Number(item.precio) || 0;
      item.subtotal = cajas * precio;
    }
    setEntradas(newEntradas);
  };

  // --- MANEJO DE GASTOS (DEDUCCIONES) ---
  const addGasto = () => {
    setGastos([...gastos, { id: Date.now(), concepto: "", monto: "" }]);
  };

  const removeGasto = (index) => {
    setGastos(gastos.filter((_, i) => i !== index));
  };

  const updateGasto = (index, field, value) => {
    const newGastos = [...gastos];
    newGastos[index][field] = value;
    setGastos(newGastos);
  };

  // --- CÁLCULOS FINALES ---
  const totalEntrada = entradas.reduce((acc, item) => acc + item.subtotal, 0);
  const totalGastos = gastos.reduce((acc, item) => acc + (Number(item.monto) || 0), 0);
  const totalPagar = totalEntrada - totalGastos;

  // --- GUARDAR (TRANSACCIÓN) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proveedorId) return alert("Selecciona un proveedor");
    if (entradas.some(e => !e.productoId || !e.cajas || !e.precio)) return alert("Completa los productos recibidos");

    setSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. GESTIÓN DE FOLIO (Liquidaciones)
        const year = new Date().getFullYear();
        const contadorRef = doc(db, "contadores", `liquidaciones_${year}`);
        const contadorSnap = await transaction.get(contadorRef);
        let nuevoFolio = 1;
        if (contadorSnap.exists()) nuevoFolio = (contadorSnap.data().actual || 0) + 1;

        // 2. ACTUALIZAR INVENTARIO (SUMAR STOCK)
        const productosProcesados = [];
        for (const item of entradas) {
          const invRef = doc(db, "inventario", item.productoId);
          const invSnap = await transaction.get(invRef);
          
          if (!invSnap.exists()) throw new Error("Producto no encontrado en catálogo");
          
          const nuevoStock = (invSnap.data().stock_cajas || 0) + Number(item.cajas);
          
          productosProcesados.push({
            ref: invRef,
            stock: nuevoStock,
            datos: invSnap.data() // Guardar snapshot para descripción histórica
          });
        }

        // Ejecutar actualizaciones de stock
        productosProcesados.forEach(p => {
          transaction.update(p.ref, { stock_cajas: p.stock });
        });
        transaction.set(contadorRef, { actual: nuevoFolio }, { merge: true });

        // 3. CREAR LA LIQUIDACIÓN
        const nuevaLiqRef = doc(collection(db, "liquidaciones"));
        const provData = proveedores.find(p => p.id === proveedorId);

        transaction.set(nuevaLiqRef, {
          folio: nuevoFolio,
          anio_folio: year,
          proveedor_id: proveedorId,
          proveedor_nombre: provData?.nombre || "Desconocido",
          fecha_registro: serverTimestamp(),
          fecha_manual: fecha,
          
          // Arrays de detalle
          items_entrada: entradas.map((e, i) => ({
            producto_id: e.productoId,
            descripcion: `${productosProcesados[i].datos.tipo} ${productosProcesados[i].datos.calidad}`,
            cajas: Number(e.cajas),
            precio_compra: Number(e.precio),
            subtotal: e.subtotal
          })),
          
          items_gastos: gastos.map(g => ({
            concepto: g.concepto,
            monto: Number(g.monto)
          })),

          // Totales
          total_mercancia: totalEntrada,
          total_gastos: totalGastos,
          total_a_pagar: totalPagar,
          
          estado: "Pendiente" // Pendiente de pago al agricultor
        });
      });

      alert("Liquidación registrada y Stock actualizado.");
      // Aquí redirigiremos al historial de liquidaciones cuando lo creemos
      router.push("/"); 
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 px-4 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Liquidación</h1>
          <p className="text-xs text-gray-500">Recepción de mercancía</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Datos Generales */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Agricultor / Proveedor</label>
              <div className="flex gap-2 mt-1">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-700">
                  <Truck size={20} />
                </div>
                <select
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg font-bold focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Seleccionar Agricultor...</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Fecha de Recepción</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg"
              />
            </div>
          </div>

          {/* 2. ENTRADAS (VERDE) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase flex items-center gap-2">
                <PackagePlus size={18} /> Entrada de Producto
              </h3>
            </div>
            
            {entradas.map((item, index) => (
              <div key={item.id} className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border-l-4 border-green-500 relative">
                <button type="button" onClick={() => removeEntrada(index)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
                
                <div className="grid grid-cols-1 gap-3 pr-6">
                  <select
                    value={item.productoId}
                    onChange={(e) => updateEntrada(index, "productoId", e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium"
                    required
                  >
                    <option value="">Elegir Producto...</option>
                    {inventario.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.tipo} {inv.calidad} ({inv.origen})</option>
                    ))}
                  </select>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400">Cajas</span>
                      <input 
                        type="number" placeholder="0" 
                        value={item.cajas} onChange={(e) => updateEntrada(index, "cajas", e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400">Precio</span>
                      <input 
                        type="number" placeholder="$0" 
                        value={item.precio} onChange={(e) => updateEntrada(index, "precio", e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400">Subtotal</span>
                      <div className="w-full p-2 text-right font-bold text-green-700 dark:text-green-400">
                        ${item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addEntrada} className="w-full py-2 border-2 border-dashed border-green-200 text-green-600 rounded-xl text-sm font-bold hover:bg-green-50">
              <Plus size={16} className="inline mr-1" /> Agregar Producto
            </button>
          </div>

          {/* 3. GASTOS (ROJO) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-2">
                <MinusCircle size={18} /> Deducciones (Gastos)
              </h3>
            </div>
            
            {gastos.map((item, index) => (
              <div key={item.id} className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border-l-4 border-red-500 relative">
                <button type="button" onClick={() => removeGasto(index)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
                
                <div className="grid grid-cols-3 gap-3 pr-6 items-end">
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase font-bold text-gray-400">Concepto</span>
                    <input 
                      list="conceptos-sugeridos"
                      type="text" 
                      placeholder="Ej. Flete, Bolsas..." 
                      value={item.concepto} onChange={(e) => updateGasto(index, "concepto", e.target.value)}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                    />
                    <datalist id="conceptos-sugeridos">
                      <option value="Flete" />
                      <option value="Maniobra" />
                      <option value="Cajas Enviadas" />
                      <option value="Bolsas" />
                      <option value="Adelanto Efectivo" />
                    </datalist>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400">Monto</span>
                    <input 
                      type="number" placeholder="$0" 
                      value={item.monto} onChange={(e) => updateGasto(index, "monto", e.target.value)}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-right font-bold text-red-600"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addGasto} className="w-full py-2 border-2 border-dashed border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50">
              <Plus size={16} className="inline mr-1" /> Agregar Gasto
            </button>
          </div>

          {/* RESUMEN FINAL */}
          <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Total Mercancía (+)</span>
              <span>${totalEntrada.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-red-400">
              <span>Total Gastos (-)</span>
              <span>- ${totalGastos.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between items-end">
              <span className="font-bold">A PAGAR AL AGRICULTOR</span>
              <span className="text-2xl font-black text-green-400">${totalPagar.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 active:scale-[0.98] disabled:opacity-50 flex justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <Save />}
            Confirmar Liquidación
          </button>

        </form>
      </main>
    </div>
  );
}