export const dynamic = "force-dynamic";

import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("clubs")
    .select("*");

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">Tech Archery Lab</h1>

      <pre>{JSON.stringify(data, null, 2)}</pre>
      <pre className="text-red-500">{JSON.stringify(error, null, 2)}</pre>
    </main>
  );
}