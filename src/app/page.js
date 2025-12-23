"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp 
} from "firebase/firestore";
import { 
  TrendingUp, 
  Package, 
  Wallet, 
  LogOut, 
  Plus, 
  Truck, 
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Sprout // Agregamos el icono de Sprout para el logo
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para los datos del dashboard
  const [kpis, setKpis] = useState({
    ventasHoy: 0,
    porCobrar: 0,
    inventario: 0
  });
  const [actividadReciente, setActividadReciente] = useState([]);

  const router = useRouter();

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Carga de Datos del Dashboard
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Inicio del día
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Fin del día (mañana 00:00)

        // --- KPI 1: Ventas de Hoy ---
        const qVentasHoy = query(
          collection(db, "ventas"),
          where("fecha", ">=", Timestamp.fromDate(today)),
          where("fecha", "<", Timestamp.fromDate(tomorrow))
        );
        const snapVentasHoy = await getDocs(qVentasHoy);
        const totalVentasHoy = snapVentasHoy.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);

        // --- KPI 2: Cuentas por Cobrar ---
        const qPorCobrar = query(
          collection(db, "ventas"), 
          where("estado_pago", "==", "Pendiente")
        );
        const snapPorCobrar = await getDocs(qPorCobrar);
        const totalPorCobrar = snapPorCobrar.docs.reduce((acc, doc) => {
          const data = doc.data();
          return acc + (data.saldo_pendiente !== undefined ? data.saldo_pendiente : data.total);
        }, 0);

        // --- KPI 3: Inventario Total ---
        const snapInventario = await getDocs(collection(db, "inventario"));
        const totalInventario = snapInventario.docs.reduce((acc, doc) => acc + (doc.data().stock_cajas || 0), 0);

        setKpis({
          ventasHoy: totalVentasHoy,
          porCobrar: totalPorCobrar,
          inventario: totalInventario
        });

        // --- HISTORIAL UNIFICADO (Ventas + Entradas) ---
        const qRecentVentas = query(collection(db, "ventas"), orderBy("fecha", "desc"), limit(5));
        const qRecentLiq = query(collection(db, "liquidaciones"), orderBy("fecha_registro", "desc"), limit(5));

        const [snapV, snapL] = await Promise.all([getDocs(qRecentVentas), getDocs(qRecentLiq)]);

        const movimientosV = snapV.docs.map(d => ({
          id: d.id,
          tipo: 'venta',
          titulo: `Venta: ${d.data().cliente_nombre}`,
          subtitulo: `${d.data().items?.length || 0} productos`,
          monto: d.data().total,
          fecha: d.data().fecha?.toDate(),
          url: `/ventas/${d.id}`
        }));

        const movimientosL = snapL.docs.map(d => ({
          id: d.id,
          tipo: 'entrada',
          titulo: `Entrada: ${d.data().proveedor_nombre}`,
          subtitulo: `Folio: ${d.data().folio || 'S/N'}`,
          monto: d.data().total_a_pagar,
          fecha: d.data().fecha_registro?.toDate(),
          url: `/liquidaciones/${d.id}`
        }));

        const combinados = [...movimientosV, ...movimientosL]
          .sort((a, b) => b.fecha - a.fecha)
          .slice(0, 10);

        setActividadReciente(combinados);

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const formatMoney = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-24">
      
      {/* --- Header Estilizado --- */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 transition-all">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          
          {/* Identidad y Usuario */}
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-xl text-green-600 dark:text-green-400 shadow-sm ring-1 ring-green-500/10">
              <Sprout size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-800 dark:text-white tracking-tight leading-none">
                Chayotex
              </h1>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                {user.email?.split('@')[0]} {/* Nombre de usuario limpio */}
              </p>
            </div>
          </div>

          {/* Botón Salir */}
          <button 
            onClick={handleLogout}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95 group"
            title="Cerrar Sesión"
          >
            <LogOut size={20} className="group-hover:stroke-[2.5]" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* --- Sección 1: KPIs --- */}
        <section className="grid grid-cols-2 gap-3">
          
          {/* Tarjeta: Ventas Hoy */}
          <div className="col-span-2 bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ventas Hoy</p>
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                {formatMoney(kpis.ventasHoy)}
              </h3>
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1" /> Actividad diaria
              </p>
            </div>
            <div className="h-12 w-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Tarjeta: Por Cobrar */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-500">
                <Wallet size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Por Cobrar</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">
              {formatMoney(kpis.porCobrar)}
            </h3>
          </div>

          {/* Tarjeta: Inventario */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500">
                <Package size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">En Bodega</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">
              {kpis.inventario} <span className="text-xs font-normal text-gray-400">cajas</span>
            </h3>
          </div>
        </section>

        {/* --- Sección 2: Botones de Acción --- */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
            Operaciones
          </h2>
          <div className="grid grid-cols-2 gap-4">
            
            {/* Botón: Nueva Venta */}
            <Link href="/ventas/nueva" className="block h-full">
              <div className="group relative overflow-hidden bg-green-600 hover:bg-green-700 text-white p-5 rounded-2xl shadow-lg shadow-green-600/20 text-left transition-all active:scale-95 h-full">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Plus size={60} />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <Plus size={28} className="mb-2" />
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Nueva<br/>Venta</h3>
                    <p className="text-green-200 text-xs mt-1">Crear nota</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Botón: Registrar Entrada (Liquidación) */}
            <Link href="/liquidaciones/nueva" className="block h-full">
              <div className="group relative overflow-hidden bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-white p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-left transition-all active:scale-95 h-full">
                <div className="absolute top-0 right-0 p-3 opacity-5 dark:opacity-10 text-gray-900 dark:text-white">
                  <Truck size={60} />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <Truck size={28} className="mb-2 text-gray-600 dark:text-gray-300" />
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Entrada<br/>Merca</h3>
                    <p className="text-gray-500 text-xs mt-1">Recibir carga</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* --- Sección 3: Historial Reciente --- */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-white">Actividad Reciente</h3>
            <History size={16} className="text-gray-400" />
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {actividadReciente.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Sin movimientos recientes
              </div>
            ) : (
              actividadReciente.map((item) => (
                <Link key={item.id} href={item.url}>
                  <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        item.tipo === 'venta' 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                      }`}>
                        {item.tipo === 'venta' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.titulo}</p>
                        <p className="text-xs text-gray-500">{item.subtitulo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        item.tipo === 'venta' ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {item.tipo === 'venta' ? '+' : '-'}{formatMoney(item.monto)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {item.fecha?.toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}