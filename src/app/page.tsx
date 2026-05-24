export const dynamic = "force-dynamic";

import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data: clubs } = await supabase.from("clubs").select("*");

  const { data: users } = await supabase.from("users").select("*");

  const { data: athletes } = await supabase
    .from("athlete_profiles")
    .select("*");

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("*");

  const totalClubs = clubs?.length || 0;
  const totalUsers = users?.length || 0;
  const totalAthletes = athletes?.length || 0;
  const totalSessions = sessions?.length || 0;

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Tech Archery Lab
        </h1>
        <p className="text-slate-500 mt-2">
          Dashboard general de clubes, atletas y entrenamientos.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-slate-500 text-sm">Clubes</p>
          <h2 className="text-4xl font-bold">{totalClubs}</h2>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-slate-500 text-sm">Usuarios</p>
          <h2 className="text-4xl font-bold">{totalUsers}</h2>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-slate-500 text-sm">Atletas</p>
          <h2 className="text-4xl font-bold">{totalAthletes}</h2>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-slate-500 text-sm">Entrenamientos</p>
          <h2 className="text-4xl font-bold">{totalSessions}</h2>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow">
          <h3 className="text-xl font-bold mb-4">Clubes registrados</h3>

          <div className="space-y-3">
            {clubs?.map((club) => (
              <div
                key={club.id}
                className="border rounded-xl p-4 flex justify-between"
              >
                <div>
                  <p className="font-bold">{club.name}</p>
                  <p className="text-sm text-slate-500">
                    {club.city}, {club.state}
                  </p>
                </div>

                <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full h-fit">
                  Activo
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow">
          <h3 className="text-xl font-bold mb-4">Resumen del sistema</h3>

          <div className="space-y-4">
            <div className="border rounded-xl p-4">
              <p className="text-sm text-slate-500">Estado</p>
              <p className="font-bold text-green-600">
                Conectado correctamente a Supabase
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="text-sm text-slate-500">Base de datos</p>
              <p className="font-bold">PostgreSQL / Supabase</p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="text-sm text-slate-500">Siguiente módulo</p>
              <p className="font-bold">Gestión de atletas</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}