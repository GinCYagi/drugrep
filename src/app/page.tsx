'use client'
import { useState } from 'react'

export default function Home() {
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  const [route, setRoute] = useState('oral')

  const calculateRisk = () => {
    let score = 0

    // 仮ロジック（後で本質を詰める）
    if (drug.toLowerCase().includes('dxm')) score += 30
    if (route === 'rectum') score += 20
    if (Number(dose) > 100) score += 20

    return score
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Drug Risk Checker (Prototype)</h1>

      <div>
        <input
          placeholder="drug (e.g. DXM)"
          value={drug}
          onChange={(e) => setDrug(e.target.value)}
        />
      </div>

      <div>
        <input
          placeholder="dose (mg)"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
        />
      </div>

      <div>
        <select value={route} onChange={(e) => setRoute(e.target.value)}>
          <option value="oral">oral</option>
          <option value="rectum">rectum</option>
          <option value="sniff">sniff</option>
        </select>
      </div>

      <h2>Risk Score: {calculateRisk()}</h2>
    </main>
  )
}