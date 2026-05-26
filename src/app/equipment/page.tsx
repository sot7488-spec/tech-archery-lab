import { createClient } from "@/lib/supabase/server";
import { createEquipment } from "./actions";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const supabase = await createClient();

  const { data: athletes } = await supabase.from("athlete_profiles").select(`
    id,
    users!athlete_profiles_user_id_fkey (
      name
    )
  `);

  const { data: equipment } = await supabase
    .from("equipment_profiles")
    .select(`
      *,
      athlete_profiles (
        id,
        users!athlete_profiles_user_id_fkey (
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  const inputClass =
    "h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white outline-none backdrop-blur-xl transition-all placeholder:text-slate-500 focus:border-cyan-400 focus:bg-cyan-400/[0.05] focus:ring-4 focus:ring-cyan-400/10";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="absolute inset-0 tal-grid-bg opacity-30" />
      <div className="absolute right-[-200px] top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-200px] left-[-120px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/30 p-10 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
          <div className="absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <p className="relative z-10 text-xs font-black uppercase tracking-[0.4em] text-cyan-300">
            TAL Equipment Lab
          </p>

          <h1 className="relative z-10 mt-4 text-6xl font-black tracking-tight">
            Equipamiento
            <span className="block text-cyan-300 tal-text-glow">
              Performance Lab
            </span>
          </h1>

          <p className="relative z-10 mt-4 max-w-2xl text-slate-400">
            Control técnico del arco, flechas, mira, repisa, plunger,
            estabilización y configuración de cada atleta.
          </p>
        </section>

        <form
          action={createEquipment}
          className="grid grid-cols-1 gap-5 rounded-[2.5rem] border border-cyan-400/10 bg-white/[0.03] p-8 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:grid-cols-3"
        >
          <div className="md:col-span-3">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Nueva ficha técnica
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Registrar equipo
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Crea una ficha técnica ligada a un atleta.
            </p>
          </div>

          <select name="athlete_id" className={inputClass} required>
            <option value="">Selecciona atleta</option>
            {athletes?.map((athlete: any) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.users?.name}
              </option>
            ))}
          </select>

          <input name="name" placeholder="Nombre del equipo" className={inputClass} />

          <select name="bow_type" className={inputClass} defaultValue="recurvo">
            <option value="recurvo">Recurvo</option>
            <option value="compuesto">Compuesto</option>
            <option value="tradicional">Tradicional</option>
          </select>

          <input name="bow_brand" placeholder="Marca del arco" className={inputClass} />
          <input name="bow_model" placeholder="Modelo del arco" className={inputClass} />
          <input name="bow_length_inches" type="number" placeholder="Largo arco pulgadas" className={inputClass} />

          <input name="riser_brand" placeholder="Marca riser" className={inputClass} />
          <input name="riser_model" placeholder="Modelo riser" className={inputClass} />
          <input name="riser_length_inches" type="number" placeholder="Riser pulgadas" className={inputClass} />

          <input name="limb_brand" placeholder="Marca limbs" className={inputClass} />
          <input name="limbs_model" placeholder="Modelo limbs" className={inputClass} />

          <select name="limb_length" className={inputClass} defaultValue="">
            <option value="">Tamaño limbs</option>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>

          <input name="draw_weight_lbs" type="number" step="0.1" placeholder="Libras reales" className={inputClass} />
          <input name="draw_length_inches" type="number" step="0.1" placeholder="Apertura pulgadas" className={inputClass} />
          <input name="brace_height_cm" type="number" step="0.1" placeholder="Brace height cm" className={inputClass} />

          <input name="tiller_top_cm" type="number" step="0.1" placeholder="Tiller superior cm" className={inputClass} />
          <input name="tiller_bottom_cm" type="number" step="0.1" placeholder="Tiller inferior cm" className={inputClass} />
          <input name="nocking_point_mm" type="number" step="0.1" placeholder="Nocking point mm" className={inputClass} />

          <input name="arrow_brand" placeholder="Marca flecha" className={inputClass} />
          <input name="arrow_model" placeholder="Modelo flecha" className={inputClass} />
          <input name="spine" placeholder="Spine" className={inputClass} />

          <input name="arrow_length_inches" type="number" step="0.1" placeholder="Largo flecha pulgadas" className={inputClass} />
          <input name="point_weight_grains" type="number" placeholder="Peso punta grains" className={inputClass} />

          <input name="sight_brand" placeholder="Marca mira" className={inputClass} />
          <input name="sight_model" placeholder="Modelo mira" className={inputClass} />

          <input name="rest_brand" placeholder="Marca repisa" className={inputClass} />
          <input name="rest_model" placeholder="Modelo repisa" className={inputClass} />

          <input name="plunger_brand" placeholder="Marca botón/plunger" className={inputClass} />
          <input name="plunger_model" placeholder="Modelo botón/plunger" className={inputClass} />

          <input name="stabilizer_brand" placeholder="Marca estabilizadores" className={inputClass} />
          <input name="stabilizer_setup" placeholder="Setup estabilización" className={inputClass} />

          <input name="string_material" placeholder="Material cuerda" className={inputClass} />
          <input name="string_strands" type="number" placeholder="Hilos cuerda" className={inputClass} />

          <textarea
            name="notes"
            placeholder="Notas del equipo"
            className={`${inputClass} h-28 py-4 md:col-span-3`}
            rows={3}
          />

          <button className="group relative overflow-hidden rounded-2xl bg-cyan-400 px-5 py-5 font-black text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.25)] transition-all hover:-translate-y-1 hover:bg-cyan-300 md:col-span-3">
            <span className="relative z-10">Guardar equipamiento</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-cyan-100 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </form>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {equipment?.map((item: any) => (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_0_60px_rgba(34,211,238,0.12)]"
            >
              <div className="absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-cyan-400/5 blur-3xl transition-all group-hover:bg-cyan-400/10" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{item.name}</h2>

                  <p className="mt-1 text-sm font-bold text-cyan-300">
                    {item.athlete_profiles?.users?.name || "Sin atleta"}
                  </p>
                </div>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase text-cyan-300">
                  {item.bow_type || "arco"}
                </span>
              </div>

              <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Riser</p>
                  <p className="font-black">
                    {item.riser_brand || "-"} {item.riser_model || ""}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Limbs</p>
                  <p className="font-black">
                    {item.limb_brand || "-"} {item.limbs_model || ""}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Libras</p>
                  <p className="font-black">
                    {item.draw_weight_lbs || 0} lbs
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Arco</p>
                  <p className="font-black">
                    {item.bow_length_inches || 0}&quot;
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Flecha</p>
                  <p className="font-black">
                    {item.arrow_model || "-"} / {item.spine || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Mira</p>
                  <p className="font-black">
                    {item.sight_brand || "-"} {item.sight_model || ""}
                  </p>
                </div>
              </div>
            </article>
          ))}

          {equipment?.length === 0 && (
            <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 text-slate-400">
              Aún no hay equipamiento registrado.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}