import { getObjectifsMois } from "@/lib/actions/objectif-mois-ops-dev";
import ObjectifMoisForm from "./ObjectifMoisForm";
import DeleteObjectifButton from "./DeleteObjectifButton";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => new Date(d).toLocaleDateString("fr-FR");
const iso = (d: Date) => new Date(d).toISOString().slice(0, 10);
const Actions = ({ o }: { o: { id: string; objectif: string; description: string | null; startDate: Date; endDate: Date } }) => (
  <div className="flex items-center gap-1">
    <ObjectifMoisForm initial={{ id: o.id, objectif: o.objectif, description: o.description ?? "", startDate: iso(o.startDate), endDate: iso(o.endDate) }} />
    <DeleteObjectifButton id={o.id} label={o.objectif} />
  </div>
);
const duree = (a: Date, b: Date) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1;

export default async function ObjectifsMoisPage() {
  const objectifs = await getObjectifsMois();

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-black text-white p-5 sm:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Objectifs</h1>
          <p className="text-sm text-gray-300">Définissez vos objectifs et leur période.</p>
        </div>
        <ObjectifMoisForm />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Objectifs créés <span className="text-gray-500 text-sm">({objectifs.length})</span>
        </h2>

        {objectifs.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-gray-500">
            Aucun objectif pour le moment.
          </p>
        ) 
        : 
        (
          <>
            <div className="grid gap-3 md:hidden">
              {objectifs.map((o) => (
                <div key={o.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{o.objectif}</p>
                    <Actions o={o} />
                  </div>
                  {o.description && <p className="mt-1 text-sm text-gray-600 line-clamp-2">{o.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
                      {fmt(o.startDate)} → {fmt(o.endDate)}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1">{duree(o.startDate, o.endDate)} j</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Par {o.User.firstName} {o.User.lastName}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="p-3">Objectif</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Début</th>
                    <th className="p-3">Fin</th>
                    <th className="p-3">Durée</th>
                    <th className="p-3">Créé par</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {objectifs.map((o) => (
                    <tr key={o.id} className="border-t hover:bg-amber-50/40">
                      <td className="p-3 font-medium">{o.objectif}</td>
                      <td className="p-3 max-w-xs truncate text-gray-600" title={o.description ?? ""}>
                        {o.description || "—"}
                      </td>
                      <td className="p-3">{fmt(o.startDate)}</td>
                      <td className="p-3">{fmt(o.endDate)}</td>
                      <td className="p-3">{duree(o.startDate, o.endDate)} j</td>
                      <td className="p-3">{o.User.firstName} {o.User.lastName}</td>
                      <td className="p-3"><div className="flex justify-end"><Actions o={o} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
