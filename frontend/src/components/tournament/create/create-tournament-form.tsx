import { useState } from "react"
import { BasicInfoStep } from "./steps/basic-info"
import { FormatStep } from "./steps/format"

export function CreateTournamentForm() {
  const [step, setStep] = useState(0)

  const [data, setData] = useState({
    name: "",
    location: "",
    format: "MATA_MATA",
  })

  return (
    <div>
      {step === 0 && (
        <BasicInfoStep
          data={data}
          setData={setData}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <FormatStep
          data={data}
          setData={setData}
          onBack={() => setStep(0)}
        />
      )}
    </div>
  )
}