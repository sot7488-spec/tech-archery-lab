"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, X, Save, UserPlus, ImagePlus, Trash2 } from "lucide-react";

import { createAthlete } from "./actions";

type Club = {
  id: string;
  name: string;
};

interface Props {
  clubs: Club[];
}

const inputClass =
  "w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/40";

export default function AthleteCreateModal({ clubs }: Props) {
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const closeModal = () => {
    setOpen(false);
    setPhotoPreview(null);
    setSuccessMessage("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setSuccessMessage("");

    startTransition(async () => {
      try {
        await createAthlete(formData);

        setSuccessMessage("Atleta guardado correctamente");

        setTimeout(() => {
          closeModal();
        }, 1200);
      } catch (error) {
        console.error(error);
        alert("Ocurrió un error al guardar el atleta");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-[1.4rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 via-slate-900 to-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/20 hover:shadow-[0_0_45px_rgba(34,211,238,0.28)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_55%)] opacity-0 transition duration-300 group-hover:opacity-100" />

        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300 transition duration-300 group-hover:bg-cyan-300 group-hover:text-slate-950">
          <Plus size={18} />
        </div>

        <div className="relative text-left">
          <p className="text-[10px] font-black tracking-[0.35em] text-cyan-300">
            TAL SYSTEM
          </p>
          <p className="mt-0.5 text-sm font-black text-white">Nuevo atleta</p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-4 backdrop-blur-xl">
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950 text-white shadow-[0_0_90px_rgba(34,211,238,0.20)]">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-80px] left-[-80px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <UserPlus size={26} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                    TAL Athlete Registry
                  </p>

                  <h2 className="mt-1 text-3xl font-black text-white">
                    Nuevo atleta
                  </h2>

                  <p className="mt-1 text-sm font-medium text-slate-400">
                    Registra los datos principales del arquero.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              action={handleSubmit}
              className="relative z-10 flex-1 overflow-y-auto px-6 py-5
                [scrollbar-width:thin]
                [scrollbar-color:rgba(34,211,238,0.65)_rgba(15,23,42,0.9)]
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-slate-900
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-cyan-400/60
                [&::-webkit-scrollbar-thumb:hover]:bg-cyan-300"
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
                <div className="rounded-[1.8rem] border border-cyan-400/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                  <label className="mb-3 block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Foto del atleta
                  </label>

                  <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Previa del atleta"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center text-slate-500">
                        <ImagePlus
                          size={42}
                          className="mb-3 text-cyan-300/70"
                        />
                        <span className="text-sm font-bold">
                          Sin fotografía
                        </span>
                        <span className="mt-1 text-xs">
                          Opcional: selecciona una imagen
                        </span>
                      </div>
                    )}
                  </div>

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950">
                    <ImagePlus size={18} />
                    Examinar foto

                    <input
                      ref={photoInputRef}
                      type="file"
                      name="photo"
                      accept="image/*"
                      className="hidden"
                      disabled={isPending}
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (!file || file.size === 0) {
                          setPhotoPreview(null);
                          return;
                        }

                        setPhotoPreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>

                  {photoPreview && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      disabled={isPending}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Quitar foto
                    </button>
                  )}

                  <p className="mt-4 text-xs leading-relaxed text-slate-500">
                    Si tu bucket de Supabase no tiene policy de carga, guarda
                    primero sin foto.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <input
                    name="name"
                    placeholder="Nombre completo"
                    className={inputClass}
                    required
                    disabled={isPending}
                  />

                  <input
                    name="email"
                    type="email"
                    placeholder="Correo electrónico"
                    className={inputClass}
                    required
                    disabled={isPending}
                  />

                  <input
                    name="curp"
                    placeholder="CURP"
                    className={inputClass}
                    disabled={isPending}
                  />

                  <input
                    name="birthdate"
                    type="date"
                    className={inputClass}
                    disabled={isPending}
                  />

                  <select
                    name="gender"
                    className={inputClass}
                    defaultValue=""
                    disabled={isPending}
                  >
                    <option value="">Género</option>
                    <option value="varonil">Varonil</option>
                    <option value="femenil">Femenil</option>
                  </select>

                  <input
                    name="category"
                    placeholder="Categoría"
                    className={inputClass}
                    disabled={isPending}
                  />

                  <select
                    name="bow_type"
                    className={inputClass}
                    defaultValue="recurvo"
                    disabled={isPending}
                  >
                    <option value="recurvo">Recurvo</option>
                    <option value="compuesto">Compuesto</option>
                    <option value="barebow">Barebow</option>
                    <option value="tradicional">Tradicional</option>
                  </select>

                  <select
                    name="dominant_hand"
                    className={inputClass}
                    defaultValue=""
                    disabled={isPending}
                  >
                    <option value="">Mano dominante</option>
                    <option value="diestro">Diestra</option>
                    <option value="zurdo">Zurda</option>
                  </select>

                  <select
                    name="club_id"
                    className={inputClass}
                    defaultValue=""
                    disabled={isPending}
                  >
                    <option value="">Sin club asignado</option>

                    {clubs?.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>

                  <input
                    name="association_id"
                    placeholder="Asociación"
                    className={inputClass}
                    disabled={isPending}
                  />

                  <input
                    name="federation_id"
                    placeholder="ID Federación"
                    className={inputClass}
                    disabled={isPending}
                  />

                  <textarea
                    name="notes"
                    placeholder="Notas"
                    rows={4}
                    disabled={isPending}
                    className="min-h-[120px] rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-3"
                  />
                </div>
              </div>

              {successMessage && (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
                  {successMessage}
                </div>
              )}

              <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-white/10 bg-slate-950/95 pt-5 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  {isPending ? "Guardando..." : "Guardar atleta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}