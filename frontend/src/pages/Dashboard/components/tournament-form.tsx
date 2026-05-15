import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type Torneio } from "@/services/api";

interface Props {
  initial?: Torneio;
  onDone: (t: Torneio) => void;
}

export function TournamentForm({ initial, onDone }: Props) {
  const [name, setName] = useState(initial?.nome ?? "");
  const [description, setDescription] = useState(initial?.descricao ?? "");
  const [location, setLocation] = useState(initial?.local ?? "");
  const [startDate, setStartDate] = useState(initial?.dataInicio?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(initial?.dataFim?.slice(0, 10) ?? "");
  // const [maxTeams, setMaxTeams] = useState<number>(initial?.maxTeams ?? 8);
  const [status, setStatus] = useState<NonNullable<Torneio["status"]>>(initial?.status ?? "RASCUNHO");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { nome: name, descricao: description, local: location, dataInicio: startDate, dataFim: endDate, status };
      const t = initial
        ? await api.atualizarTorneio(initial.id, payload)
        : await api.criarTorneio(payload);
      onDone(t);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome do torneio *</Label>
        <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="Copa de Verão 2026" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="desc">Descrição</Label>
        <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Regras, premiação, observações…" rows={3} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="loc">Local</Label>
          <Input id="loc" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ginásio Municipal" />
        </div>
        {/* <div className="grid gap-2">
          <Label htmlFor="max">Máx. de times</Label>
          <Input id="max" type="number" min={2} value={maxTeams} onChange={e => setMaxTeams(Number(e.target.value))} />
        </div> */}
        <div className="grid gap-2">
          <Label htmlFor="start">Data de início</Label>
          <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end">Data de término</Label>
          <Input id="end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Rascunho</SelectItem>
            <SelectItem value="OPEN">Inscrições abertas</SelectItem>
            <SelectItem value="ONGOING">Em andamento</SelectItem>
            <SelectItem value="FINISHED">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? "Salvando…" : initial ? "Salvar alterações" : "Criar torneio"}
        </Button>
      </div>
    </form>
  );
}
