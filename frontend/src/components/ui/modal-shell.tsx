import { cn } from "@/services/utils";

interface ModalShellProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Alinhamento vertical do conteúdo dentro do backdrop. */
  align?: "center" | "start" | "end";
  /** Classe extra pro backdrop (ex: overflow-y-auto, py-8, blur diferente). */
  backdropClassName?: string;
  /** Classe extra pro container do conteúdo (largura, padding, etc). */
  contentClassName?: string;
}

export function ModalShell({
  onClose,
  children,
  align = "center",
  backdropClassName,
  contentClassName,
}: ModalShellProps) {
  const alignClass =
    align === "start" ? "items-start" : align === "end" ? "items-end" : "items-center";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm px-4",
        alignClass,
        backdropClassName,
      )}
      onClick={onClose}
    >
      <div
        className={cn("w-full", contentClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}