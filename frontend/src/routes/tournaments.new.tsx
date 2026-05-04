import { CreateTournamentForm } from "@/components/tournament/create/create-tournament-form"

export default function NewTournamentPage() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Criar Torneio
      </h1>

      <CreateTournamentForm />
    </div>
  )
}