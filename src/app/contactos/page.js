"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Users, 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Trash2, 
  X,
  User,
  MessageCircle // Importamos el icono para WhatsApp
} from "lucide-react";

export default function ContactosPage() {
  // Estado para controlar qué pestaña estamos viendo
  const [activeTab, setActiveTab] = useState("clientes"); // 'clientes' o 'proveedores'
  
  // Estados de datos y carga
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", telefono: "", alias: "" });
  const [submitting, setSubmitting] = useState(false);

  // 1. Escuchar cambios en la base de datos en tiempo real
  useEffect(() => {
    setLoading(true);
    // Definimos qué colección leer según la pestaña activa
    const collectionName = activeTab === "clientes" ? "clientes" : "proveedores";
    
    // Consulta simple: Traer todos ordenados por nombre (si existe el campo) o fecha
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setContacts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  // 2. Función para guardar nuevo contacto
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    setSubmitting(true);
    const collectionName = activeTab === "clientes" ? "clientes" : "proveedores";

    try {
      await addDoc(collection(db, collectionName), {
        nombre: formData.nombre,
        telefono: formData.telefono,
        alias: formData.alias, // Opcional, útil para "El Güero", "Doña Mari"
        createdAt: serverTimestamp(),
      });
      
      // Limpiar y cerrar
      setFormData({ nombre: "", telefono: "", alias: "" });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Función para borrar (con confirmación simple)
  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de borrar este contacto?")) {
      const collectionName = activeTab === "clientes" ? "clientes" : "proveedores";
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      
      {/* --- Header Fijo --- */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Directorio
        </h1>
        
        {/* Selector de Pestañas (Tabs) */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("clientes")}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "clientes"
                ? "bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            <Users size={16} className="mr-2" />
            Clientes
          </button>
          <button
            onClick={() => setActiveTab("proveedores")}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "proveedores"
                ? "bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            <Truck size={16} className="mr-2" />
            Proveedores
          </button>
        </div>
      </header>

      {/* --- Lista de Contactos --- */}
      <main className="p-4 space-y-3">
        {loading ? (
          // Skeleton loader (Carga visual)
          [1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))
        ) : contacts.length === 0 ? (
          // Estado Vacío
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
              {activeTab === "clientes" ? (
                <Users size={32} className="text-gray-400" />
              ) : (
                <Truck size={32} className="text-gray-400" />
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No hay {activeTab} registrados aún.
            </p>
          </div>
        ) : (
          // Lista Real
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                  {contact.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {contact.nombre}
                  </h3>
                  {contact.alias && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      &ldquo;{contact.alias}&rdquo;
                    </p>
                  )}
                  {contact.telefono && (
                    <div className="flex items-center text-xs text-gray-400 mt-0.5">
                      <Phone size={10} className="mr-1" />
                      {contact.telefono}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                {/* Botones de Acción Rápida (Solo si hay teléfono) */}
                {contact.telefono && (
                  <>
                    <a 
                      href={`https://wa.me/${contact.telefono.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </a>
                    <a 
                      href={`tel:${contact.telefono}`} 
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Llamar"
                    >
                      <Phone size={18} />
                    </a>
                  </>
                )}
                
                <button 
                  onClick={() => handleDelete(contact.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Borrar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* --- Botón Flotante (FAB) --- */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform active:scale-95 z-40"
      >
        <Plus size={24} />
      </button>

      {/* --- Modal / Formulario --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Nuevo {activeTab === "clientes" ? "Cliente" : "Proveedor"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Alias / Apodo
                  </label>
                  <input
                    type="text"
                    value={formData.alias}
                    onChange={(e) => setFormData({...formData, alias: e.target.value})}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    placeholder="Ej. El Güero"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    placeholder="Ej. 55 1234..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl mt-4 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Guardando..." : "Guardar Contacto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}