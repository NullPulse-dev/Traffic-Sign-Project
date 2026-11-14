// ================= 1. UI & TAB LOGIC =================
const tabTitles = {
    dashboard: { title: "Live Dashboard", sub: "Real-time traffic monitoring and hazard detection." },
    analytics: { title: "System Analytics", sub: "Deep dive into model performance metrics." },
    dataset: { title: "Dataset Viewer", sub: "GTSRB Dataset categories." },
    logs: { title: "Decision Logs", sub: "Complete history of actions." },
    architecture: { title: "System Architecture", sub: "Pipeline visualization." },
    settings: { title: "Model Settings", sub: "Manage parameters." },
    about: { title: "About Project", sub: "Research abstract." },
    profile: { title: "Admin Profile", sub: "System user details." }
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    document.getElementById('page-title').innerText = tabTitles[tabId].title;
    document.getElementById('page-subtitle').innerText = tabTitles[tabId].sub;
    document.getElementById('sidebar').classList.remove('open');
}

document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ================= 2. CHARTS =================
const greenPrimary = '#22c55e';
const greenLight = 'rgba(34, 197, 94, 0.2)';
const textColor = '#a1a1aa';
const gridColor = '#1a1a1a';

new Chart(document.getElementById('barChart').getContext('2d'), {
    type: 'bar',
    data: { labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score'], datasets: [{ label: 'Performance (%)', data: [98.5, 97.2, 96.8, 97.0], backgroundColor: greenPrimary, borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { display: false }, ticks: { color: textColor } } } }
});

new Chart(document.getElementById('lossChart').getContext('2d'), {
    type: 'line',
    data: { labels: ['E1', 'E5', 'E10', 'E15', 'E20'], datasets: [{ label: 'Train', data: [0.8, 0.5, 0.3, 0.15, 0.08], borderColor: greenPrimary, fill: true, backgroundColor: greenLight, tension: 0.4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } }, scales: { y: { grid: { color: gridColor }, ticks: { color: textColor } }, x: { display: false, ticks: { color: textColor } } } }
});

new Chart(document.getElementById('doughnutChart').getContext('2d'), {
    type: 'doughnut',
    data: { labels: ['Speed', 'Stop', 'Mandatory', 'Info'], datasets: [{ data: [40, 30, 20, 10], backgroundColor: [greenPrimary, '#ef4444', '#eab308', '#3b82f6'], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: textColor } } } }
});

// ================= 3. GTA ENGINE =================
const entityContainer = document.getElementById('entity-container');
const tlTop = document.getElementById('tl-top');
const tlBottom = document.getElementById('tl-bottom');
const btnSpawnPark = document.getElementById('btn-spawn-park');

let stateTop = 'green';
let stateBottom = 'green';

let cars = []; 
let pedestrians = [];
let isBreakdown = false;
let animationId;

// Detailed Top-Down Cars
const carSVG = `
<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="80" height="160" rx="15" fill="rgba(0,0,0,0.4)" transform="translate(5,5)"/>
    <rect x="5" y="40" width="15" height="25" rx="5" fill="#111" />
    <rect x="80" y="40" width="15" height="25" rx="5" fill="#111" />
    <rect x="5" y="135" width="15" height="25" rx="5" fill="#111" />
    <rect x="80" y="135" width="15" height="25" rx="5" fill="#111" />
    <rect x="10" y="20" width="80" height="160" rx="15" fill="VAR_COLOR" stroke="#111" stroke-width="2"/>
    <rect x="20" y="65" width="60" height="70" fill="VAR_COLOR_DARK" rx="5"/>
    <rect x="30" y="75" width="40" height="30" rx="3" fill="#1a202c" opacity="0.8"/>
    <path d="M20 40 Q50 30 80 40 L80 55 L20 55 Z" fill="#1a202c" opacity="0.8"/>
    <path d="M20 145 L80 145 L80 160 Q50 170 20 160 Z" fill="#1a202c" opacity="0.8"/>
    <rect x="5" y="60" width="5" height="10" fill="VAR_COLOR_DARK"/>
    <rect x="90" y="60" width="5" height="10" fill="VAR_COLOR_DARK"/>
    <rect x="15" y="175" width="15" height="8" rx="2" fill="#fff" class="headlight"/>
    <rect x="70" y="175" width="15" height="8" rx="2" fill="#fff" class="headlight"/>
    <rect x="15" y="15" width="15" height="8" rx="2" fill="#ef4444" class="taillight"/>
    <rect x="70" y="15" width="15" height="8" rx="2" fill="#ef4444" class="taillight"/>
</svg>
`;

const towSVG = `
<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="80" height="160" rx="10" fill="rgba(0,0,0,0.4)" transform="translate(5,5)"/>
    <rect x="5" y="40" width="15" height="25" rx="5" fill="#111" />
    <rect x="80" y="40" width="15" height="25" rx="5" fill="#111" />
    <rect x="5" y="135" width="15" height="25" rx="5" fill="#111" />
    <rect x="80" y="135" width="15" height="25" rx="5" fill="#111" />
    <rect x="10" y="20" width="80" height="120" fill="#f59e0b" stroke="#111" stroke-width="2"/>
    <rect x="15" y="140" width="70" height="40" rx="5" fill="#f59e0b" stroke="#111" stroke-width="2"/>
    <rect x="20" y="150" width="60" height="20" rx="3" fill="#1a202c" opacity="0.8"/>
    <text x="50" y="110" font-size="16" fill="#111" font-weight="bold" text-anchor="middle" transform="rotate(90 50 110)">TOW</text>
</svg>
`;

const policeSVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="60" rx="20" ry="30" fill="rgba(0,0,0,0.4)"/>
    <rect x="30" y="40" width="40" height="40" rx="10" fill="#1e3a8a" stroke="#111" stroke-width="2"/>
    <circle cx="50" cy="30" r="15" fill="#111"/>
    <rect x="40" y="15" width="20" height="10" fill="#111" rx="2"/>
    <rect x="15" y="45" width="15" height="8" rx="4" fill="#1e3a8a" class="arm-wave"/>
    <rect x="70" y="45" width="15" height="8" rx="4" fill="#1e3a8a" class="arm-wave"/>
</svg>
`;

const humanSVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="60" rx="15" ry="25" fill="rgba(0,0,0,0.4)"/>
    <rect x="35" y="40" width="30" height="35" rx="8" fill="#f8fafc" stroke="#111" stroke-width="2"/>
    <circle cx="50" cy="30" r="12" fill="#fcd34d"/>
</svg>
`;

function spawnCar() {
    if (isBreakdown) return;

    const isGoingDown = Math.random() > 0.5;
    const carEl = document.createElement('div');
    carEl.className = 'dynamic-entity';
    
    const colors = [
        { main: '#ef4444', dark: '#991b1b' },
        { main: '#3b82f6', dark: '#1e3a8a' },
        { main: '#22c55e', dark: '#166534' },
        { main: '#eab308', dark: '#854d0e' },
        { main: '#f8fafc', dark: '#94a3b8' }
    ];
    const color = colors[Math.floor(Math.random()*colors.length)];
    
    carEl.innerHTML = carSVG.replace(/VAR_COLOR_DARK/g, color.dark).replace(/VAR_COLOR/g, color.main);
    
    if (isGoingDown) {
        carEl.style.left = '35%'; 
        carEl.style.top = '-10%';
    } else {
        carEl.style.left = '60%'; 
        carEl.style.top = '110%';
        carEl.style.transform = 'rotate(180deg)';
    }
    
    entityContainer.appendChild(carEl);
    
    const carObj = { el: carEl, progress: isGoingDown ? 0 : 100, speed: 0.6 + Math.random() * 0.4, isGoingDown: isGoingDown, stopped: false };
    cars.push(carObj);
}

function spawnPedestrian() {
    const isLeft = Math.random() > 0.5;
    const pedEl = document.createElement('div');
    pedEl.className = 'dynamic-entity human-walk';
    
    pedEl.innerHTML = humanSVG;
    
    if (isLeft) {
        pedEl.style.left = '5%';
        pedEl.style.top = '110%';
    } else {
        pedEl.style.left = '85%';
        pedEl.style.top = '-10%';
    }
    
    entityContainer.appendChild(pedEl);
    
    const pedObj = { el: pedEl, progress: isLeft ? 100 : 0, speed: 0.3 + Math.random() * 0.2, isLeft: isLeft };
    pedestrians.push(pedObj);
}

function updateScene() {
    cars.forEach(car => {
        let canMove = true;

        if (car.isGoingDown) {
            if (stateTop === 'red' && car.progress > 20 && car.progress < 30) canMove = false;
            if (isBreakdown && car.progress > 40 && car.progress < 55) canMove = false;
        } else {
            if (stateBottom === 'red' && car.progress < 80 && car.progress > 70) canMove = false;
        }

        const carsAhead = cars.filter(c => c.isGoingDown === car.isGoingDown && c !== car && c.el.style.left === car.el.style.left);
        carsAhead.forEach(ahead => {
            if (car.isGoingDown && car.progress > ahead.progress - 18 && car.progress < ahead.progress) canMove = false;
            if (!car.isGoingDown && car.progress < ahead.progress + 18 && car.progress > ahead.progress) canMove = false;
        });

        if (canMove && !car.stopped) {
            car.progress += car.isGoingDown ? car.speed : -car.speed;
            car.el.querySelectorAll('.taillight').forEach(el => el.classList.remove('hazard-light'));
        } else {
            car.el.querySelectorAll('.taillight').forEach(el => el.classList.add('hazard-light'));
        }

        car.el.style.top = `${car.progress}%`;
        
        if ((car.isGoingDown && car.progress > 110) || (!car.isGoingDown && car.progress < -10)) {
            car.el.remove();
            car.removeMe = true;
        }
    });
    cars = cars.filter(c => !c.removeMe);

    pedestrians.forEach(ped => {
        ped.progress += ped.isLeft ? -ped.speed : ped.speed;
        ped.el.style.top = `${ped.progress}%`;
        if ((ped.isLeft && ped.progress < -10) || (!ped.isLeft && ped.progress > 110)) {
            ped.el.remove();
            ped.removeMe = true;
        }
    });
    pedestrians = pedestrians.filter(p => !p.removeMe);

    animationId = requestAnimationFrame(updateScene);
}

function cycleTopLight() {
    if (isBreakdown) {
        stateTop = 'red'; updateLightUI(tlTop, stateTop);
        setTimeout(cycleTopLight, 1000); return;
    }
    if (stateTop === 'green') { stateTop = 'yellow'; setTimeout(cycleTopLight, 2000); }
    else if (stateTop === 'yellow') { stateTop = 'red'; setTimeout(cycleTopLight, 6000); }
    else { stateTop = 'green'; setTimeout(cycleTopLight, 8000); }
    updateLightUI(tlTop, stateTop);
}
function cycleBottomLight() {
    if (stateBottom === 'green') { stateBottom = 'yellow'; setTimeout(cycleBottomLight, 2000); }
    else if (stateBottom === 'yellow') { stateBottom = 'red'; setTimeout(cycleBottomLight, 6000); }
    else { stateBottom = 'green'; setTimeout(cycleBottomLight, 8000); }
    updateLightUI(tlBottom, stateBottom);
}
function updateLightUI(el, state) {
    el.querySelector('.red').classList.remove('active');
    el.querySelector('.yellow').classList.remove('active');
    el.querySelector('.green').classList.remove('active');
    el.querySelector(`.${state}`).classList.add('active');
}

// ================= 4. BREAKDOWN SEQUENCE =================
btnSpawnPark.addEventListener('click', () => {
    if (isBreakdown) return;
    isBreakdown = true;
    addLog("Anomaly", "Vehicle Breakdown", "Hazard Lights ON", "99.9%");

    const carEl = document.createElement('div');
    carEl.className = 'dynamic-entity';
    carEl.style.left = '35%';
    carEl.style.top = '40%';
    carEl.innerHTML = carSVG.replace(/VAR_COLOR_DARK/g, '#7f1d1d').replace(/VAR_COLOR/g, '#ef4444');
    entityContainer.appendChild(carEl);
    carEl.querySelectorAll('.taillight').forEach(el => el.classList.add('hazard-light'));
    
    const brokenCar = { el: carEl, progress: 40, speed: 0, isGoingDown: true, stopped: true };
    cars.push(brokenCar);

    setTimeout(() => {
        addLog("Human", "Driver Exited", "Checking Engine", "---");
        const driverEl = document.createElement('div');
        driverEl.className = 'dynamic-entity human-walk';
        driverEl.style.left = '22%'; 
        driverEl.style.top = '40%';
        driverEl.style.transform = 'scale(0.6)';
        driverEl.innerHTML = humanSVG;
        entityContainer.appendChild(driverEl);

        setTimeout(() => {
            addLog("Police", "Officer Arrived", "Directing Traffic", "99.9%");
            const policeEl = document.createElement('div');
            policeEl.className = 'dynamic-entity';
            policeEl.style.left = '24%'; 
            policeEl.style.top = '45%';
            policeEl.style.transform = 'scale(0.8)';
            policeEl.innerHTML = policeSVG;
            entityContainer.appendChild(policeEl);

            setTimeout(() => {
                addLog("Dispatch", "Tow Truck Arrived", "Hooking up", "---");
                const towEl = document.createElement('div');
                towEl.className = 'dynamic-entity';
                towEl.style.left = '35%'; 
                towEl.style.top = '0%'; 
                towEl.style.zIndex = '4';
                towEl.innerHTML = towSVG;
                entityContainer.appendChild(towEl);

                let towProgress = 0;
                let towInterval = setInterval(() => {
                    towProgress += 1;
                    towEl.style.top = `${towProgress}%`;

                    if (towProgress >= 25) { 
                        clearInterval(towInterval);
                        addLog("System", "Vehicle Towed", "Road Cleared", "---");
                        
                        driverEl.remove();
                        policeEl.remove();

                        let awayProgress = 25;
                        let awayInterval = setInterval(() => {
                            awayProgress -= 1;
                            towEl.style.top = `${awayProgress}%`;
                            carEl.style.top = `${awayProgress + 15}%`; 
                            carEl.style.left = '35%'; 
                            
                            if (awayProgress <= -20) { 
                                clearInterval(awayInterval);
                                towEl.remove();
                                carEl.remove();
                                cars = cars.filter(c => c.el !== carEl && c.el !== towEl);
                                isBreakdown = false;
                                addLog("System", "Simulation Reset", "Normal Flow Resumed", "OK");
                            }
                        }, 30);
                    }
                }, 20);
            }, 2000);
        }, 2000);
    }, 1000);
});

// ================= 5. SMART AI DETECTION (ENTIRE ROAD) =================
const btnDetect = document.getElementById('btn-detect');
const boundingBox = document.getElementById('bounding-box');
const boxLabel = document.getElementById('box-label');
const scanner = document.getElementById('scanner');
const decisionSign = document.getElementById('decision-sign');
const decisionConfidence = document.getElementById('decision-confidence');
const decisionAction = document.getElementById('decision-action');
const actionCard = document.getElementById('action-card');
const inferenceTime = document.getElementById('inference-time');

btnDetect.addEventListener('click', () => {
    boundingBox.style.display = 'none';
    actionCard.style.display = 'none';
    scanner.style.display = 'block';
    btnDetect.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Scanning...';
    btnDetect.style.opacity = '0.8';

    setTimeout(() => {
        let detectedObj = { name: 'Empty Road', conf: '99.9%', action: 'Proceed', boxTop: '40%', boxLeft: '40%', width: '80px', height: '80px' };

        if (isBreakdown) {
            // Priority 1: Broken Vehicle / Hazard
            detectedObj = { name: 'Broken Vehicle / Hazard', conf: '99.9%', action: 'Stop / Reroute', boxTop: '35%', boxLeft: '30%', width: '80px', height: '100px' };
        } else {
            // Create a list of ALL possible targets currently on screen
            let possibleTargets = [];

            // 1. Add Active Vehicles to targets
            const activeCars = cars.filter(c => c.progress > 20 && c.progress < 80);
            activeCars.forEach(car => {
                possibleTargets.push({ 
                    type: 'Vehicle', 
                    conf: (95 + Math.random() * 4).toFixed(1) + '%', 
                    action: 'Maintain Safe Distance', 
                    boxTop: `${car.progress - 5}%`, 
                    boxLeft: car.el.style.left, 
                    width: '60px', height: '100px' 
                });
            });

            // 2. Add Active Pedestrians to targets
            const activePeds = pedestrians.filter(p => p.progress > 20 && p.progress < 80);
            activePeds.forEach(ped => {
                possibleTargets.push({ 
                    type: 'Pedestrian Crossing', 
                    conf: (92 + Math.random() * 5).toFixed(1) + '%', 
                    action: 'Yield / Slow Down', 
                    boxTop: `${ped.progress - 5}%`, 
                    boxLeft: ped.el.style.left, 
                    width: '50px', height: '50px' 
                });
            });

            // 3. Add Traffic Light if it's Red
            if (stateTop === 'red') {
                possibleTargets.push({ name: 'Red Traffic Light', conf: '99.5%', action: 'Apply Brakes', boxTop: '20%', boxLeft: '44%', width: '30px', height: '60px' });
            }

            // 4. Add Static Road Sign
            possibleTargets.push({ name: 'Speed Limit 60', conf: '98.6%', action: 'Maintain Speed', boxTop: '45%', boxLeft: '8%', width: '60px', height: '60px' });

            // Pick one random target from the list
            if (possibleTargets.length > 0) {
                const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                
                // If it's a vehicle or pedestrian, we need to set the name based on type
                detectedObj = {
                    name: target.type || target.name,
                    conf: target.conf,
                    action: target.action,
                    boxTop: target.boxTop,
                    boxLeft: target.boxLeft,
                    width: target.width,
                    height: target.height
                };
            }
        }

        boundingBox.style.display = 'block';
        boundingBox.style.top = detectedObj.boxTop;
        boundingBox.style.left = detectedObj.boxLeft;
        boundingBox.style.width = detectedObj.width;
        boundingBox.style.height = detectedObj.height;
        boxLabel.innerText = `${detectedObj.name}: ${detectedObj.conf}`;

        decisionSign.innerText = detectedObj.name;
        decisionConfidence.innerText = detectedObj.conf;
        decisionAction.innerText = detectedObj.action;
        actionCard.style.display = 'block';

        const time = (Math.random() * (25 - 10) + 10).toFixed(1);
        inferenceTime.innerText = `${time} ms`;
        addLog("Vision System", detectedObj.name, detectedObj.action, detectedObj.conf);

        scanner.style.display = 'none';
        btnDetect.innerHTML = '<i class="fa-solid fa-play mr-2"></i> Run AI Detection';
        btnDetect.style.opacity = '1';

    }, 1500);
});

function addLog(module, event, action, conf) {
    const now = new Date().toLocaleTimeString();
    const miniLogs = document.getElementById('mini-logs');
    const fullLogs = document.getElementById('full-logs');
    
    const miniEntry = document.createElement('div');
    miniEntry.className = "log-entry";
    miniEntry.innerHTML = `<span>${event}</span><span class="text-green-500 font-bold">${conf}</span>`;
    miniLogs.prepend(miniEntry);
    if (miniLogs.children.length > 4) miniLogs.lastElementChild.remove();

    const fullRow = document.createElement('tr');
    fullRow.innerHTML = `<td class="font-mono text-xs text-gray-500">${now}</td><td>${module}</td><td class="text-white font-bold">${event}</td><td class="text-green-500">${conf}</td><td class="text-yellow-500">${action}</td>`;
    fullLogs.prepend(fullRow);
}

// ================= 6. INIT =================
setInterval(spawnCar, 2500);
setInterval(spawnPedestrian, 4000);
updateScene();
cycleTopLight();
cycleBottomLight();