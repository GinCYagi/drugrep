function calculate() {
  const input = document.getElementById("input").value;

  let score = 100;

  if (input.includes("過量")) score -= 50;
  if (input.includes("不明")) score -= 20;

  document.getElementById("result").innerText = "スコア: " + score;
}