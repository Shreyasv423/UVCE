// js/main.js
// UVCE Assist - static demo JS
const STORAGE_KEY = 'uvce_assist_demo_v1';

// ----------------- Demo dataset -----------------
const demo = {
  user: { name: 'Rahul Kumar', branch: 'CSE', semester: 5, credits: 84 },
  attendance: [
    { id: 's1', subject: 'Data Structures', present: 18, total: 20 },
    { id: 's2', subject: 'DBMS', present: 14, total: 20 },
  ],
  cia: [
    { id: 'c1', subject: 'Data Structures', cia1: 18, cia2: 16, cia3: 19 },
    { id: 'c2', subject: 'DBMS', cia1: 12, cia2: 15, cia3: 13 },
  ],
  notes: [
    { id: 'n1', title: 'Data Structures - Unit1', tag: 'Notes', uploader: 'Student', time: Date.now() - 3600*1000 },
    { id: 'n2', title: 'DBMS Lab Manual', tag: 'Lab Manual', uploader: 'Lab Coordinator', time: Date.now() - 3*24*3600*1000 },
  ],
  placements: [
    { id: 'p1', company: 'Microsoft', role: 'SDE-1', avg: '20 LPA', highest: '48 LPA', difficulty: 'Hard', note: 'DSA + System Design' },
    { id: 'p2', company: 'Wipro', role: 'Developer', avg: '6 LPA', highest: '10 LPA', difficulty: 'Easy', note: 'Aptitude + Basic DS' },
  ]
};

// ----------------- storage helpers -----------------
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    return JSON.parse(JSON.stringify(demo));
  }
  return JSON.parse(raw);
}
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ----------------- UI helpers & render -----------------
const state = loadState();

const ui = {
  init() {
    document.getElementById('userName').innerText = state.user.name;
    document.getElementById('credits').innerText = `${state.user.credits} / 180`;
    this.renderOverview();
    this.renderActivity();
    this.renderAttendance();
    this.renderCia();
    this.renderNotes();
    this.renderPlacement();
    // open dashboard on click
    document.getElementById('openDashboard').addEventListener('click', ()=> location.hash = '');
    // show dashboard by default
    this.showSection('dashboard');
  },
  showSection(id) {
    // hide all sections
    ['dashboard','attendance','cia','notes','placement','ai'].forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.add('hidden');
    });
    const show = document.getElementById(id);
    if (show) show.classList.remove('hidden');
    // scroll to top of main
    window.scrollTo({top:0,behavior:'smooth'});
    if (id === 'dashboard') this.renderOverview();
  },
  renderOverview() {
    // attendance percent total average
    const att = state.attendance;
    if (att.length === 0) {
      document.getElementById('attendancePercent').innerText = '--%';
    } else {
      const sumPercent = att.reduce((acc,s)=> acc + (s.present/s.total*100), 0);
      const avg = Math.round(sumPercent / att.length);
      document.getElementById('attendancePercent').innerText = `${avg}%`;
    }
    // CIA percent - avg of cia averages
    const ciaList = state.cia;
    if (ciaList.length === 0) document.getElementById('ciaPercent').innerText = '--%';
    else {
      const avgCia = Math.round(ciaList.reduce((acc,s)=> acc + ((s.cia1+s.cia2+s.cia3)/3),0) / ciaList.length);
      document.getElementById('ciaPercent').innerText = `${avgCia}%`;
    }
  },
  renderActivity() {
    const container = document.getElementById('activityList');
    container.innerHTML = '';
    // show latest 3 activities from notes + placements
    const notes = state.notes.slice().sort((a,b)=> b.time - a.time);
    notes.slice(0,3).forEach(n=>{
      const card = document.createElement('div');
      card.className = 'card flex items-center gap-3';
      card.innerHTML = `<div class="p-2 bg-green-100 rounded-lg text-green-800">📄</div><div><div class="font-medium">${n.title}</div><div class="text-xs text-gray-500">${n.uploader} • ${timeAgo(n.time)}</div></div>`;
      container.appendChild(card);
    });
  },
  renderAttendance() {
    const list = document.getElementById('attendanceList');
    list.innerHTML = '';
    if (state.attendance.length === 0) {
      list.innerHTML = `<div class="text-center text-gray-500">No subjects added yet. Click Add Subject.</div>`;
      return;
    }
    state.attendance.forEach(s=>{
      const percent = Math.round(s.present / Math.max(1,s.total) * 100);
      const card = document.createElement('div');
      card.className = 'card flex items-center justify-between';
      card.innerHTML = `<div>
          <div class="font-semibold">${s.subject}</div>
          <div class="text-sm text-gray-500">${s.present} / ${s.total} classes</div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold">${percent}%</div>
          <div class="text-xs ${percent>=75?'text-green-600':'text-red-600'}">${percent>=75? 'Safe':'Shortage'}</div>
          <div class="text-xs text-gray-400">Need ${classesToBeSafe(s)} classes to be safe</div>
        </div>
      `;
      list.appendChild(card);
    });
  },
  openAddAttendance() {
    const html = `
      <h4 class="text-lg font-semibold mb-2">Add Subject Attendance</h4>
      <div>
        <label class="block text-sm text-gray-600">Subject name</label>
        <input id="attSub" class="w-full border rounded px-3 py-2 mt-1" placeholder="Data Structures"/>
        <div class="grid grid-cols-2 gap-2 mt-3">
          <div><label class="text-sm text-gray-600">Present</label><input id="attPres" type="number" class="w-full border rounded px-3 py-2" value="0"/></div>
          <div><label class="text-sm text-gray-600">Total</label><input id="attTot" type="number" class="w-full border rounded px-3 py-2" value="0"/></div>
        </div>
        <div class="mt-4 text-right"><button class="px-4 py-2 rounded bg-blue-600 text-white" onclick="ui.addAttendance()">Add</button></div>
      </div>
    `;
    this.showModal(html);
  },
  addAttendance() {
    const name = document.getElementById('attSub').value.trim();
    const present = parseInt(document.getElementById('attPres').value || 0);
    const total = parseInt(document.getElementById('attTot').value || 0);
    if (!name || total < 0) return alert('Enter subject & total classes');
    state.attendance.push({ id: 's' + Date.now(), subject: name, present, total });
    saveState(state);
    this.closeModal(); this.renderAttendance(); this.renderOverview(); this.renderActivity();
  },
  renderCia() {
    const list = document.getElementById('ciaList');
    list.innerHTML = '';
    if (state.cia.length === 0) {
      list.innerHTML = `<div class="text-center text-gray-500">No CIA subjects added. Click Add Subject CIA.</div>`;
      return;
    }
    state.cia.forEach(s=>{
      const avgCia = Math.round((s.cia1 + s.cia2 + s.cia3) / 3);
      const predicted = predictFinalFromCias(avgCia); // demo formula
      const requiredEndSem = requiredEndSemToPass(avgCia);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<div class="flex justify-between"><div class="font-semibold">${s.subject}</div><div class="text-sm text-gray-500">CIA Avg: ${avgCia}%</div></div>
        <div class="mt-2">Predicted final (demo): <span class="font-bold">${predicted}%</span></div>
        <div class="text-xs text-gray-400 mt-1">Estimated required in end-sem to reach pass: <strong>${requiredEndSem}%</strong></div>
      `;
      list.appendChild(card);
    });
  },
  openAddCia() {
    const html = `
      <h4 class="text-lg font-semibold mb-2">Add Subject CIA Marks</h4>
      <div>
        <label class="block text-sm text-gray-600">Subject name</label>
        <input id="ciaSub" class="w-full border rounded px-3 py-2 mt-1" placeholder="Data Structures"/>
        <div class="grid grid-cols-3 gap-2 mt-3">
          <div><label class="text-sm text-gray-600">CIA 1</label><input id="cia1" type="number" class="w-full border rounded px-3 py-2" value="0"/></div>
          <div><label class="text-sm text-gray-600">CIA 2</label><input id="cia2" type="number" class="w-full border rounded px-3 py-2" value="0"/></div>
          <div><label class="text-sm text-gray-600">CIA 3</label><input id="cia3" type="number" class="w-full border rounded px-3 py-2" value="0"/></div>
        </div>
        <div class="mt-4 text-right"><button class="px-4 py-2 rounded bg-purple-600 text-white" onclick="ui.addCia()">Add</button></div>
      </div>
    `;
    this.showModal(html);
  },
  addCia() {
    const name = document.getElementById('ciaSub').value.trim();
    const cia1 = Number(document.getElementById('cia1').value || 0);
    const cia2 = Number(document.getElementById('cia2').value || 0);
    const cia3 = Number(document.getElementById('cia3').value || 0);
    if (!name) return alert('Enter subject');
    state.cia.push({ id: 'c' + Date.now(), subject: name, cia1, cia2, cia3 });
    saveState(state);
    this.closeModal(); this.renderCia(); this.renderOverview(); this.renderActivity();
  },
  renderNotes() {
    const list = document.getElementById('notesList');
    list.innerHTML = '';
    if (state.notes.length === 0) {
      list.innerHTML = `<div class="text-center text-gray-500">No notes yet. Add notes to show up here.</div>`;
      return;
    }
    state.notes.slice().reverse().forEach(n=>{
      const card = document.createElement('div');
      card.className = 'card flex items-start justify-between';
      card.innerHTML = `<div>
          <div class="font-semibold">${n.title} <span class="text-xs ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-600">${n.tag}</span></div>
          <div class="text-xs text-gray-500">${n.uploader} • ${timeAgo(n.time)}</div>
        </div>
        <div class="flex flex-col gap-2">
          <button class="px-3 py-1 rounded bg-blue-50" onclick='notes.view("${n.id}")'>View</button>
          <button class="px-3 py-1 rounded bg-green-50" onclick='notes.download("${n.id}")'>Download</button>
        </div>`;
      list.appendChild(card);
    });
  },
  openAddNote() {
    const html = `
      <h4 class="text-lg font-semibold mb-2">Add Note / Resource</h4>
      <div>
        <label class="text-sm text-gray-600">Title</label><input id="noteTitle" class="w-full border rounded px-3 py-2 mt-1" placeholder="Operating Systems - Unit1"/>
        <label class="text-sm text-gray-600 mt-2">Tag</label><input id="noteTag" class="w-full border rounded px-3 py-2 mt-1" value="Notes"/>
        <label class="text-sm text-gray-600 mt-2">Uploader</label><input id="noteUploader" class="w-full border rounded px-3 py-2 mt-1" value="Student"/>
        <label class="text-sm text-gray-600 mt-2">Content (will be saved as txt)</label>
        <textarea id="noteContent" class="w-full border rounded px-3 py-2 mt-1" rows="6"></textarea>
        <div class="mt-4 text-right"><button class="px-4 py-2 rounded bg-green-600 text-white" onclick="notes.add()">Add Note</button></div>
      </div>
    `;
    this.showModal(html);
  },
  renderPlacement() {
    const list = document.getElementById('placementList');
    list.innerHTML = '';
    state.placements.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<div class="flex justify-between items-start">
        <div>
          <div class="font-semibold">${p.company}</div>
          <div class="text-sm text-gray-500">${p.role}</div>
          <div class="text-xs text-gray-400 mt-1">${p.note}</div>
        </div>
        <div class="text-right">
          <div class="font-bold">${p.avg}</div>
          <div class="text-xs text-gray-500">Highest ${p.highest}</div>
        </div>
      </div>`;
      list.appendChild(card);
    });
  },

  showModal(html) {
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('flex');
  },
  closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal').classList.remove('flex');
  },
  openProfile() {
    const html = `
      <h4 class="text-lg font-semibold mb-2">Profile</h4>
      <div>
        <label class="text-sm text-gray-600">Name</label><input id="profName" class="w-full border rounded px-3 py-2 mt-1" value="${state.user.name}"/>
        <label class="text-sm text-gray-600 mt-2">Branch</label><input id="profBranch" class="w-full border rounded px-3 py-2 mt-1" value="${state.user.branch}"/>
        <label class="text-sm text-gray-600 mt-2">Semester</label><input id="profSem" class="w-full border rounded px-3 py-2 mt-1" value="${state.user.semester}"/>
        <label class="text-sm text-gray-600 mt-2">Credits</label><input id="profCredits" class="w-full border rounded px-3 py-2 mt-1" value="${state.user.credits}"/>
        <div class="mt-4 text-right"><button class="px-4 py-2 rounded bg-gray-800 text-white" onclick="ui.saveProfile()">Save</button></div>
      </div>
    `;
    this.showModal(html);
  },
  saveProfile() {
    state.user.name = document.getElementById('profName').value || state.user.name;
    state.user.branch = document.getElementById('profBranch').value || state.user.branch;
    state.user.semester = document.getElementById('profSem').value || state.user.semester;
    state.user.credits = Number(document.getElementById('profCredits').value || state.user.credits);
    saveState(state);
    document.getElementById('userName').innerText = state.user.name;
    document.getElementById('credits').innerText = `${state.user.credits} / 180`;
    this.closeModal(); this.renderOverview();
  }
};

// ----------------- Notes functions -----------------
const notes = {
  add() {
    const title = document.getElementById('noteTitle').value.trim();
    const tag = document.getElementById('noteTag').value.trim() || 'Notes';
    const uploader = document.getElementById('noteUploader').value.trim() || 'Student';
    const content = document.getElementById('noteContent').value || '';
    if (!title) return alert('Enter title');
    const id = 'n' + Date.now();
    state.notes.push({ id, title, tag, uploader, time: Date.now(), content });
    saveState(state);
    ui.closeModal(); ui.renderNotes(); ui.renderActivity();
  },
  view(id) {
    const n = state.notes.find(x=>x.id===id);
    if (!n) return;
    ui.showModal(`<h4 class="text-lg font-semibold mb-2">${n.title}</h4><div class="text-sm text-gray-700 mb-3">${n.uploader} • ${timeAgo(n.time)}</div><pre class="bg-gray-50 p-3 rounded text-sm" style="white-space:pre-wrap">${n.content || '[No content]'}</pre>`);
  },
  download(id) {
    const n = state.notes.find(x=>x.id===id);
    if (!n) return;
    const blob = new Blob([n.content || n.title], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${n.title}.txt`; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },1000);
  }
};

// ----------------- AI mock -----------------
const ai = {
  ask() {
    const q = document.getElementById('aiInput').value.trim();
    if (!q) return;
    const box = document.getElementById('chatBox');
    const userDiv = document.createElement('div'); userDiv.className='text-right text-sm mb-2'; userDiv.innerHTML = `<div class="inline-block bg-blue-50 px-3 py-2 rounded">${escapeHtml(q)}</div>`;
    box.appendChild(userDiv);
    document.getElementById('aiInput').value = '';
    // mock response with simple rules
    const resp = ai.generateResponse(q);
    const botDiv = document.createElement('div'); botDiv.className='text-left text-sm mb-4'; botDiv.innerHTML = `<div class="inline-block bg-gray-100 px-3 py-2 rounded">${escapeHtml(resp)}</div>`;
    setTimeout(()=>{ box.appendChild(botDiv); box.scrollTop = box.scrollHeight; }, 600);
  },
  generateResponse(q) {
    const lq = q.toLowerCase();
    if (lq.includes('explain') || lq.includes('explain module')) return 'Short explanation (demo): Start with definitions, then provide an example, and summarize key points. (Replace with real AI API later)';
    if (lq.includes('summarize') || lq.includes('summary')) return 'Summary (demo): Key idea 1 • Key idea 2 • Key idea 3. Use real AI for full summaries.';
    if (lq.includes('questions') || lq.includes('mcq') || lq.includes('practice')) return 'Practice question (demo): 1) What is ...? 2) Explain ... ?';
    return 'Demo AI: I can explain topics, summarize notes, and generate practice questions. Connect a real AI API (OpenAI) for production.';
  }
};

// ----------------- Utilities / calculations -----------------
function classesToBeSafe(s) {
  // assume safe threshold 75%
  const cur = s.present, tot = s.total;
  const needed = Math.ceil(Math.max(0, (0.75* (tot + 1000) - cur)) / 1); // rough simple estimate — updated below
  // better calc: find minimal x such that (present + x) / (total + x) >= 0.75
  let x = 0;
  while ((s.present + x) / (s.total + x) < 0.75) x++;
  return x;
}
function predictFinalFromCias(ciaAvg) {
  // demo formula: CIAs contribute 40% to final, end-sem 60%. If student has ciaAvg, predicted final assuming end-sem equals ciaAvg (conservative)
  return Math.round(ciaAvg * 0.4 + ciaAvg * 0.6);
}
function requiredEndSemToPass(ciaAvg) {
  // assume passing threshold overall = 40%
  // let E = required end-sem percent. final = 0.4*ciaAvg + 0.6*E >= 40 => E >= (40 - 0.4*ciaAvg)/0.6
  const needed = Math.ceil(Math.max(0, (40 - 0.4*ciaAvg) / 0.6));
  return Math.min(100, needed);
}
function timeAgo(ts) {
  const s = Math.floor((Date.now()-ts)/1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function escapeHtml(s){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ----------------- Init -----------------
window.addEventListener('load', ()=>{
  ui.init();

  // hash based nav
  function checkHash(){
    const h = location.hash.replace('#','');
    if (!h) ui.showSection('dashboard');
    else ui.showSection(h);
  }
  window.addEventListener('hashchange', checkHash);
  checkHash();
});
