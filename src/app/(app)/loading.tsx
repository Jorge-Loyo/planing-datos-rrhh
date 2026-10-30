import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <Spinner className="h-6 w-6" />
        <span className="text-sm">Cargando...</span>
      </div>
    </div>
  );
}
