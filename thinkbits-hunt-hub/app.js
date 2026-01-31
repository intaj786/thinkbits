/* Think Bits Hunt Hub — front-end only, localStorage persistence
   Edit riddles: data/riddles.json
*/
const STORAGE_KEY = "thinkbits_hunt_state_v1";
const ADMIN_PIN = "thinkbits"; // change if you want

const els = {
  teamForm: document.getElementById("teamForm"),
  teamName: document.getElementById("teamName"),
  teamList: document.getElementById("teamList"),
  teamCount: document.getElementById("teamCount"),

  activeTeamLabel: document.getElementById("activeTeamLabel"),
  activeTeamMeta: document.getElementById("activeTeamMeta"),
  chipStep: document.getElementById("chipStep"),
  chipProgress: document.getElementById("chipProgress"),

  riddleTitle: document.getElementById("riddleTitle"),
  riddleClue: document.getElementById("riddleClue"),

  binaryInput: document.getElementById("binaryInput"),
  textInput: document.getElementById("textInput"),
  btnDecode: document.getElementById("btnDecode"),
  btnCheck: document.getElementById("btnCheck"),
  btnNext: document.getElementById("btnNext"),

  toast: document.getElementById("toast"),
  scoreboard: document.getElementById("scoreboard"),

  btnFullscreen: document.getElementById("btnFullscreen"),
  btnRules: document.getElementById("btnRules"),
  rulesModal: document.getElementById("rulesModal"),
  btnCloseRules: document.getElementById("btnCloseRules"),

  btnAdmin: document.getElementById("btnAdmin"),
  adminModal: document.getElementById("adminModal"),
  btnCloseAdmin: document.getElementById("btnCloseAdmin"),
  adminPin: document.getElementById("adminPin"),
  btnReset: document.getElementById("btnReset"),
  btnExport: document.getElementById("btnExport"),
};

let RIDDLES = [];
let state = {
  teams: {}, // { [teamId]: { id, name, stepIndex, unlocked, history: [{stepIndex, at}] } }
  order: [], // list of teamIds
  activeTeamId: null,
  loadedAt: Date.now(),
};

function uid(){
  return Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
}

function normalizeTeamName(name){
  return name.trim().replace(/\s+/g, " ").toUpperCase();
}

function toast(msg, type=""){
  els.toast.textContent = msg;
  els.toast.className = "toast" + (type ? " " + type : "");
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{
      state = JSON.parse(raw);
    }catch(e){
      console.warn("State parse failed, resetting.", e);
    }
  }
}

function getActiveTeam(){
  if(!state.activeTeamId) return null;
  return state.teams[state.activeTeamId] || null;
}

function stepCount(){ return RIDDLES.length; }

function currentRiddle(team){
  if(!team) return null;
  const i = Math.min(team.stepIndex, RIDDLES.length - 1);
  return RIDDLES[i] || null;
}

function renderTeams(){
  const ids = state.order.slice();
  els.teamList.innerHTML = "";
  ids.forEach(id => {
    const t = state.teams[id];
    if(!t) return;
    const li = document.createElement("li");
    li.className = "teamItem" + (id === state.activeTeamId ? " active" : "");
    li.dataset.teamId = id;

    const left = document.createElement("div");
    left.className = "teamName";
    left.textContent = t.name;

    const right = document.createElement("div");
    right.className = "teamStep";
    const done = Math.min(t.stepIndex, stepCount());
    right.textContent = `Step ${done}/${stepCount()}`;

    li.appendChild(left);
    li.appendChild(right);

    li.addEventListener("click", () => {
      state.activeTeamId = id;
      save();
      render();
    });

    els.teamList.appendChild(li);
  });

  els.teamCount.textContent = `${ids.length} team(s) registered`;
}

function renderScoreboard(){
  const rows = state.order
    .map(id => state.teams[id])
    .filter(Boolean)
    .sort((a,b) => b.stepIndex - a.stepIndex || a.name.localeCompare(b.name));

  els.scoreboard.innerHTML = "";
  if(rows.length === 0){
    els.scoreboard.innerHTML = '<div class="hint">No teams yet. Register to start.</div>';
    return;
  }

  rows.forEach(t => {
    const div = document.createElement("div");
    div.className = "scoreRow";
    const left = document.createElement("b");
    left.textContent = t.name;
    const right = document.createElement("span");
    right.textContent = `${Math.min(t.stepIndex, stepCount())}/${stepCount()} solved`;
    div.appendChild(left);
    div.appendChild(right);
    els.scoreboard.appendChild(div);
  });
}

function renderMain(){
  const team = getActiveTeam();
  els.btnCheck.disabled = !team;
  els.btnNext.disabled = true;

  if(!team){
    els.activeTeamLabel.textContent = "No team selected";
    els.activeTeamMeta.textContent = "Register a team, then tap it on the left.";
    els.chipStep.textContent = "Step —";
    els.chipProgress.textContent = "Progress —";
    els.riddleTitle.textContent = "Waiting…";
    els.riddleClue.textContent = "Select a team to generate the first riddle.";
    return;
  }

  const step = Math.min(team.stepIndex, stepCount()-1);
  const r = currentRiddle(team);

  els.activeTeamLabel.textContent = team.name;
  els.activeTeamMeta.textContent = "Enter the decoded result to unlock the next clue.";
  els.chipStep.textContent = `Step ${step+1}`;
  els.chipProgress.textContent = `Solved ${Math.min(team.stepIndex, stepCount())}/${stepCount()}`;

  if(team.stepIndex >= stepCount()){
    els.riddleTitle.textContent = "Completed";
    els.riddleClue.textContent = "This team has finished all riddles. 🎉";
    els.btnCheck.disabled = true;
    els.btnNext.disabled = true;
    return;
  }

  els.riddleTitle.textContent = r.title || `Riddle ${step+1}`;
  els.riddleClue.textContent = r.clue;

  // if current step already unlocked, allow next
  const unlocked = !!team.unlocked?.[team.stepIndex];
  els.btnNext.disabled = !unlocked;
}

function render(){
  renderTeams();
  renderScoreboard();
  renderMain();
}

function decodeBinaryToText(binaryStr){
  const cleaned = (binaryStr || "").trim();
  if(!cleaned) return "";

  // split by whitespace, commas, pipes
  const parts = cleaned.split(/[\s,|]+/).filter(Boolean);

  // if a single long chunk, try split into 7 or 8-bit groups
  if(parts.length === 1 && parts[0].length > 8){
    const chunk = parts[0].replace(/[^01]/g, "");
    const groups = [];
    // Prefer 8-bit groups if divisible by 8, else 7-bit if divisible by 7
    const size = (chunk.length % 8 === 0) ? 8 : ((chunk.length % 7 === 0) ? 7 : 8);
    for(let i=0;i<chunk.length;i+=size){
      groups.push(chunk.slice(i, i+size));
    }
    return groups.map(b => String.fromCharCode(parseInt(b,2))).join("");
  }

  // normal multi-part decode
  const chars = parts.map(p => {
    const b = p.replace(/[^01]/g, "");
    if(!b) return "";
    return String.fromCharCode(parseInt(b,2));
  });
  return chars.join("");
}

function expectedAnswer(riddle){
  // compare in a forgiving way (trim, uppercase)
  return (riddle.expected || "").toString().trim().toUpperCase();
}

function markUnlocked(team){
  team.unlocked = team.unlocked || {};
  team.unlocked[team.stepIndex] = true;
  team.history = team.history || [];
  team.history.push({ stepIndex: team.stepIndex, at: Date.now() });
}

function nextStep(team){
  team.stepIndex += 1;
  // clear inputs for next clue
  els.binaryInput.value = "";
  els.textInput.value = "";
}

async function loadRiddles(){
  const res = await fetch("data/riddles.json");
  const data = await res.json();
  RIDDLES = Array.isArray(data) ? data : (data.riddles || []);
  if(!Array.isArray(RIDDLES) || RIDDLES.length === 0){
    throw new Error("No riddles found in data/riddles.json");
  }
}

function registerTeam(nameRaw){
  const name = normalizeTeamName(nameRaw);
  if(!name) return { ok:false, msg:"Type a team name first." };

  // unique
  const exists = Object.values(state.teams).some(t => t.name === name);
  if(exists) return { ok:false, msg:"That team name is already registered. Use another name." };

  const id = uid();
  state.teams[id] = { id, name, stepIndex: 0, unlocked: {}, history: [] };
  state.order.unshift(id); // newest on top
  state.activeTeamId = id;
  save();
  return { ok:true, msg:`Registered: ${name}` };
}

function requireAdmin(){
  const pin = (els.adminPin.value || "").trim();
  if(pin !== ADMIN_PIN){
    toast("Wrong PIN.", "bad");
    return false;
  }
  return true;
}

function download(filename, text){
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* Events */
els.teamForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const res = registerTeam(els.teamName.value);
  if(res.ok){
    els.teamName.value = "";
    toast(res.msg, "good");
    render();
  }else{
    toast(res.msg, "warn");
  }
});

els.btnDecode.addEventListener("click", () => {
  const t = decodeBinaryToText(els.binaryInput.value);
  if(t){
    els.textInput.value = t.trim();
    toast(`Decoded: "${t}"`, "good");
  }else{
    toast("Paste some binary first (or just type the decoded text).", "warn");
  }
});

function checkAnswer(){
  const team = getActiveTeam();
  if(!team) return;

  const r = currentRiddle(team);
  if(!r) return;

  // auto-decode if they pasted binary and left text empty
  const binary = els.binaryInput.value.trim();
  if(binary && !els.textInput.value.trim()){
    const dec = decodeBinaryToText(binary);
    els.textInput.value = dec.trim();
  }

  const got = (els.textInput.value || "").trim().toUpperCase();
  const exp = expectedAnswer(r);

  if(!got){
    toast("Enter the decoded result first.", "warn");
    return;
  }

  // allow “close enough” for words (ignore extra spaces)
  const gotNorm = got.replace(/\s+/g, " ");
  const expNorm = exp.replace(/\s+/g, " ");

  if(gotNorm === expNorm){
    markUnlocked(team);
    toast("Correct — unlocked ✅", "good");
    els.btnNext.disabled = false;
    save();
    renderMain();
  }else{
    toast("Not matched. Try again.", "bad");
  }
}

els.btnCheck.addEventListener("click", () => checkAnswer());

els.btnNext.addEventListener("click", () => {
  const team = getActiveTeam();
  if(!team) return;

  const unlocked = !!team.unlocked?.[team.stepIndex];
  if(!unlocked){
    toast("Unlock the current riddle first.", "warn");
    return;
  }

  nextStep(team);
  save();
  toast("Next riddle generated.", "good");
  render();
});

els.textInput.addEventListener("input", () => {
  const team = getActiveTeam();
  if(!team) return;
  // enable check only when some input present
  els.btnCheck.disabled = !els.textInput.value.trim();
});

els.binaryInput.addEventListener("input", () => {
  const team = getActiveTeam();
  if(!team) return;
  if(els.binaryInput.value.trim()){
    els.btnCheck.disabled = false;
  }
});

els.btnFullscreen.addEventListener("click", async () => {
  try{
    if(!document.fullscreenElement){
      await document.documentElement.requestFullscreen();
    }else{
      await document.exitFullscreen();
    }
  }catch(e){
    toast("Fullscreen blocked by browser.", "warn");
  }
});

els.btnRules.addEventListener("click", () => els.rulesModal.showModal());
els.btnCloseRules.addEventListener("click", () => els.rulesModal.close());

els.btnAdmin.addEventListener("click", () => els.adminModal.showModal());
els.btnCloseAdmin.addEventListener("click", () => els.adminModal.close());

els.btnReset.addEventListener("click", () => {
  if(!requireAdmin()) return;
  if(!confirm("Reset ALL teams and progress?")) return;
  state = { teams: {}, order: [], activeTeamId: null, loadedAt: Date.now() };
  save();
  toast("Reset done.", "good");
  render();
});

els.btnExport.addEventListener("click", () => {
  if(!requireAdmin()) return;
  download("thinkbits_hunt_export.json", JSON.stringify(state, null, 2));
  toast("Exported JSON.", "good");
});

/* Init */
(async function init(){
  try{
    await loadRiddles();
  }catch(e){
    console.error(e);
    toast("Could not load riddles.json. Run via a local server (not file://).", "bad");
    return;
  }
  load();
  render();
  toast("Ready. Register a team to start.", "");
})();
