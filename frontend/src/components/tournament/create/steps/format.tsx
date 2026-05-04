export function FormatStep({ data, setData, onBack }) {
  return (
    <div className="grid gap-4">
      <select
        value={data.format}
        onChange={(e) =>
          setData({ ...data, format: e.target.value })
        }
      >
        <option value="RACHA">Racha</option>
        <option value="MATA_MATA">Mata-mata</option>
        <option value="PONTOS">Pontos corridos</option>
        <option value="HIBRIDO">Híbrido</option>
      </select>

      <button onClick={onBack}>Voltar</button>
    </div>
  )
}