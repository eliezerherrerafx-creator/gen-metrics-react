import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const Login = ({ onLogin }) => {
  const auth = getAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // 🧠 Nuevo campo: nombre de usuario
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        // Crear el usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Actualizar el perfil con el nombre
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin(); // 🔥 Notifica al App.jsx que el usuario ya inició sesión
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-[#221655] p-8 rounded-2xl shadow-[0_0_25px_rgba(109,40,217,0.7)] border border-indigo-900 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 rounded-xl bg-indigo-900/50 border border-indigo-700 text-white focus:ring-1 focus:ring-emerald-400"
              required
            />
          )}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-indigo-900/50 border border-indigo-700 text-white focus:ring-1 focus:ring-emerald-400"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-indigo-900/50 border border-indigo-700 text-white focus:ring-1 focus:ring-emerald-400"
            required
          />
          {error && <p className="text-pink-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition"
          >
            {loading ? 'Cargando...' : (isRegistering ? 'Registrarme' : 'Entrar')}
          </button>
        </form>

        <p className="text-indigo-300 mt-4 text-center text-sm">
          {isRegistering ? (
            <>
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => setIsRegistering(false)}
                className="text-emerald-400 hover:underline"
              >
                Inicia sesión
              </button>
            </>
          ) : (
            <>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => setIsRegistering(true)}
                className="text-emerald-400 hover:underline"
              >
                Regístrate
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
