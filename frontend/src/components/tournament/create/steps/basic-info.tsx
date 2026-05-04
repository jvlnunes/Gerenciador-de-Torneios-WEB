export function BasicInfoStep({ data, setData, onNext }) {
  return (
    <div className="grid gap-4">
      <input
        placeholder="Nome do torneio"
        value={data.name}
        onChange={(e) =>
          setData({ ...data, name: e.target.value })
        }
      />

      <input
        placeholder="Local"
        value={data.location}
        onChange={(e) =>
          setData({ ...data, location: e.target.value })
        }
      />

      <button onClick={onNext}>
        Próximo
      </button>
    </div>
  )
}