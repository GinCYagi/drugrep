function calculate() {
  const input = document.getElementById("input").value;

  let score = 100;

  if (input.includes("過量")) score -= 50;
  if (input.includes("不明")) score -= 20;

  document.getElementById("result").innerText = "スコア: " + score;
}
const drugs = [
  {
    name: "DXM",
    dose: 108,
    risks: { serotonin: 2, cns: 1 }
  },
  {
    name: "MAOI",
    dose: 300,
    risks: { serotonin: 3, cns: 0 }
  }
];

function calc(drugs) {
  let score = 0;

  drugs.forEach(d => {
    score += d.risks.serotonin * 2;
  });

  if (drugs.some(d => d.name === "DXM") &&
      drugs.some(d => d.name === "MAOI")) {
    score += 10;
  }

  return score;
}

document.body.innerText = calc(drugs);