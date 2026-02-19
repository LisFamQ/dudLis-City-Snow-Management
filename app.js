const districts = [
  "Центр",
  "Северный",
  "Промзона",
  "Речной",
  "Вокзал",
  "Парковый",
  "Южный",
  "Новый квартал",
];

const state = {
  day: 1,
  hour: 6,
  budget: 500,
  population: 12000,
  trucks: 3,
  depotLevel: 1,
  priorityMainRoads: 60,
  satisfaction: 72,
  weather: "Лёгкий снег",
  snowIntensity: 1,
  saltStock: 100,
  events: ["Город готов к зимнему дню."],
  districtData: districts.map((name) => ({
    name,
    snow: randomInt(20, 45),
    traffic: randomInt(25, 55),
    happiness: randomInt(60, 85),
  })),
};

const ui = {
  topStats: document.getElementById("topStats"),
  cityGrid: document.getElementById("cityGrid"),
  events: document.getElementById("events"),
  leaderboard: document.getElementById("leaderboard"),
  weatherText: document.getElementById("weatherText"),
  priorityRange: document.getElementById("priorityRange"),
  priorityValue: document.getElementById("priorityValue"),
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function logEvent(text) {
  state.events.unshift(`[День ${state.day}, ${String(state.hour).padStart(2, "0")}:00] ${text}`);
  state.events = state.events.slice(0, 18);
}

function weatherTick() {
  const roll = Math.random();
  if (roll < 0.1) {
    state.weather = "Метель";
    state.snowIntensity = 4;
  } else if (roll < 0.3) {
    state.weather = "Сильный снег";
    state.snowIntensity = 3;
  } else if (roll < 0.65) {
    state.weather = "Лёгкий снег";
    state.snowIntensity = 1;
  } else {
    state.weather = "Мороз без осадков";
    state.snowIntensity = 0;
  }
}

function simulationStep() {
  state.hour += 1;
  if (state.hour >= 24) {
    state.hour = 0;
    state.day += 1;
    state.budget += Math.round(state.population * 0.02);
  }

  if (state.hour % 3 === 0) {
    weatherTick();
  }

  const cleaningPower = state.trucks * 5 + state.depotLevel * 2 + state.priorityMainRoads / 25;

  let citySnowAvg = 0;
  let cityTrafficAvg = 0;
  let cityHappinessAvg = 0;

  state.districtData.forEach((d) => {
    d.snow += state.snowIntensity * randomInt(1, 4);
    d.snow -= cleaningPower * (0.6 + Math.random() * 0.6);

    if (state.weather === "Мороз без осадков" && d.snow > 35) {
      d.traffic += 2;
    }

    if (state.saltStock > 0 && d.snow > 40) {
      d.snow -= 3;
      state.saltStock -= 0.3;
    }

    d.snow = clamp(d.snow, 0, 100);

    d.traffic += d.snow * 0.05 - (state.priorityMainRoads / 100) * 1.5;
    d.traffic = clamp(d.traffic, 5, 100);

    d.happiness += (45 - d.snow) * 0.03 - (d.traffic - 35) * 0.02;
    d.happiness = clamp(d.happiness, 0, 100);

    citySnowAvg += d.snow;
    cityTrafficAvg += d.traffic;
    cityHappinessAvg += d.happiness;
  });

  citySnowAvg /= state.districtData.length;
  cityTrafficAvg /= state.districtData.length;
  cityHappinessAvg /= state.districtData.length;

  state.satisfaction = Math.round(cityHappinessAvg);

  state.budget -= Math.round(state.trucks * 3 + state.depotLevel * 2 + state.snowIntensity * 2);

  if (citySnowAvg > 55 && Math.random() < 0.4) {
    logEvent("Жалобы жителей: дороги плохо очищены, вырос риск ДТП.");
    state.satisfaction -= 2;
  }
  if (cityTrafficAvg > 70 && Math.random() < 0.3) {
    logEvent("Пробки мешают коммунальным службам — мусоровозы задерживаются.");
    state.satisfaction -= 1;
  }
  if (state.weather === "Метель" && Math.random() < 0.45) {
    logEvent("Экстренное предупреждение: метель усилилась.");
  }
  if (state.budget < 0 && Math.random() < 0.5) {
    logEvent("Казначейство: дефицит бюджета! Требуются меры оптимизации.");
    state.satisfaction -= 2;
  }

  state.satisfaction = clamp(state.satisfaction, 0, 100);
  state.saltStock = clamp(state.saltStock, 0, 200);

  render();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function render() {
  ui.topStats.innerHTML = "";
  [
    ["День/время", `${state.day} / ${String(state.hour).padStart(2, "0")}:00`],
    ["Бюджет", `₽${Math.round(state.budget)}`],
    ["Население", state.population.toLocaleString("ru-RU")],
    ["Удовлетворённость", `${state.satisfaction}%`],
    ["Снегоуборщики", state.trucks],
    ["Склад реагента", `${Math.round(state.saltStock)} ед.`],
  ].forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `<div class="stat-label">${label}</div><div class="stat-value">${value}</div>`;
    ui.topStats.appendChild(card);
  });

  ui.weatherText.textContent = `${state.weather} · интенсивность: ${state.snowIntensity}`;

  ui.cityGrid.innerHTML = "";
  state.districtData.forEach((d) => {
    const el = document.createElement("article");
    el.className = "district";
    el.innerHTML = `
      <h4>${d.name}</h4>
      <div>Снег: ${Math.round(d.snow)}%</div>
      <div class="bar"><div class="fill snow" style="width:${d.snow}%"></div></div>
      <div>Пробки: ${Math.round(d.traffic)}%</div>
      <div class="bar"><div class="fill traffic" style="width:${d.traffic}%"></div></div>
      <div>Настроение: ${Math.round(d.happiness)}%</div>
      <div class="bar"><div class="fill happy" style="width:${d.happiness}%"></div></div>
    `;
    ui.cityGrid.appendChild(el);
  });

  ui.events.innerHTML = "";
  state.events.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    ui.events.appendChild(li);
  });

  renderLeaderboard();
}

function renderLeaderboard() {
  const bots = [
    { name: "Nordhaven", skill: 0.9 },
    { name: "Polarburg", skill: 1.05 },
    { name: "Icepoint", skill: 0.95 },
  ];

  const yourScore = Math.max(0, Math.round(state.satisfaction * 10 + state.budget / 12 - state.day * 2));
  const board = [
    { name: "Вы · dudLis City", score: yourScore },
    ...bots.map((b) => ({
      name: b.name,
      score: Math.max(0, Math.round((60 + state.day * 3) * b.skill + randomInt(-20, 20))),
    })),
  ].sort((a, b) => b.score - a.score);

  ui.leaderboard.innerHTML = "";
  board.forEach((row) => {
    const li = document.createElement("li");
    li.textContent = `${row.name}: ${row.score}`;
    ui.leaderboard.appendChild(li);
  });
}

// controls

document.getElementById("buyTruckBtn").addEventListener("click", () => {
  if (state.budget < 120) return logEvent("Недостаточно средств на покупку техники.");
  state.budget -= 120;
  state.trucks += 1;
  logEvent("Закуплен новый снегоуборщик.");
  render();
});

document.getElementById("upgradeDepotBtn").addEventListener("click", () => {
  if (state.budget < 220) return logEvent("Недостаточно средств для расширения депо.");
  state.budget -= 220;
  state.depotLevel += 1;
  state.saltStock += 40;
  logEvent("Депо расширено, увеличены ресурсы на маршруты.");
  render();
});

document.getElementById("boostHeatingBtn").addEventListener("click", () => {
  if (state.budget < 90) return logEvent("Бюджет не позволяет включить экстренное отопление.");
  state.budget -= 90;
  state.satisfaction = clamp(state.satisfaction + 5, 0, 100);
  logEvent("Экстренное отопление стабилизировало жалобы жителей.");
  render();
});

document.getElementById("saltBtn").addEventListener("click", () => {
  if (state.budget < 60) return logEvent("Недостаточно средств на закупку реагента.");
  state.budget -= 60;
  state.saltStock = clamp(state.saltStock + 50, 0, 200);
  logEvent("Закуплена партия реагента.");
  render();
});

document.getElementById("forceStormBtn").addEventListener("click", () => {
  state.weather = "Метель";
  state.snowIntensity = 5;
  logEvent("Тестовый сценарий: принудительная метель.");
  render();
});

ui.priorityRange.addEventListener("input", (e) => {
  state.priorityMainRoads = Number(e.target.value);
  ui.priorityValue.textContent = `${state.priorityMainRoads}%`;
});

render();
setInterval(simulationStep, 1300);
