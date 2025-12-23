"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { documentId, collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, Printer, ArrowLeft, Truck, TrendingDown } from "lucide-react";

// Utilidad número a letras (reutilizada)
const numeroALetras = (amount) => {
  if (!amount) return "CERO PESOS 00/100 M.N.";
  const unidades = ["", "UN ", "DOS ", "TRES ", "CUATRO ", "CINCO ", "SEIS ", "SIETE ", "OCHO ", "NUEVE "];
  const decenas = ["", "DIEZ ", "VEINTE ", "TREINTA ", "CUARENTA ", "CINCUENTA ", "SESENTA ", "SETENTA ", "OCHENTA ", "NOVENTA "];
  const diez = ["DIEZ ", "ONCE ", "DOCE ", "TRECE ", "CATORCE ", "QUINCE ", "DIECISEIS ", "DIECISIETE ", "DIECIOCHO ", "DIECINUEVE "];
  const veintes = ["VEINTE ", "VEINTIUNO ", "VEINTIDOS ", "VEINTITRES ", "VEINTICUATRO ", "VEINTICINCO ", "VEINTISEIS ", "VEINTISIETE ", "VEINTIOCHO ", "VEINTINUEVE "];
  const centenas = ["", "CIENTO ", "DOSCIENTOS ", "TRESCIENTOS ", "CUATROCIENTOS ", "QUINIENTOS ", "SEISCIENTOS ", "SETECIENTOS ", "OCHOCIENTOS ", "NOVECIENTOS "];

  const convertGroup = (n) => {
    let output = "";
    if (n === 100) return "CIEN ";
    if (n > 99) { output += centenas[Math.floor(n / 100)]; n %= 100; }
    if (n < 10) { output += unidades[n]; }
    else if (n < 20) { output += diez[n - 10]; }
    else if (n < 30) { output += veintes[n - 20]; }
    else {
      output += decenas[Math.floor(n / 10)];
      if (n % 10 !== 0) output += "Y " + unidades[n % 10];
    }
    return output;
  };

  const val = parseFloat(amount).toFixed(2);
  const enteros = Math.floor(val);
  const centavos = Math.round((val - enteros) * 100);
  
  let letras = "";
  if (enteros === 0) letras = "CERO ";
  else if (enteros > 999999) letras = "MUCHOS ";
  else {
    const miles = Math.floor(enteros / 1000);
    const resto = enteros % 1000;
    if (miles === 1) letras += "UN MIL ";
    else if (miles > 1) letras += convertGroup(miles) + "MIL ";
    if (resto > 0) letras += convertGroup(resto);
  }

  return `${letras}PESOS ${centavos.toString().padStart(2, '0')}/100 M.N.`.trim();
};

export default function ImprimirLiquidacionesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      const idsParam = searchParams.get("ids");
      if (!idsParam) return;
      const ids = idsParam.split(",");
      if (ids.length === 0) return;

      try {
        const q = query(collection(db, "liquidaciones"), where(documentId(), "in", ids));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fechaDate: doc.data().fecha_registro?.toDate() || new Date()
        }));
        setItems(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [searchParams]);

  const handlePrint = () => window.print();

  // Duplicar para Original y Copia
  const itemsImpresion = items.flatMap((item) => [
    { ...item, _key: `${item.id}_orig`, _tipo: "ORIGINAL" },
    { ...item, _key: `${item.id}_copia`, _tipo: "COPIA" }
  ]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      
      {/* Toolbar */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-green-600">
          <ArrowLeft className="mr-2" size={20} /> Volver
        </button>
        <button onClick={handlePrint} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 flex items-center gap-2">
          <Printer size={20} /> Imprimir Hoja
        </button>
      </div>

      {/* LIENZO DE IMPRESIÓN */}
      <div className="max-w-[21.59cm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none">
        
        {/* GRID ADAPTADO PARA LIQUIDACIONES */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-x-8 print:gap-y-8 p-4 print:p-0">
          {itemsImpresion.map((liq) => {
             const day = liq.fechaDate.getDate().toString().padStart(2, '0');
             const month = (liq.fechaDate.getMonth() + 1).toString().padStart(2, '0');
             const year = liq.fechaDate.getFullYear();

             return (
              <div 
                key={liq._key} 
                className="relative p-2 border border-gray-300 print:border-black h-[8cm] flex flex-col justify-between rounded-md" 
              >
                {/* --- CONTENIDO --- */}
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-1 pb-1 border-b border-black">
                    <div>
                      <h2 className="font-black text-xs uppercase tracking-tighter leading-none">CHAYOTES MEZA</h2>
                      <p className="text-[7px] text-gray-600 font-medium">LIQUIDACIÓN DE COMPRA</p>
                    </div>
                    <div className="text-right leading-none flex flex-col items-end">
                      <div className="flex gap-2 text-[6px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        <span>{day}/{month}/{year}</span>
                      </div>
                      <p className="text-sm font-black text-red-600 print:text-black tracking-widest">
                        FOLIO: {liq.folio?.toString().padStart(4, '0') || liq.id.slice(0,4)}
                      </p>
                    </div>
                  </div>

                  {/* Proveedor */}
                  <div className="mb-1">
                    <span className="text-[6px] font-bold text-gray-400 uppercase">PROVEEDOR: </span>
                    <span className="font-bold text-[10px] uppercase">{liq.proveedor_nombre}</span>
                  </div>

                  {/* GRID INTERNO: ENTRADAS vs GASTOS */}
                  <div className="flex gap-2 h-[3.5cm] overflow-hidden">
                    
                    {/* Tabla Izquierda: Entradas (Más ancha) */}
                    <div className="flex-1 border-r border-gray-200 print:border-gray-400 pr-1">
                      <p className="text-[6px] font-bold bg-green-50 text-green-800 print:bg-gray-100 print:text-black text-center mb-0.5 rounded">ENTRADAS</p>
                      <table className="w-full text-[7px] leading-tight">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="text-left">Prod</th>
                            <th className="text-center">Caj</th>
                            <th className="text-right">$$</th>
                            <th className="text-right">Tot</th>
                          </tr>
                        </thead>
                        <tbody>
                          {liq.items_entrada.slice(0, 6).map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="truncate max-w-[50px]">{item.descripcion.split(' ')[0]}</td>
                              <td className="text-center font-bold">{item.cajas}</td>
                              <td className="text-right">{item.precio_compra}</td>
                              <td className="text-right font-bold">{item.subtotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Tabla Derecha: Gastos (Más angosta) */}
                    <div className="w-1/3">
                      <p className="text-[6px] font-bold bg-red-50 text-red-800 print:bg-gray-100 print:text-black text-center mb-0.5 rounded">DEDUCCIONES</p>
                      <table className="w-full text-[7px] leading-tight">
                        <tbody>
                          {liq.items_gastos.slice(0, 5).map((gasto, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="truncate max-w-[40px]">{gasto.concepto}</td>
                              <td className="text-right font-bold">-{gasto.monto}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-black">
                            <td className="font-bold text-[6px]">T. GASTOS</td>
                            <td className="text-right font-bold">-{liq.total_gastos}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-1 border-t border-black">
                  <div className="flex items-end justify-between gap-2">
                    
                    {/* Importe con Letra */}
                    <div className="flex-1 text-left pr-2">
                      <p className="text-[6px] font-bold uppercase text-gray-500">Importe con letra</p>
                      <p className="text-[7px] font-bold uppercase leading-tight border-b border-black/20 pb-0.5 w-full truncate">
                        {numeroALetras(liq.total_a_pagar)}
                      </p>
                      <p className="text-[6px] text-gray-400 mt-0.5">Recibí de conformidad el pago neto.</p>
                    </div>

                    {/* Total Final */}
                    <div className="text-right leading-none shrink-0 bg-gray-100 print:bg-transparent px-1 rounded">
                      <p className="text-[6px] font-bold text-gray-500 uppercase">A PAGAR</p>
                      <p className="text-sm font-black">
                        ${liq.total_a_pagar.toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 0.5cm; size: letter; }
          body { background: white; -webkit-print-color-adjust: exact; }
          nav, header, .fixed { display: none !important; }
          .print\:p-0 { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}