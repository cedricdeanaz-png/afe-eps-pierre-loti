/* ============================================================
   Module STEP — musique, atelier de blocs, FC, régulation,
   critique des référentiels, ressources
   Dépend de : step-pas.js, et des utilitaires $, $$, store, toast, copy, esc
   ============================================================ */
(() => {
const PAS = PAS_STEP;
const byName = n => PAS.find(p => p.n === n);

/* ---------------- MUSIQUE SYNTHÉTISÉE ---------------- */
const BPMS = [120,125,130,135,140,145,150,155];
let bpm = 125, playing = false, ctx = null, master = null, nextTime = 0, step16 = 0, timer = null, beatCount = 0, uiQueue = [], raf = null;
const CHORDS = [[57,60,64],[53,57,60],[48,52,55],[55,59,62]]; // la m, fa, do, sol — un accord par phrase de 8 temps
const mf = m => 440 * Math.pow(2, (m - 69) / 12);

$('#mChips').innerHTML = BPMS.map(b => `<button data-b="${b}" class="${b===bpm?'on':''}">${b}</button>`).join('');
$('#mChips').onclick = e => { const b = e.target.closest('button'); if(!b) return; setBpm(+b.dataset.b); $('#mRamp').checked = false; };
$('#mBeats').innerHTML = [1,2,3,4,5,6,7,8].map(n => `<i>${n}</i>`).join('');
$('#mPhrase').innerHTML = [1,2,3,4].map(n => `<span>${(n-1)*8+1}–${n*8}</span>`).join('');
function setBpm(b){ bpm = b; $('#mBpm').textContent = b; $$('#mChips button').forEach(x => x.classList.toggle('on', +x.dataset.b === b)); }

function noiseBuf(){ const len = ctx.sampleRate * 1, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0); for(let i=0;i<len;i++) d[i] = Math.random()*2-1; return b; }
let NOISE;
function env(g, t, a, peak, dec){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
function kick(t){ const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); env(g, t, 0.002, 0.9, 0.28); o.connect(g).connect(master); o.start(t); o.stop(t + 0.32); }
function noiseHit(t, type, freq, peak, dec, q=1){ const s = ctx.createBufferSource(); s.buffer = NOISE; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); env(g, t, 0.001, peak, dec); s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dec + 0.05); }
function clap(t){ [0, 0.011, 0.022].forEach(d => noiseHit(t + d, 'bandpass', 1500, 0.35, 0.12, 0.8)); }
function synth(t, freq, dur, type, peak, cutoff){ const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, t); f.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff/4), t + dur); env(g, t, 0.005, peak, dur); o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05); }
function crash(t){ noiseHit(t, 'highpass', 5000, 0.28, 1.3, 0.5); }

function schedule(){
  const spb = 60 / bpm, s16 = spb / 4;
  while(nextTime < ctx.currentTime + 0.12){
    const t = nextTime, pos16 = step16 % 4, beat = Math.floor(step16 / 4); // beat absolu
    const inPhrase = beat % 8, in32 = beat % 32, chord = CHORDS[Math.floor(in32 / 8)];
    if(pos16 === 0){
      kick(t);
      if(inPhrase % 2 === 1) clap(t);
      if(in32 === 0) crash(t);
      synth(t, mf(chord[0]+12), spb*0.9, 'sawtooth', 0.05, 2400); // nappe
      synth(t, mf(chord[2]+12), spb*0.9, 'sawtooth', 0.04, 2400);
      uiQueue.push({t, beat});
    }
    if(pos16 === 2){ noiseHit(t, 'highpass', 7000, 0.16, 0.09); synth(t, mf(chord[0]-24), s16*1.8, 'sawtooth', 0.3, 900); }
    if(pos16 === 1 || pos16 === 3) noiseHit(t, 'highpass', 9000, 0.05, 0.03);
    if(pos16 === 3 && inPhrase >= 4){ const n = chord[(step16 >> 2) % 3] + 24; synth(t, mf(n), s16*1.2, 'square', 0.035, 3000); }
    nextTime += s16; step16++;
    if(pos16 === 3 && (beat + 1) % 32 === 0) ramp(beat + 1);
  }
}
function ramp(nextBeat){
  if(!$('#mRamp').checked) return;
  const n = +$('#mRampN').value, max = +$('#mRampMax').value;
  if(nextBeat % (32 * n) === 0 && bpm < max){ setBpm(bpm + 5); $('#mInfo').textContent = `Palier : ${bpm} BPM — relevez FC et ressenti`; }
}
function draw(){
  const now = ctx.currentTime;
  while(uiQueue.length && uiQueue[0].t <= now){
    const {beat} = uiQueue.shift(); beatCount = beat;
    const inPhrase = beat % 8, ph = Math.floor((beat % 32) / 8);
    $$('#mBeats i').forEach((x, i) => x.classList.toggle('on', i === inPhrase));
    $$('#mPhrase span').forEach((x, i) => x.classList.toggle('on', i === ph));
    followBloc(beat);
  }
  raf = requestAnimationFrame(draw);
}
function start(){
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if(ctx.state === 'suspended') ctx.resume();
  if(!NOISE) NOISE = noiseBuf();
  master = ctx.createGain(); master.gain.value = 0.7;
  const comp = ctx.createDynamicsCompressor(); master.connect(comp).connect(ctx.destination);
  step16 = 0; uiQueue = []; nextTime = ctx.currentTime + 0.1;
  if($('#mRamp').checked && bpm > 125) setBpm(120);
  timer = setInterval(schedule, 25); raf = requestAnimationFrame(draw);
  playing = true; $('#mPlay').textContent = '■ Arrêter'; $('#music').classList.add('playing');
  $('#mInfo').textContent = $('#mRamp').checked ? 'Montée progressive lancée' : '';
}
function stop(){
  clearInterval(timer); cancelAnimationFrame(raf); playing = false;
  if(master){ master.gain.setTargetAtTime(0, ctx.currentTime, 0.05); }
  $('#mPlay').textContent = '▶ Lancer la musique'; $('#music').classList.remove('playing');
  $$('#mBeats i, #mPhrase span').forEach(x => x.classList.remove('on')); $('#mSide').textContent = 'Prêt';
  $$('#bLine .seg').forEach(x => x.classList.remove('now'));
}
$('#mPlay').onclick = () => playing ? stop() : start();
window.addEventListener('hashchange', () => { if(playing && location.hash !== '#step') stop(); });

/* ---------------- ATELIER DE COMPOSITION ---------------- */
let bloc = store.get('stepBloc', []);
let saved = store.get('stepBlocs', []);
const FAMS = ['4 temps sans changement','4 temps avec changement','8 temps sans changement','8 temps avec changement'];
$('#bFams').innerHTML = FAMS.map(f => {
  const ch = f.includes('avec');
  return `<div class="fam ${ch?'ch':'nc'}"><b>${f.replace('changement', 'changement de pied')}</b><div>${PAS.filter(p=>p.fam===f).map(p => `<button data-n="${esc(p.n)}" title="${esc(p.d)}">${esc(p.n)}${p.tour?' ↻':''}${p.cote?' ⇄':''}</button>`).join('')}</div></div>`;
}).join('');
const total = () => bloc.reduce((s, n) => s + byName(n).t, 0);
function showDesc(n){ const p = byName(n); $('#bDesc').innerHTML = `<b>${esc(p.n)}</b> · ${p.t} temps · ${p.ch?'<span class="k ch">change de pied</span>':'<span class="k nc">même pied</span>'}${p.cote?' · change de côté du step':''}<br>${esc(p.d)} <em>${esc(p.r)}</em>`; }
$('#bFams').addEventListener('mouseover', e => { const b = e.target.closest('button'); if(b) showDesc(b.dataset.n); });
$('#bFams').onclick = e => {
  const b = e.target.closest('button'); if(!b) return;
  const p = byName(b.dataset.n); showDesc(p.n);
  if(total() + p.t > 32){ toast('Le bloc dépasserait 32 temps'); return; }
  bloc.push(p.n); renderBloc();
};
$('#bUndo').onclick = () => { bloc.pop(); renderBloc(); };
$('#bClear').onclick = () => { bloc = []; renderBloc(); };
$('#bExample').onclick = () => { bloc = ['Basic','V-step','Genou','Basic','L-step','Tap up','Jazzsquare']; renderBloc(); toast('Exemple : 3 pas changent de pied, le bloc repart à gauche'); };

// calcule pour chaque pas : temps de départ, pied directeur au départ
function analyse(list, startFoot){
  let t = 0, foot = startFoot; const out = [];
  list.forEach(n => { const p = byName(n); out.push({p, t, foot}); t += p.t; if(p.ch) foot = foot === 'D' ? 'G' : 'D'; });
  return {seg: out, end: foot, changes: list.filter(n => byName(n).ch).length};
}
function lineHTML(side, startFoot){
  const a = analyse(bloc, startFoot);
  const narrow = window.innerWidth < 640;
  const pos = s => narrow ? `grid-row:${Math.floor(s.t/8)+1};grid-column:${s.t%8+1} / span ${Math.min(s.p.t, 8 - s.t%8)}` : `grid-column:${s.t+1} / span ${s.p.t}`;
  return `<div class="side-row ${narrow?'narrow':''}"><div class="side-lab">${side}</div><div class="bar32 ${narrow?'b8':''}">${a.seg.map((s,i) => `<div class="seg ${s.p.ch?'ch':'nc'}" data-i="${i}" data-side="${side}" style="${pos(s)}"><b>${esc(s.p.n)}</b><small>${s.foot === 'D' ? 'pied droit' : 'pied gauche'}</small></div>`).join('')}</div></div>`;
}
function renderBloc(){
  store.set('stepBloc', bloc);
  const tot = total(), a = analyse(bloc, 'D');
  const ticks = `<div class="ticks">${Array.from({length:32},(_,i)=>`<span class="${i%8===0?'m':''}">${i%8===0? i+1 : ''}</span>`).join('')}</div>`;
  $('#bLine').innerHTML = (window.innerWidth < 640 ? '' : ticks) + lineHTML('À droite', 'D') + (tot === 32 && a.end === 'G' ? lineHTML('À gauche', 'G') : '');
  // vérifications
  const msgs = [];
  const misaligned = a.seg.filter(s => s.p.t === 8 && s.t % 8 !== 0);
  if(tot < 32) msgs.push(`<span class="v wait">${tot} / 32 temps — il reste ${32 - tot} temps</span>`);
  else msgs.push(`<span class="v ok">32 temps ✓</span>`);
  if(bloc.length){
    msgs.push(a.changes % 2 === 1
      ? `<span class="v ok">${a.changes} pas change${a.changes>1?'nt':''} de pied : nombre impair, le bloc repart à gauche ✓</span>`
      : `<span class="v ko">${a.changes} pas change${a.changes>1?'nt':''} de pied : nombre pair, le bloc repart à droite. Ajoutez ou retirez un pas rose.</span>`);
  }
  if(misaligned.length) msgs.push(`<span class="v warn">${misaligned.map(s=>esc(s.p.n)).join(', ')} commence au milieu d'une phrase de 8 : placez les pas de 4 temps par deux pour garder la musique.</span>`);
  $('#bVerdict').innerHTML = msgs.join('');
}
function followBloc(beat){
  if(!$('#mFollow').checked || total() !== 32){ $('#mSide').textContent = (beat % 64 < 32) ? 'Bloc · 1re fois' : 'Bloc · 2e fois'; return; }
  const a = analyse(bloc, 'D'), p64 = beat % 64, gauche = p64 >= 32 && a.end === 'G', t = p64 % 32;
  const sideLab = a.end === 'G' ? (p64 < 32 ? 'À droite' : 'À gauche') : 'À droite';
  const idx = a.seg.findIndex(s => t >= s.t && t < s.t + s.p.t);
  $('#mSide').innerHTML = `<b>${sideLab}</b> · ${esc(a.seg[idx].p.n)}`;
  $$('#bLine .seg').forEach(x => x.classList.toggle('now', +x.dataset.i === idx && x.dataset.side === sideLab));
}
$('#bSave').onclick = () => {
  const a = analyse(bloc, 'D');
  if(total() !== 32) return toast('Le bloc doit faire 32 temps');
  saved.push({pas: bloc.slice(), gauche: a.end === 'G'}); store.set('stepBlocs', saved); renderSaved(); toast('Bloc gardé');
};
function renderSaved(){
  $('#bSaved').innerHTML = saved.length ? `<h3 class="sub">Mes blocs</h3>` + saved.map((s,i) => `<div class="sbloc"><b>Bloc ${i+1}</b><span>${s.pas.map(esc).join(' · ')}</span><em>${s.gauche?'droite + gauche':'à droite seulement'}</em><button data-i="${i}" title="Charger">↺</button><button data-d="${i}" title="Supprimer">✕</button></div>`).join('') : '';
}
$('#bSaved').onclick = e => {
  const b = e.target.closest('button'); if(!b) return;
  if(b.dataset.i != null){ bloc = saved[+b.dataset.i].pas.slice(); renderBloc(); toast('Bloc chargé dans l\'atelier'); }
  if(b.dataset.d != null){ saved.splice(+b.dataset.d, 1); store.set('stepBlocs', saved); renderSaved(); }
};
$('#bPrint').onclick = () => {
  const list = saved.length ? saved : (total() === 32 ? [{pas: bloc, gauche: analyse(bloc,'D').end === 'G'}] : []);
  if(!list.length) return toast('Gardez au moins un bloc de 32 temps');
  const rows = s => { const a = analyse(s.pas, 'D'); return a.seg.map(x => `<tr><td>${x.t+1}–${x.t+x.p.t}</td><td><b>${esc(x.p.n)}</b></td><td>${x.foot==='D'?'Droit':'Gauche'}</td><td style="color:${x.p.ch?'#c4267f':'#1fa463'}">${x.p.ch?'change':'garde'}</td><td></td></tr>`).join(''); };
  const w = window.open('', '_blank');
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Mes blocs STEP</title><style>body{font-family:Arial,sans-serif;margin:20mm;color:#151b33}h1{color:#1c2b6e;font-size:20px}h2{font-size:15px;margin:18px 0 6px;color:#1c2b6e}table{width:100%;border-collapse:collapse;font-size:12px}td,th{border:1px solid #c9cee0;padding:6px;text-align:left}th{background:#1c2b6e;color:#fff}.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1c2b6e;padding-bottom:8px}.hd img{height:50px}</style></head><body><div class="hd"><img src="img/logo-rf-aefe.png"><b>Mes blocs STEP · Lycée Pierre Loti</b><img src="img/logo-pierre-loti.png"></div>${list.map((s,i) => `<h2>Bloc ${i+1} · ${s.gauche ? 'à droite puis à gauche' : 'à droite seulement'}</h2><table><tr><th>Temps</th><th>Nom du pas</th><th>Pied directeur</th><th>Pied</th><th>Bras</th></tr>${rows(s)}</table>`).join('')}<script>setTimeout(()=>print(),400)<\/script></body></html>`);
  w.document.close();
};
renderBloc(); renderSaved();
let rsz; window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(renderBloc, 150); });

/* ---------------- FC D'ENTRAÎNEMENT ---------------- */
const TH = [
  {k:1, n:'T1 · Bref et intense', c:'#e3382c', lo:.85, hi:1, txt:'> 85 %'},
  {k:2, n:'T2 · Long et soutenu', c:'#e07a10', lo:.70, hi:.85, txt:'70 à 85 %'},
  {k:3, n:'T3 · Modéré et prolongé', c:'#1fa463', lo:.50, hi:.65, txt:'50 à 65 %'}
];
function fc(){
  const age = +$('#fAge').value || 16, rest = +$('#fRest').value || 70, max = ($('#fSex').value === 'f' ? 226 : 220) - age, res = max - rest;
  const z = TH.map(t => ({...t, a: Math.round(rest + res * t.lo), b: Math.round(rest + res * t.hi)}));
  store.set('stepFc', {age, rest, sex: $('#fSex').value});
  $('#fRes').innerHTML = `<div class="fcline"><span>FC max <b>${max}</b></span><span>FC de réserve <b>${res}</b></span></div>` +
    z.map(t => `<div class="zrow" style="--c:${t.c}"><b>${t.n}</b><span>${t.txt}</span><strong>${t.k===1 ? '> ' + t.a : t.a + ' – ' + t.b} <small>puls./min</small></strong></div>`).join('');
  return z;
}
const sf = store.get('stepFc'); if(sf){ $('#fAge').value = sf.age; $('#fRest').value = sf.rest; $('#fSex').value = sf.sex; }
['fAge','fRest','fSex'].forEach(id => $('#'+id).addEventListener('input', () => { fc(); regul(); }));
fc();

/* ---------------- RÉGULATION ---------------- */
const UP = {bio:['combiner des pas plus complexes', 'ajouter des changements d\'orientation', 'travailler les bras en dissociation'], ener:['monter les bras au-dessus des épaules', 'passer à la variante HIA (en courant, avec impulsion)', 'augmenter le BPM de 5', 'ajouter une marche au step', 'réduire la récupération']};
const DOWN = {bio:['revenir à des pas de base (Basic, V-step)', 'supprimer les changements d\'orientation'], ener:['garder les bras bas', 'baisser le BPM de 5', 'enlever une marche', 'allonger la récupération']};
function regul(){
  const z = fc(), th = z[+$('#rTheme').value - 1], f = +$('#rFc').value, zone = +$('#rZone').value;
  let state, cls, advice;
  if(th.k === 1 ? f < th.a : f < th.a){ state = `FC sous ma zone (${th.k===1 ? '> '+th.a : th.a+'–'+th.b})`; cls = 'lo'; }
  else if(th.k !== 1 && f > th.b){ state = `FC au-dessus de ma zone (${th.a}–${th.b})`; cls = 'hi'; }
  else { state = 'FC dans ma zone ✓'; cls = 'ok'; }
  const want = {1:[4,5], 2:[3,4], 3:[2,3]}[th.k];
  const rOk = zone >= want[0] && zone <= want[1];
  const rTxt = rOk ? 'Ressenti cohérent avec le thème' : zone < want[0] ? 'Ressenti plus facile que prévu' : 'Ressenti plus dur que prévu';
  if(cls === 'lo' || (cls === 'ok' && zone < want[0])){
    const pool = th.k === 1 ? UP.ener : th.k === 3 ? UP.bio : [...UP.bio.slice(0,1), ...UP.ener.slice(0,3)];
    advice = `<b>J'augmente la charge, un seul paramètre :</b><ul>${pool.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  } else if(cls === 'hi' || zone > want[1]){
    const pool = th.k === 3 ? [...DOWN.ener, DOWN.bio[1]] : DOWN.ener;
    advice = `<b>Je diminue la charge, un seul paramètre :</b><ul>${pool.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  } else advice = '<b>Je garde mes paramètres</b> et je vérifie la qualité des appuis et la tonicité jusqu\'à la fin de la série.';
  $('#rOut').innerHTML = `<div class="st2 ${cls}">${state}</div><div class="st2 ${rOk?'ok':'warn'}">${rTxt}</div><div class="adv">${advice}</div><p class="muted" style="margin:8px 0 0">Le croisement FC + ressenti décide. Si les deux ne disent pas la même chose, on vérifie la mesure avant de changer quoi que ce soit.</p>`;
}
['rTheme','rFc','rZone'].forEach(id => $('#'+id).addEventListener('input', regul));
regul();

/* ---------------- RÉFÉRENTIELS EXISTANTS ---------------- */
const REFS = [
  {id:'lfadn', nom:'Lycée Anna de Noailles · Bucarest', sous:'Évaluation de Première, 2025-2026', f:'referentiel-lfadn-bucarest-premieres.pdf',
   pts:['Épreuve en 3 temps : 15 min de conception, 45 min de réalisation, 15 min d\'analyse', 'Le carnet d\'entraînement sert à évaluer l\'AFL2 au fil de la séquence', 'Deux rôles évalués séparément : observateur-aide et coach-conseil', 'Au moins 4 blocs dont 2 imposés (5 pour le thème 3), BPM entre 128 et 150']},
  {id:'doha', nom:'Lycée Voltaire · Doha (réseau AEFE)', sous:'Fiche certificative d\'APSA', f:'referentiel-lycee-voltaire-doha.pdf',
   pts:['Contexte écrit par l\'équipe : surpoids, goût de l\'effort, coopération', 'Carnet numérique de suivi (application Glide)', 'Répartition des 8 points AFL2 / AFL3 choisie par l\'élève', 'Enchaînement individuel, pensé pour un enseignement hybride']},
  {id:'est', nom:'Lycée international de l\'Est parisien', sous:'Référentiel d\'évaluation, Noisy-le-Grand', f:'referentiel-lycee-international-est-parisien.pdf',
   pts:['Les élèves portent un cardiofréquencemètre mais ne voient pas leur FC pendant l\'épreuve', 'Suivi en direct par l\'enseignant (Polar Team)', 'Choix de la répartition des points à la 4e leçon', 'Enchaînement collectif possible, évaluation individuelle']},
  {id:'medoc', nom:'Lycée Sud Médoc · académie de Bordeaux', sous:'Référentiel certificatif', f:'referentiel-lycee-sud-medoc-bordeaux.pdf',
   pts:['Point de départ : un diagnostic des élèves (points d\'appui, points à renforcer)', '20 « steps » : un critère validé = un step', 'Enchaînement collectif de 3 à 5 élèves, BPM imposé entre 130 et 140', 'Rôles de coach détaillés : création, musique, chronomètre, mémoire']}
];
const CRIT = ['Lisible pour un élève', 'Le carnet a une vraie place', 'FC et ressenti réellement observables', 'Faisable avec notre matériel et nos créneaux', 'Les côtés droit et gauche sont exigés'];
let crit = store.get('stepCrit', {});
$('#refs').innerHTML = REFS.map(r => `<div class="ref card">
  <div class="rh"><div><b>${r.nom}</b><small>${r.sous}</small></div><a class="btn ghost sm" href="ressources/step/${r.f}" target="_blank" rel="noopener">Ouvrir ↗</a></div>
  <ul>${r.pts.map(p=>`<li>${p}</li>`).join('')}</ul>
  <div class="crit">${CRIT.map((c,j) => `<div class="cr"><span>${c}</span><div class="stars" data-r="${r.id}" data-c="${j}">${[1,2,3,4].map(v=>`<button data-v="${v}" class="${(crit[r.id]||{})[j]>=v?'on':''}">${v}</button>`).join('')}</div></div>`).join('')}</div>
  <label>À retenir pour Pierre Loti</label><textarea data-journal="step_ref_${r.id}" data-label="STEP · référentiel ${r.nom}" placeholder="Ce que l'on reprend de ce référentiel, et pourquoi…"></textarea>
</div>`).join('');
$('#refs').addEventListener('click', e => {
  const b = e.target.closest('.stars button'); if(!b) return;
  const s = b.parentElement, r = s.dataset.r, c = s.dataset.c, v = +b.dataset.v;
  crit[r] = crit[r] || {}; crit[r][c] = crit[r][c] === v ? 0 : v; store.set('stepCrit', crit);
  [...s.children].forEach(x => x.classList.toggle('on', +x.dataset.v <= crit[r][c]));
});
window.stepCritExport = () => REFS.map(r => `${r.nom} : ` + CRIT.map((c,j)=>`${c} ${(crit[r.id]||{})[j]||'—'}/4`).join(' · ')).join('\n');

/* ---------------- RESSOURCES ---------------- */
const RES = [
  ['Carnet d\'entraînement STEP (Pierre Loti)', 'carnet-entrainement-step-pierre-loti.pdf', 'PDF · 13 pages'],
  ['Les différents pas en STEP', 'les-differents-pas-en-step.pdf', 'PDF · fiches des pas'],
  ['Fiche de composition des blocs', 'fiche-composition-blocs.docx', 'Word · modifiable'],
  ['Créer un bloc avec changement de côté', 'creer-un-bloc-changement-de-cote.docx', 'Word · avec grille d\'observation'],
  ['Calculer sa FC cible', 'calculer-sa-fc-cible.docx', 'Word · formule de Karvonen'],
  ['Fiche ressenti', 'fiche-ressenti.pdf', 'PDF'],
  ['S\'entraîner en STEP', 's-entrainer-en-step.pdf', 'PDF'],
  ['Cycle STEP niveau 3, leçon par leçon', 'cycle-step-niveau-3.pdf', 'PDF'],
  ['Référentiel LFAdN Bucarest (Première)', 'referentiel-lfadn-bucarest-premieres.docx', 'Word · à adapter']
];
$('#stepRes').innerHTML = RES.map(([t,f,d]) => `<a class="resl" href="ressources/step/${f}" target="_blank" rel="noopener"><i>${f.endsWith('.pdf')?'PDF':'DOC'}</i><span><b>${t}</b><small>${d}</small></span></a>`).join('');
})();
