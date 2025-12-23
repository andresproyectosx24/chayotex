"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { User, Lock, Loader2, Sprout } from "lucide-react"; // Agregué Sprout para el logo

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      } else {
        setError("Ocurrió un error inesperado. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 p-6 transition-colors duration-500">
      
      <div className="w-full max-w-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-8 sm:p-10 space-y-8 transition-all duration-300">
        
        {/* Encabezado con Identidad de Marca */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-600 text-white shadow-lg shadow-green-600/30 mb-2">
            <Sprout size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Bienvenido a Chayotex
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Ingresa a tu panel de gestión
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Mensaje de Error Animado */}
          {error && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-100 dark:border-red-800/50 flex items-center justify-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Input Correo */}
            <div className="group space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-wider">Correo</label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                  placeholder="ejemplo@chayotex.com"
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div className="group space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Botón de Ingreso */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-green-600/20 hover:shadow-green-600/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                <span>Entrando...</span>
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">
            Sistema de Gestión Agrícola v1.0
          </p>
        </div>
      </div>
    </div>
  );
}