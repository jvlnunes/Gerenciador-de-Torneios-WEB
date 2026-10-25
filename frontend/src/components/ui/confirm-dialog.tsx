import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";
import { cn } from "@/services/utils";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm deve ser usado dentro de um <ConfirmProvider>");
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    const normalized: ConfirmOptions = typeof opts === "string" ? { message: opts } : opts;
    setOptions(normalized);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const finalizar = (resultado: boolean) => {
    resolveRef.current?.(resultado);
    resolveRef.current = null;
    setOptions(null);
    setLoading(false);
  };

  const handleConfirmar = async () => {
    setLoading(true);
    finalizar(true);
  };

  const destructive = options?.variant !== "default";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {options && (
        <ModalShell
          onClose={() => !loading && finalizar(false)}
          contentClassName="max-w-sm bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-5 text-center"
        >
          <div
            className={cn(
              "h-12 w-12 rounded-full grid place-items-center mx-auto",
              destructive ? "bg-destructive/10" : "bg-primary/10",
            )}
          >
            <AlertTriangle className={cn("h-6 w-6", destructive ? "text-destructive" : "text-primary")} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              {options.title ?? "Tem certeza?"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{options.message}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => finalizar(false)}
              disabled={loading}
              className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {options.cancelLabel ?? "Cancelar"}
            </button>
            <button
              onClick={handleConfirmar}
              disabled={loading}
              className={cn(
                "flex-1 h-10 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {options.confirmLabel ?? "Confirmar"}
            </button>
          </div>
        </ModalShell>
      )}
    </ConfirmContext.Provider>
  );
}