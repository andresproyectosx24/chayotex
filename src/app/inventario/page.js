"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, // Importamos updateDoc
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Package, 
  Plus, 
  X, 
  Box, 
  Trash2, 
  AlertTriangle,
  MapPin,
  Layers,
  Pencil // Importamos el icono de lápiz
} from "lucide-react";

export default function InventarioPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal y Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null); // ID del producto que se está editando

  // Formulario con valores iniciales
  const initialFormState = { 
    categoria: "chayote", 
    tipo: "Espinoso", 
    calidad: "Primera", 
    origen: "Candelaria",
    stock_cajas: "" 
  };
  
  const [formData, setFormData] = useState(initialFormState);

  // Catálogos fijos
  const TIPOS_CHAYOTE = ["Espinoso", "Liso", "Negro", "Cambray"];
  const TIPOS_MATERIAL = ["Cajas de Cartón", "Bultos de Bolsa"];
  const CALIDADES = ["Primera", "Segunda", "Merma"];
  const ORIGENES = ["Candelaria", "Orizaba", "Paso de la Milpa", "Coscomatepec"];

  // 1. Cargar inventario en tiempo real
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "inventario"), orderBy("tipo", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función auxiliar para cerrar y limpiar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null); // Salimos del modo edición
    setFormData(initialFormState); // Reseteamos el formulario
  };

  // Función para cargar datos en el formulario (Modo Edición)
  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      categoria: item.categoria || "chayote",
      tipo: item.tipo,
      calidad: item.calidad || "Primera",
      origen: item.origen || "Candelaria",
      stock_cajas: item.stock_cajas
    });
    setIsModalOpen(true);
  };

  // 2. Guardar (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Preparamos los datos base
      const itemData = {
        categoria: formData.categoria,
        tipo: formData.tipo,
        stock_cajas: Number(formData.stock_cajas) || 0,
      };

      // Solo agregamos calidad y origen si es chayote
      if (formData.categoria === "chayote") {
        itemData.calidad = formData.calidad;
        itemData.origen = formData.origen;
      }

      if (editingId) {
        // --- MODO ACTUALIZAR ---
        const docRef = doc(db, "inventario", editingId);
        await updateDoc(docRef, itemData);
      } else {
        // --- MODO CREAR ---
        itemData.createdAt = serverTimestamp();
        await addDoc(collection(db, "inventario"), itemData);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error al guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Borrar item
  const handleDelete = async (id) => {
    if (confirm("¿Seguro que quieres borrar este item? Esta acción no se puede deshacer.")) {
      await deleteDoc(doc(db, "inventario", id));
    }
  };

  // Helper para color según calidad
  const getQualityColor = (calidad) => {
    switch (calidad) {
      case "Primera": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Segunda": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Merma": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      
      {/* --- Header --- */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
          <Package className="mr-2 text-green-600" size={24} />
          Inventario
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Control de Productos y Materiales
        </p>
      </header>

      {/* --- Grid de Productos --- */}
      <main className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
              <Box size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Tu bodega está vacía. <br/> Registra productos o materiales.
            </p>
          </div>
        ) : (
          products.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl p-5 shadow-sm border relative overflow-hidden group ${
                item.categoria === "material" 
                  ? "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
                  : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
              }`}
            >
              {/* Encabezado de la Tarjeta */}
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  {item.categoria === "material" && (
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center mb-1">
                       <Layers size={10} className="mr-1" /> Material
                     </span>
                  )}

                  <h3 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">
                    {item.tipo}
                  </h3>

                  {item.categoria !== "material" && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getQualityColor(item.calidad)}`}>
                        {item.calidad}
                      </span>
                      {item.origen && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center">
                          <MapPin size={8} className="mr-1" />
                          {item.origen}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Botones de Acción (Editar y Borrar) */}
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Borrar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Contador Grande */}
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {item.stock_cajas}
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  {item.categoria === "material" && item.tipo.includes("Bolsa") ? "bultos" : "cajas"}
                </span>
              </div>
            </div>
          ))
        )}
      </main>

      {/* --- Botón Flotante (FAB) --- */}
      <button
        onClick={() => {
          handleCloseModal(); // Aseguramos que se limpie cualquier estado de edición previo
          setIsModalOpen(true);
        }}
        className="fixed bottom-20 right-4 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform active:scale-95 z-40"
      >
        <Plus size={24} />
      </button>

      {/* --- Modal Nuevo/Editar Item --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingId ? "Editar Producto" : "Agregar a Bodega"}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Switch Categoría (Solo editable si es nuevo, opcionalmente) */}
              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, categoria: "chayote", tipo: TIPOS_CHAYOTE[0] })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    formData.categoria === "chayote"
                      ? "bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Producto
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, categoria: "material", tipo: TIPOS_MATERIAL[0] })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    formData.categoria === "material"
                      ? "bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Materiales
                </button>
              </div>

              {/* Campos Dinámicos */}
              {formData.categoria === "chayote" ? (
                <>
                  {/* TIPO CHAYOTE */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Variedad</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIPOS_CHAYOTE.map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setFormData({ ...formData, tipo })}
                          className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${
                            formData.tipo === tipo
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CALIDAD Y ORIGEN */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Calidad</label>
                      <div className="flex gap-2">
                        {CALIDADES.map((calidad) => (
                          <button
                            key={calidad}
                            type="button"
                            onClick={() => setFormData({ ...formData, calidad })}
                            className={`flex-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                              formData.calidad === calidad
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {calidad}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center">
                        <MapPin size={12} className="mr-1" /> Origen
                      </label>
                      <select
                        value={formData.origen}
                        onChange={(e) => setFormData({...formData, origen: e.target.value})}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white text-sm appearance-none"
                      >
                        {ORIGENES.map(origen => (
                          <option key={origen} value={origen}>{origen}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                /* TIPO MATERIAL */
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tipo de Material</label>
                  <div className="flex flex-col gap-2">
                    {TIPOS_MATERIAL.map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo })}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center ${
                          formData.tipo === tipo
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <Layers size={16} className="mr-3 opacity-50" />
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Inicial */}
              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {editingId ? "Stock Actual" : "Stock Inicial"}
                </label>
                <div className="relative">
                  <Box className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.stock_cajas}
                    onChange={(e) => setFormData({...formData, stock_cajas: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                </div>
                {!editingId && (
                  <p className="text-[10px] text-gray-400 flex items-center mt-1">
                    <AlertTriangle size={10} className="mr-1" />
                    Este es el inventario inicial.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-all active:scale-[0.98]"
              >
                {submitting ? "Procesando..." : (editingId ? "Actualizar Producto" : "Guardar en Bodega")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}