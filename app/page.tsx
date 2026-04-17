'use client'
import { useState } from 'react'
import { calculateRisk } from '@/src/lib/rules/calculate-risk'

export default function Home() {
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  const [route, setRoute] = useState('oral')

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
          <option value="nasal">nasal</option>
          <option value="rectal">rectal</option>
        </select>
      </div>

      <h2>Risk Score: {calculateRisk(drug, dose, route)}</h2>
    </main>
  )
}