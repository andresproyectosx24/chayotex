"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { 
  ArrowLeft, 
  Printer, 
  Loader2,
  Sprout
} from "lucide-react";

export default function DetalleLiquidacionPage({ params }) {
  const [id, setId] = useState(null);
  const [liq, setLiq] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { Promise.resolve(params).then(p => setId(p.id)); }, [params]);

  useEffect(() => {
    const fetchLiq = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "liquidaciones", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLiq({ 
            id: docSnap.id, 
            ...docSnap.data(),
            fechaDate: docSnap.data().fecha_registro?.toDate() || new Date()
          });
        } else {
          router.push("/liquidaciones");
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchLiq();
  }, [id, router]);

  const handlePrint = () => window.print();
  const formatMoney = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" /></div>;
  if (!liq) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-10 print:bg-white print:p-0">
      
      {/* Barra Acciones */}
      <div className="bg-white dark:bg-gray-800 border-b p-4 mb-6 print:hidden sticky top-0 z-20 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-green-600 flex items-center">
          <ArrowLeft size={20} className="mr-2" /> Volver
        </button>
        <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Printer size={20} /> Imprimir Recibo
        </button>
      </div>

      {/* DOCUMENTO IMPRIMIBLE */}
      <main className="max-w-[21.59cm] mx-auto bg-white p-8 md:p-12 shadow-xl print:shadow-none print:p-0 print:m-0 text-black">
        
        {/* Encabezado */}
        <div className="flex justify-between items-start border-b-2 border-green-800 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-green-700 text-white flex items-center justify-center rounded-lg print:border print:border-black print:bg-white print:text-black">
              <Sprout size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">CHAYOTES MEZA</h1>
              <p className="text-xs font-bold text-gray-500">LIQUIDACIÓN DE COMPRA</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-500">FOLIO</p>
            <p className="text-xl font-mono font-black text-red-600 print:text-black">
              #{liq.folio?.toString().padStart(4, '0') || liq.id.slice(0,6)}
            </p>
            <p className="text-xs mt-1">{liq.fechaDate.toLocaleDateString('es-MX')}</p>
          </div>
        </div>

        {/* Info Proveedor */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6 print:border-black print:bg-transparent">
          <p className="text-xs font-bold text-gray-400 uppercase">Proveedor / Agricultor</p>
          <p className="text-lg font-bold uppercase">{liq.proveedor_nombre}</p>
        </div>

        {/* DOS COLUMNAS: Entradas vs Salidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* COLUMNA 1: LO QUE SUMA (Entradas) */}
          <div>
            <h3 className="font-bold text-sm bg-green-100 text-green-800 p-2 rounded mb-2 border border-green-200 print:border-black print:bg-gray-100 print:text-black">
              (+) PRODUCTO RECIBIDO
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-1">Desc.</th>
                  <th className="text-center py-1">Cajas</th>
                  <th className="text-right py-1">$$</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {liq.items_entrada.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 print:border-gray-300">
                    <td className="py-2">{item.descripcion}</td>
                    <td className="py-2 text-center font-bold">{item.cajas}</td>
                    <td className="py-2 text-right text-gray-500">${item.precio_compra}</td>
                    <td className="py-2 text-right font-bold">{formatMoney(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-right pt-2 font-bold text-gray-500">SUBTOTAL ENTRADA:</td>
                  <td className="text-right pt-2 font-bold">{formatMoney(liq.total_mercancia)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* COLUMNA 2: LO QUE RESTA (Gastos) */}
          <div>
            <h3 className="font-bold text-sm bg-red-50 text-red-800 p-2 rounded mb-2 border border-red-100 print:border-black print:bg-gray-100 print:text-black">
              (-) DEDUCCIONES Y GASTOS
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-1">Concepto</th>
                  <th className="text-right py-1">Monto</th>
                </tr>
              </thead>
              <tbody>
                {liq.items_gastos.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 print:border-gray-300">
                    <td className="py-2 font-medium">{item.concepto}</td>
                    <td className="py-2 text-right font-bold text-red-600 print:text-black">
                      - {formatMoney(item.monto)}
                    </td>
                  </tr>
                ))}
                {liq.items_gastos.length === 0 && (
                  <tr>
                    <td colSpan="2" className="py-4 text-center text-gray-400 italic">Sin deducciones</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td className="text-right pt-2 font-bold text-gray-500">TOTAL DEDUCCIONES:</td>
                  <td className="text-right pt-2 font-bold text-red-600 print:text-black">
                    - {formatMoney(liq.total_gastos)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* RESUMEN FINAL GRANDE */}
        <div className="border-t-2 border-black pt-6 mt-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Total Mercancía</span>
                <span className="font-bold">{formatMoney(liq.total_mercancia)}</span>
              </div>
              <div className="flex justify-between text-xs text-red-600 print:text-black">
                <span>(-) Total Gastos</span>
                <span className="font-bold">- {formatMoney(liq.total_gastos)}</span>
              </div>
              <div className="border-t border-black pt-2 flex justify-between items-center text-lg">
                <span className="font-bold">A PAGAR:</span>
                <span className="font-black bg-yellow-200 print:bg-transparent px-2">
                  {formatMoney(liq.total_a_pagar)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Firmas */}
        <div className="mt-16 grid grid-cols-2 gap-10">
          <div className="text-center">
            <div className="border-b border-black mb-2 mx-4"></div>
            <p className="text-xs font-bold">CHAYOTES MEZA</p>
            <p className="text-[10px] text-gray-500">Entrega / Autoriza</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black mb-2 mx-4"></div>
            <p className="text-xs font-bold">{liq.proveedor_nombre}</p>
            <p className="text-[10px] text-gray-500">Recibe Conformidad</p>
          </div>
        </div>

      </main>

      <style jsx global>{`
        @media print {
          @page { margin: 1cm; size: letter; }
          body { background: white; -webkit-print-color-adjust: exact; }
          nav, header, .sticky { display: none !important; }
        }
      `}</style>
    </div>
  );
}