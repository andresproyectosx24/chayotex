"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { documentId, collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, Printer, ArrowLeft } from "lucide-react";

// ... (numeroALetras utility igual que antes)
const numeroALetras = (amount) => {
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

function ImprimirVentasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVentas = async () => {
      const idsParam = searchParams.get("ids");
      if (!idsParam) return;

      const ids = idsParam.split(",");
      if (ids.length === 0) return;

      try {
        const q = query(collection(db, "ventas"), where(documentId(), "in", ids));
        const snapshot = await getDocs(q);
        
        const ventasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fechaDate: doc.data().fecha?.toDate() || new Date()
        }));

        setVentas(ventasData);
      } catch (error) {
        console.error("Error fetching ventas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, [searchParams]);

  const handlePrint = () => window.print();

  const ventasImpresion = ventas.flatMap((venta) => [
    { ...venta, _key: `${venta.id}_orig`, _tipo: "ORIGINAL" },
    { ...venta, _key: `${venta.id}_copia`, _tipo: "COPIA" }
  ]);

  const getFolio = (venta) => {
    if (venta.folio) {
      return venta.folio.toString().padStart(4, '0');
    }
    return venta.id.slice(0, 6).toUpperCase();
  };

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

      {/* LIENZO */}
      <div className="max-w-[21.59cm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none">
        
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-x-8 print:gap-y-8 p-4 print:p-0">
          {ventasImpresion.map((venta) => {
             const day = venta.fechaDate.getDate().toString().padStart(2, '0');
             const month = (venta.fechaDate.getMonth() + 1).toString().padStart(2, '0');
             const year = venta.fechaDate.getFullYear();

             return (
              <div 
                key={venta._key} 
                className="relative p-2 border border-gray-300 print:border-black h-[8cm] flex flex-col justify-between rounded-md" 
              >
                {/* CONTENIDO */}
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-1 pb-1 border-b border-black">
                    <div>
                      <h2 className="font-black text-sm uppercase tracking-tighter leading-none">CHAYOTES MEZA</h2>
                      <p className="text-[7px] text-gray-600 font-medium">Bodega G-45, Central de Abastos</p>
                    </div>
                    <div className="text-right leading-none flex flex-col items-end">
                      <div className="flex gap-3 text-[6px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        <span>Día</span>
                        <span>Mes</span>
                        <span>Año</span>
                      </div>
                      <p className="text-sm font-black print:text-black tracking-widest border border-black px-1 rounded-sm">
                        {day} &nbsp;|&nbsp; {month} &nbsp;|&nbsp; {year}
                      </p>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="mb-1 flex justify-between items-baseline">
                    <span className="font-bold text-[10px] truncate max-w-[60%]">{venta.cliente_nombre}</span>
                    <div className="text-right">
                      <span className="text-[6px] font-bold text-gray-400 mr-1">FOLIO</span>
                      <span className="text-[10px] font-black font-mono text-red-600 print:text-black">
                        {getFolio(venta)}
                      </span>
                    </div>
                  </div>

                  {/* Tabla */}
                  <table className="w-full text-[8px] mb-1">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="text-left py-0.5">Cant</th>
                        <th className="text-left py-0.5">Desc</th>
                        <th className="text-right py-0.5">$$</th>
                        <th className="text-right py-0.5">Total</th>
                      </tr>
                    </thead>
                    <tbody className="leading-tight">
                      {venta.items.slice(0, 5).map((item, idx) => ( 
                        <tr key={idx} className="border-b border-gray-100 print:border-gray-200">
                          <td className="py-0.5 font-bold">{item.cajas}</td>
                          <td className="py-0.5 truncate max-w-[100px]">{item.descripcion}</td>
                          <td className="py-0.5 text-right">{item.precio_unitario}</td>
                          <td className="py-0.5 text-right font-bold">{item.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="mt-auto">
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex-1 text-left pr-2">
                      <p className="text-[6px] font-bold uppercase text-gray-500">Importe con letra</p>
                      <p className="text-[7px] font-bold uppercase leading-tight border-b border-black/20 pb-0.5 w-full truncate">
                        {numeroALetras(venta.total)}
                      </p>
                      <p className="text-[6px] text-gray-400 mt-0.5 leading-tight">
                        Pagaré incondicional a la orden de CHAYOTES MEZA.
                      </p>
                    </div>
                    <div className="text-right leading-none shrink-0">
                      <p className="text-[7px] font-medium">Total</p>
                      <p className="text-base font-black">
                        ${venta.total.toLocaleString('es-MX')}
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
          body { background: white; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          nav, .fixed, header { display: none !important; }
          .print\:p-0 { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

// EXPORTAMOS WRAPPER
export default function ImprimirLotePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Cargando...</div>}>
      <ImprimirVentasContent />
    </Suspense>
  );
}