export const dynamic = "force-dynamic";
import { supabase } from "@/lib/supabase";
import { createAthlete } from "./actions";

export default async function AthletesPage() {

  const { data: athletes, error } = await supabase
    .from("athlete_profiles")
    .select(`
      *,
      users!athlete_profiles_user_id_fkey (
        name,
        email
      )
    `);

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            Atletas
          </h1>

          <p className="text-slate-500 mt-2">
            Gestión de atletas registrados.
          </p>
        </div>

      </div>

      <form
        action={createAthlete}
        className="bg-white rounded-2xl p-5 shadow mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
      >

        <input
          name="name"
          placeholder="Nombre del atleta"
          className="border rounded-xl p-3"
          required
        />

        <input
          name="email"
          placeholder="Correo"
          className="border rounded-xl p-3"
          required
        />

        <input
          name="category"
          placeholder="Categoría"
          className="border rounded-xl p-3"
        />

        <select
          name="bow_type"
          className="border rounded-xl p-3"
          defaultValue="recurvo"
        >
          <option value="recurvo">
            Recurvo
          </option>

          <option value="compuesto">
            Compuesto
          </option>

          <option value="barebow">
            Barebow
          </option>

          <option value="tradicional">
            Tradicional
          </option>
        </select>

        <select
          name="dominant_hand"
          className="border rounded-xl p-3"
          defaultValue="diestro"
        >
          <option value="diestro">
            Diestro
          </option>

          <option value="zurdo">
            Zurdo
          </option>
        </select>

        <input
          name="draw_weight_lbs"
          type="number"
          placeholder="Libras"
          className="border rounded-xl p-3"
        />

        <button className="bg-black text-white rounded-xl p-3 font-bold">
          Guardar atleta
        </button>

      </form>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-5">
          {JSON.stringify(error)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {athletes?.map((athlete) => (

          <div
            key={athlete.id}
            className="bg-white rounded-2xl shadow-sm p-5"
          >

            <div className="flex items-center justify-between mb-4">

              <div>
                <h2 className="text-xl font-bold">
                  {athlete.users?.name}
                </h2>

                <p className="text-sm text-slate-500">
                  {athlete.users?.email}
                </p>
              </div>

              <div className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm">
                {athlete.bow_type}
              </div>

            </div>

            <div className="space-y-2 text-sm">

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Categoría
                </span>

                <span className="font-medium">
                  {athlete.category || "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Libras
                </span>

                <span className="font-medium">
                  {athlete.draw_weight_lbs || "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Dominante
                </span>

                <span className="font-medium">
                  {athlete.dominant_hand || "-"}
                </span>
              </div>

            </div>

          </div>

        ))}

      </div>

    </main>
  );
}