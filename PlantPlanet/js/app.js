/* PlantPlanet - app.js */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('planet-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let waterLevel = 50;
  let oxygenLevel = 20;
  let plantCount = 10;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 惑星本体
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;

    // 宇宙背景の星
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 30; i++) {
      const sx = (Math.sin(i * 99) * 0.5 + 0.5) * canvas.width;
      const sy = (Math.cos(i * 33) * 0.5 + 0.5) * canvas.height;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // 惑星の海・土
    const grad = ctx.createRadialGradient(centerX - 40, centerY - 40, 20, centerX, centerY, radius);
    grad.addColorStop(0, '#22c55e');
    grad.addColorStop(0.7, '#15803d');
    grad.addColorStop(1, '#0f172a');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // 大気オーラ
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
    ctx.stroke();

    // 植物の点
    ctx.fillStyle = '#4ade80';
    for (let i = 0; i < plantCount; i++) {
      const angle = (i / plantCount) * Math.PI * 2;
      const px = centerX + Math.cos(angle) * (radius - 15);
      const py = centerY + Math.sin(angle) * (radius - 15);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  document.getElementById('btn-water')?.addEventListener('click', () => {
    waterLevel = Math.min(100, waterLevel + 10);
    plantCount += 5;
    oxygenLevel = Math.min(100, oxygenLevel + 4);
    updateStats();
    draw();
  });

  document.getElementById('btn-sun')?.addEventListener('click', () => {
    plantCount = Math.min(200, plantCount + 8);
    oxygenLevel = Math.min(100, oxygenLevel + 6);
    updateStats();
    draw();
  });

  function updateStats() {
    const elWater = document.getElementById('stat-water');
    const elO2 = document.getElementById('stat-o2');
    const elPlants = document.getElementById('stat-plants');
    if (elWater) elWater.textContent = `${waterLevel}%`;
    if (elO2) elO2.textContent = `${oxygenLevel}%`;
    if (elPlants) elPlants.textContent = `${plantCount} 本`;
  }

  draw();
  updateStats();
});
