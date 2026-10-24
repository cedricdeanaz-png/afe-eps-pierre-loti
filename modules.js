/* ============================================================
   Modules tennis de table, VTT, course d'orientation, cross-training
   Dépend des utilitaires $, $$, store, toast, copy, esc
   ============================================================ */
(() => {
/* ---------- outils communs ---------- */
function resList(el, folder, items){
  $(el).innerHTML = items.map(([t,f,d]) => `<a class="resl" href="ressources/${folder}/${f}" target="_blank" rel="noopener"><i class="${f.endsWith('.pdf')?'pdf':'doc'}">${f.endsWith('.pdf')?'PDF':'DOC'}</i><span><b>${t}</b><small>${d}</small></span></a>`).join('');
}
function checks(el, key, items){
  const st = store.get(key, {});
  const draw = () => $(el).innerHTML = items.map((x,i) => `<button class="ck ${st[i]?'on':''}" data-i="${i}"><i></i><span>${x}</span></button>`).join('');
  $(el).onclick = e => { const b = e.target.closest('.ck'); if(!b) return; st[b.dataset.i] = !st[b.dataset.i]; store.set(key, st); draw(); };
  draw();
  return () => { Object.keys(st).forEach(k => delete st[k]); store.set(key, st); draw(); };
}
function sits(fEl, gEl, data){
  const fams = ['Toutes', ...new Set(data.map(d => d.f))]; let cur = 'Toutes';
  const draw = () => {
    $(fEl).innerHTML = fams.map(f => `<button class="${f===cur?'on':''}">${f}</button>`).join('');
    $(gEl).innerHTML = data.filter(d => cur === 'Toutes' || d.f === cur).map(d => `<div class="card sit"><span class="tag">${d.f}</span><h3>${d.t}</h3><dl>
      <dt>But</dt><dd>${d.but}</dd><dt>Dispositif</dt><dd>${d.disp}</dd><dt>Critère de réussite</dt><dd>${d.cr}</dd>
      ${d.s ? `<dt>Simplifier</dt><dd>${d.s}</dd>` : ''}${d.c ? `<dt>Complexifier</dt><dd>${d.c}</dd>` : ''}</dl>${d.src ? `<a class="srcl" href="${d.src}" target="_blank" rel="noopener">Fiche complète ↗</a>` : ''}</div>`).join('');
  };
  $(fEl).onclick = e => { const b = e.target.closest('button'); if(b){ cur = b.textContent; draw(); } };
  draw();
}

/* ================= TENNIS DE TABLE ================= */
/* feuille de match */
let m = store.get('ttMatch', {h: []});
const nm = p => $('#m' + p).value || ('Joueur ' + p);
function drawMatch(){
  store.set('ttMatch', m);
  const n = m.h.length, sA = m.h.filter(x=>x.p==='A').reduce((s,x)=>s+(x.sp?2:1),0), sB = m.h.filter(x=>x.p==='B').reduce((s,x)=>s+(x.sp?2:1),0);
  const wA = m.h.filter(x=>x.p==='A').length, wB = m.h.filter(x=>x.p==='B').length;
  const spA = m.h.filter(x=>x.p==='A'&&x.sp).length, spB = m.h.filter(x=>x.p==='B'&&x.sp).length;
  $('#mSA').textContent = sA; $('#mSB').textContent = sB;
  $('#mNA').textContent = nm('A'); $('#mNB').textContent = nm('B');
  $('#mRA').textContent = `${spA} super-point${spA>1?'s':''}${wA ? ' · ' + Math.round(spA/wA*100) + ' %' : ''}`;
  $('#mRB').textContent = `${spB} super-point${spB>1?'s':''}${wB ? ' · ' + Math.round(spB/wB*100) + ' %' : ''}`;
  $('#mCount').textContent = `${n} / 20`;
  const srv = Math.floor(n / 2) % 2 === 0 ? 'A' : 'B';
  $('#mSrv').textContent = n >= 20 ? 'Match terminé' : `Service : ${nm(srv)}`;
  $$('#match .pl').forEach(x => x.classList.toggle('serving', n < 20 && x.dataset.p === srv));
  $$('#match [data-pt], #match [data-sp]').forEach(b => b.disabled = n >= 20);
  let msg = 'Le service change tous les deux points, 10 services chacun. Un super-point (point marqué en cohérence avec le projet annoncé) compte double.';
  if(n === 10) msg = '<b>Mi-match · temps de concertation (1 min)</b> Le coach donne trois informations : un point fort, une faiblesse, un conseil.';
  if(n >= 20){ const w = sA === sB ? 'Égalité' : (sA > sB ? nm('A') : nm('B')) + ' gagne'; msg = `<b>${w} ${Math.max(sA,sB)} à ${Math.min(sA,sB)}</b> Ratio de super-points : ${nm('A')} ${wA?Math.round(spA/wA*100):0} %, ${nm('B')} ${wB?Math.round(spB/wB*100):0} %. Objectif de la séquence : plus de 20 % en leçon 5, plus de 40 % en leçon 9.`; }
  $('#mMsg').innerHTML = msg; $('#mMsg').classList.toggle('hl', n === 10 || n >= 20);
  m.res = {sA, sB, spA, spB, wA, wB};
}
$('#match').addEventListener('click', e => {
  const b = e.target.closest('[data-pt],[data-sp]'); if(!b || m.h.length >= 20) return;
  m.h.push({p: b.dataset.pt || b.dataset.sp, sp: !!b.dataset.sp}); drawMatch();
  if(navigator.vibrate) navigator.vibrate(15);
});
['mA','mB'].forEach(id => $('#'+id).addEventListener('input', drawMatch));
$('#mUndo').onclick = () => { m.h.pop(); drawMatch(); };
$('#mReset').onclick = () => { m = {h: []}; drawMatch(); };
$('#mCopy').onclick = () => { const r = m.res; copy(`Match 20 points — ${nm('A')} (${$('#mPA').value}) ${r.sA} · ${nm('B')} (${$('#mPB').value}) ${r.sB}\nSuper-points : ${nm('A')} ${r.spA}/${r.wA} · ${nm('B')} ${r.spB}/${r.wB}`); };
drawMatch();

/* leçons */
const LECONS = [
  ['Diagnostic initial', 'Matchs courts en 11 points, service libre', 'Continuité, fautes directes, zones jouées', 'Compte les fautes directes et les échanges longs ; donne un point fort et un axe prioritaire'],
  ['Continuité coup droit / revers', 'Tâche 2 · renvoi maîtrisé (2 × 10 balles), alternance CD/RV', '7 renvois réussis sur 10', 'Compte les réussites, repère les erreurs typiques (posture, trajectoire)'],
  ['Service intentionnel', 'Tâche 1 · 6 zones imposées, service + premier coup placé', '4 zones touchées sur 6', 'Mesure les zones réussies, repère le service le plus performant'],
  ['Balle favorable et rupture', 'Jeu demi-table puis ouverture de la zone libre ; sur-filet', '3 ruptures sur 10 échanges', 'Coche la balle favorable et le choix du joueur'],
  ['Projet tactique · rupture spatiale', 'Zones latérales matérialisées, match à thème avec annonce', 'Plus de 20 % de super-points', 'Suit le ratio de super-points, repère la zone latérale rentable'],
  ['Projet tactique · rupture temporelle', 'Smash sur balle haute (6/10), bloc actif (7/10), match à thème', '3 accélérations réussies', 'Compare occasions et réussites'],
  ['Matchs à thème', 'Set 1 rupture spatiale, set 2 rupture temporelle', 'Plus de 30 % de super-points', 'Compare l\'efficacité des deux projets'],
  ['Arbitrage et coaching', 'Rotation joueur / coach / arbitre', 'Feuille de match sans erreur', 'Remplit la fiche d\'observation, conseils courts'],
  ['Tournoi préparatoire', 'Matchs au format de l\'évaluation (20 points, super-points)', 'Plus de 40 % de super-points', 'Aide à l\'auto-évaluation, fixe les priorités'],
  ['Évaluation', 'Match de 20 points, concertation à mi-match, arbitrage complet', 'Indicateurs de la grille', 'Conseils à mi-match']
];
let curL = 0;
function drawLessons(){
  $('#ttLessons').innerHTML = LECONS.map((l,i) => `<button class="${i===curL?'on':''}" data-i="${i}"><b>${i+1}</b><span>${l[0]}</span></button>`).join('');
  const l = LECONS[curL];
  $('#ttLesson').innerHTML = `<div class="lc-h"><span>Leçon ${curL+1}</span><h3>${l[0]}</h3></div><div class="lc-g"><div><label>Situation</label><p>${l[1]}</p></div><div><label>Production attendue</label><p>${l[2]}</p></div><div><label>Rôle du coach</label><p>${l[3]}</p></div></div>`;
}
$('#ttLessons').onclick = e => { const b = e.target.closest('button'); if(b){ curL = +b.dataset.i; drawLessons(); } };
drawLessons();
checks('#ttChecks', 'ttChecks', ['Le diagnostic de la leçon 1 permet vraiment de choisir les contenus prioritaires', 'Les critères chiffrés (7/10, 4 zones sur 6, plus de 20 %) sont atteignables par nos élèves', 'Les super-points arrivent au bon moment dans la séquence', 'Chaque leçon garde un temps de match suffisant', 'Les rôles d\'arbitre et de coach sont appris avant d\'être évalués', 'La leçon 10 évalue ce qui a été travaillé']);

/* situations */
const SITS_TT = [
  {f:'Technique', t:'Tâche 1 · Service intentionnel', but:'Une mise en jeu réglementaire et dirigée vers une zone précise, pour lancer le projet tactique.', disp:'1 table, 2 élèves, un panier de 12 à 20 balles, 4 à 6 zones matérialisées. Série de 6 services, une zone imposée à chaque fois.', cr:'4 zones touchées sur 6, service réglementaire, trajectoire contrôlée.', s:'Zones élargies, deux essais par service.', c:'Zones réduites, alternance CD/RV, effet simple.'},
  {f:'Technique', t:'Tâche 2 · Renvoi maîtrisé CD / RV', but:'Assurer la continuité en coup droit et en revers, réduire les fautes directes.', disp:'Le distributeur lance à la main, le joueur renvoie 10 balles en CD puis 10 en RV sur la demi-table adverse.', cr:'7 renvois réussis sur 10, trajectoire régulière.', s:'Balle mousse, se rapprocher de la table.', c:'Zones de renvoi imposées, alternance CD/RV dans la série.'},
  {f:'Continuité', t:'Tâche 3 · Échange coopératif et déplacements', but:'Maintenir un échange long en coopérant, avec de petits déplacements.', disp:'Phase 1 : échange simple (20 renvois). Phase 2 : déplacement avant chaque frappe. Phase 3 : service, 10 renvois, puis rupture possible.', cr:'15 renvois minimum, déplacements courts et précis.', s:'Sans déplacement, vitesse réduite.', c:'Schémas imposés, zones à atteindre.'},
  {f:'Tactique', t:'Rupture spatiale · jeu en largeur', but:'Déplacer l\'adversaire latéralement pour marquer dans la zone libre.', disp:'2 joueurs + 1 coach, zones latérales matérialisées, feuille de super-points. Le joueur annonce sa zone de rupture.', cr:'Plus de 20 % de super-points spatiaux, cohérence entre l\'annonce et l\'action.', s:'Zones plus larges.', c:'Zones réduites, annonce obligatoire avant chaque service.'},
  {f:'Tactique', t:'Rupture temporelle · jeu en vitesse', but:'Exploiter les balles hautes ou lentes pour accélérer.', disp:'2 joueurs + 1 coach, panier possible, fiche d\'observation. Point marqué juste après l\'accélération = super-point.', cr:'Plus de 30 % de super-points temporels, moins d\'attaques sur balles défavorables.', s:'Distribution aménagée.', c:'L\'adversaire varie effets et vitesses.'}
];
sits('#ttFilters', '#ttSits', SITS_TT.map(x => ({...x, src:'ressources/tt/fiches-situations-tt.docx'})));

/* grille d'évaluation (degrés et couleurs de l'établissement) */
const DEG = ['Insuffisant', 'Fragile', 'Satisfaisant', 'Très satisfaisant'];
const TPL = {
  neutre: {ctx: 'Contexte d\'évaluation : à préciser (format de match, niveau des adversaires, nombre de rencontres observées).',
    rows: [['Engagement dans l\'affrontement', 'AFL1'], ['Efficacité technique', 'AFL1'], ['Choix tactiques', 'AFL1'], ['Préparation et entraînement', 'AFL2'], ['Rôles sociaux', 'AFL3']].map(([c,a]) => ({c, a, d:['','','','']}))},
  c4: {ctx: 'Contexte d\'évaluation : rencontres en simple, contre des adversaires de niveau proche, selon des règles adaptées et connues. Plusieurs matchs courts permettent d\'observer les choix tactiques, l\'efficacité des échanges et les rôles sociaux.',
    rows: [
      {c:'Construire l\'échange et assurer la continuité du jeu', a:'Réaliser des actions décisives en situation favorable ; s\'engager dans un affrontement.', d:['Renvoie quelques balles ; l\'échange s\'interrompt rapidement.', 'Maintient parfois un échange, avec des trajectoires irrégulières.', 'Assure des échanges réguliers en adaptant placement et dosage.', 'Varie longueur et rythme pour maintenir ou accélérer l\'échange.']},
      {c:'Créer la rupture pour marquer', a:'Rechercher le gain de la rencontre par des choix pertinents.', d:['Cherche surtout à remettre la balle, sans intention de rupture.', 'Tente de placer la balle, mais exploite peu les espaces libres.', 'Identifie des balles favorables et vise les espaces libres pour marquer.', 'Construit le point puis accélère ou place précisément pour conclure.']},
      {c:'Se déplacer et se replacer efficacement', a:'Adapter sa motricité aux rapports de force et aux trajectoires.', d:['Réagit à la trajectoire et se déplace encore tardivement.', 'Se déplace vers la balle mais se replace de façon irrégulière.', 'Se place pour frapper équilibré et se replace après la frappe.', 'Anticipe les trajectoires et enchaîne déplacements et replacement.']},
      {c:'Adapter ses choix à l\'adversaire', a:'Observer et analyser le rapport de force pour agir efficacement.', d:['Joue de manière identique quelle que soit la situation.', 'Repère quelques points faibles sans toujours en tirer parti.', 'Adapte direction, profondeur ou vitesse aux réponses adverses.', 'Identifie rapidement des régularités et fait évoluer sa stratégie.']},
      {c:'Assumer les rôles et progresser', a:'Respecter les règles ; arbitrer, observer et utiliser des repères pour progresser.', d:['Connaît quelques règles ; a besoin d\'aide pour compter ou arbitrer.', 'Compte les points et arbitre avec quelques hésitations.', 'Arbitre correctement, observe un critère et formule un conseil utile.', 'Arbitre en autonomie, analyse les résultats et propose un exercice ciblé.']}
    ]}
};
const clone = o => JSON.parse(JSON.stringify(o));
let G = store.get('ttGrid2', null) || clone(TPL.neutre);
function saveG(){ store.set('ttGrid2', G); }
function drawG(){
  $('#gCtx').value = G.ctx; if(G.title) $('#gTitle').value = G.title;
  $('#ttGrid').innerHTML = `<div class="gt-row gt-h"><div class="c0">Critères / compétences</div><div class="c0">Lien avec les attendus</div>${DEG.map((d,i)=>`<div class="d${i}">${d}</div>`).join('')}<div></div></div>` +
    G.rows.map((r,i) => `<div class="gt-row"><textarea class="c" data-r="${i}" data-k="c" placeholder="Critère">${esc(r.c)}</textarea><textarea data-r="${i}" data-k="a" placeholder="Attendu">${esc(r.a)}</textarea>${r.d.map((x,j)=>`<textarea class="d${j}" data-r="${i}" data-k="${j}" placeholder="${DEG[j]}">${esc(x)}</textarea>`).join('')}<button class="del" data-del="${i}" title="Supprimer ce critère">✕</button></div>`).join('');
}
$('#ttGrid').addEventListener('input', e => { const t = e.target.closest('textarea'); if(!t) return; const r = G.rows[+t.dataset.r], k = t.dataset.k; if(k === 'c' || k === 'a') r[k] = t.value; else r.d[+k] = t.value; saveG(); });
$('#ttGrid').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if(!b) return; G.rows.splice(+b.dataset.del, 1); saveG(); drawG(); });
$('#gCtx').addEventListener('input', e => { G.ctx = e.target.value; saveG(); });
$('#gTitle').addEventListener('input', e => { G.title = e.target.value; saveG(); });
$('#gAdd').onclick = () => { G.rows.push({c:'', a:'', d:['','','','']}); saveG(); drawG(); };
$$('[data-tpl]').forEach(b => b.onclick = () => {
  if(G.rows.some(r => r.c || r.a || r.d.some(Boolean)) && !confirm('Remplacer la grille en cours ?')) return;
  const title = G.title; G = clone(TPL[b.dataset.tpl]); G.title = title; saveG(); drawG(); toast(b.dataset.tpl === 'c4' ? 'Grille de cycle 4 chargée, à adapter pour la Première' : 'Grille neutre chargée');
});
const gText = () => `${$('#gTitle').value}\n${G.ctx}\n\n` + G.rows.map(r => `${(r.c||'—').toUpperCase()}\nAttendu : ${r.a||'—'}\n` + DEG.map((d,j)=>`${d} : ${r.d[j]||'—'}`).join('\n')).join('\n\n');
$('#ttGridCopy').onclick = () => copy(gText());
window.ttGridExport = () => gText();
$('#gPrint').onclick = () => {
  const cols = ['#FF0000','#FFFF00','#D8EDCE','#277A4D'], fg = ['#fff','#151b33','#151b33','#fff'];
  const w = window.open('', '_blank');
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Grille d'évaluation</title><style>
  @page{size:A4 portrait;margin:12mm}body{font-family:Arial,sans-serif;color:#151b33;font-size:9pt}
  .hd{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1c2b6e;padding-bottom:6px;margin-bottom:8px}.hd img{height:40px}
  h1{font-size:13pt;color:#1c2b6e;margin:6px 0 2px}.sub{font-size:9pt;color:#5b6475;margin-bottom:4px}.ctx{font-size:8.5pt;margin:4px 0 8px}
  table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #9aa1b8;padding:5px;vertical-align:top;font-size:8pt}
  th{font-size:8.5pt}td.c{background:#f3f6f9;font-weight:bold;color:#1c2b6e}td.a{background:#f3f6f9}
  .foot{margin-top:8px;font-size:8pt}.id{margin-top:14px;font-size:9pt}</style></head><body>
  <div class="hd"><img src="img/logo-rf-aefe.png"><img src="img/logo-pierre-loti.png"></div>
  <h1>${esc($('#gTitle').value)}</h1><div class="sub">Champ d'apprentissage 4 · Conduire et maîtriser un affrontement individuel ou collectif</div><div class="ctx">${esc(G.ctx)}</div>
  <table><tr><th style="background:#e8eff5;width:15%">Critères / compétences</th><th style="background:#e8eff5;width:15%">Lien avec les attendus</th>${DEG.map((d,i)=>`<th style="background:${cols[i]};color:${fg[i]}">${d}</th>`).join('')}</tr>
  ${G.rows.map(r=>`<tr><td class="c">${esc(r.c)}</td><td class="a">${esc(r.a)}</td>${r.d.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table>
  <div class="foot">Repère : le niveau « satisfaisant » correspond aux acquisitions attendues à l'issue de la séquence. La grille est utilisable en évaluation formative ou sommative.</div>
  <div class="id">Élève : ______________________________ Classe : __________ Date : ____________</div>
  <script>setTimeout(()=>print(),400)<\/script></body></html>`);
  w.document.close();
};
drawG();

resList('#ttRes', 'tt', [
  ['Séquence Pierre Loti (version retravaillée)', 'sequence-tt-pierre-loti.docx', 'Word · 10 leçons détaillées'],
  ['Grille d\'évaluation cycle 4', 'grille-tt-cycle-4.docx', 'Word · modèle de l\'établissement'],
  ['Synthèse de la séquence', 'synthese-sequence-tt.docx', 'Word · tableau par leçon'],
  ['Situation de référence', 'situation-de-reference-tt.docx', 'Word · match 20 points'],
  ['Fiches situations', 'fiches-situations-tt.docx', 'Word · 5 situations'],
  ['Fiches rôles', 'fiches-roles-tt.docx', 'Word · arbitre et coach'],
  ['Grille de Première (à reconstruire)', 'grille-premiere-a-reconstruire.docx', 'Word · contient l\'acrosport'],
  ['Évaluation DNB tennis de table', 'eval-dnb-tennis-de-table.pdf', 'PDF · repères nationaux'],
  ['Groupe CP4 · tennis de table', 'groupe-cp4-tennis-de-table.pdf', 'PDF · ressource']
]);

/* ================= VTT ================= */
const resetV = checks('#vttCheck', 'vttCheck', ['Casque ajusté et attaché', 'Frein avant efficace', 'Frein arrière efficace', 'Colonne de direction sans jeu', 'Taille du vélo adaptée à l\'élève', 'Pression des pneus correcte', 'Serrages rapides fermés', 'Passage des vitesses', 'Embouts de cintre bouchés', 'Trousse de réparation et trousse de secours prêtes']);
$('#vttCheckReset').onclick = resetV;
resList('#vttRes', 'vtt', [
  ['Check-list sécurité VTT', 'check-list-securite-vtt.pdf', 'PDF · avant, pendant, après'],
  ['Fiche « Diagnostiquer son vélo »', 'fiche-diagnostiquer-son-velo.pdf', 'PDF · format A5'],
  ['Séquence VTT lycée', 'sequence-vtt-lycee.docx', 'Word · 10 leçons'],
  ['Ateliers VTT par axe', 'ateliers-vtt-lycee.docx', 'Word · maniabilité, pilotage, effort, entretien'],
  ['Grille formative VTT lycée', 'grille-formative-vtt-lycee.docx', 'Word'],
  ['Grille VTT cycle 4', 'grille-vtt-cycle-4.docx', 'Word']
]);

/* ================= COURSE D'ORIENTATION ================= */
const SITS_CO = [
  {f:'Découverte', t:'Parcours en étoile', but:'Établir la relation entre le plan et le terrain, orienter son plan, se situer.', disp:'Des balises autour d\'un point de départ, une balise par aller-retour. Milieux de plus en plus éloignés et chargés d\'incertitude : cour, parc, forêt.', cr:'Ramener toutes les preuves de passage.', s:'Balises visibles depuis le départ.', c:'Espace plus grand, temps limité.', src:'ressources/co/parcours-en-etoile.docx'},
  {f:'Découverte', t:'Papillon et recherche photographique', but:'Lire le plan et identifier précisément un lieu.', disp:'Séries de 4 balises en commençant par celle entourée. Sur chaque lieu, retrouver dans le cahier la photo prise depuis cet endroit, puis revenir se faire valider.', cr:'Toutes les photos correctement associées aux balises.', s:'Moins de photos proposées.', c:'Photos prises sous des angles plus difficiles.', src:'ressources/co/papillon-recherche-photo.docx'},
  {f:'Précision', t:'Azimut et distance en relais', but:'Se déplacer à l\'azimut et à la distance, utiliser les définitions de postes.', disp:'Parcours de 0,7 km à Tarabya en relais. Les définitions de postes indiquent l\'élément (clôture, coude, croisement de chemins).', cr:'Postes trouvés dans l\'ordre, dernier trajet de 50 m non balisé réussi.', s:'Distances courtes, éléments très visibles.', c:'Postes plus fins, trajets plus longs.', src:'ressources/co/azimut-distance-relais.pdf'},
  {f:'Choix', t:'Course au score', but:'Choisir son itinéraire selon la valeur des postes et le temps disponible.', disp:'Postes de valeurs différentes selon la difficulté, temps limité, pénalités de retard. Format courant des référentiels de lycée.', cr:'Score en hausse sans pénalité de retard.', s:'Plus de temps, peu de postes difficiles.', c:'Barème plus serré, postes pièges.', src:'ressources/co/referentiel-bac-co-exemple.pdf'}
];
sits('#coFilters', '#coSits', SITS_CO);
checks('#ppCheck', 'ppCheck', ['Créer un nouvel événement et charger la carte (OCAD, OMAP, PDF ou image)', 'Vérifier l\'échelle de la carte', 'Placer le départ, les postes et l\'arrivée', 'Créer les circuits : ajouter les postes dans l\'ordre', 'Saisir les définitions de postes (symboles)', 'Contrôler les longueurs et la numérotation', 'Imprimer les cartes et les définitions, ou exporter en PDF', 'Préparer les cartons de contrôle et le corrigé']);
checks('#coChecks', 'coChecks', ['Les critères distinguent la lecture de carte de la vitesse de course', 'Les indicateurs se relèvent pendant la course (carton de contrôle, temps, postes)', 'La sécurité est exigée avant d\'être évaluée', 'La même grille peut servir en 6e et en 3e, avec des degrés différents', 'L\'élève peut se situer seul dans la grille']);
resList('#coRes', 'co', [
  ['Grille d\'évaluation cycle 4', 'evaluation-co-cycle-4.docx', 'Word · 5 critères'],
  ['Évaluation DNB course d\'orientation', 'eval-dnb-course-orientation.pdf', 'PDF · repères nationaux'],
  ['Exemple de référentiel bac CA2', 'referentiel-bac-co-exemple.pdf', 'PDF'],
  ['Parcours en étoile', 'parcours-en-etoile.docx', 'Word · fiche situation'],
  ['Papillon et recherche photo', 'papillon-recherche-photo.docx', 'Word · avec photos'],
  ['Azimut et distance en relais', 'azimut-distance-relais.pdf', 'PDF · Tarabya'],
  ['Définitions de postes', 'tous-postes.pdf', 'PDF'],
  ['Formation CO (mars 2025)', 'formation-co-zenos-2025.pdf', 'PDF · diaporama'],
  ['Exemple de carte de lycée', 'carte-co-lycee-exemple.pdf', 'PDF']
]);

/* ================= CROSS-TRAINING ================= */
const P5 = [['Corde à sauter (single under)',1],['Air squat',2],['Fentes alternées',2],['Montées sur banc',2],['Abdominaux (sit-up)',2],['Mountain climbers',1],['Dips sur banc',3],['Pompes',4],['Wall ball',4],['Burpees',5]];
let p5 = store.get('p5', {});
$('#p5List').innerHTML = P5.map(([n,c],i) => `<div class="p5r"><div><b>${n}</b><small>${c} pt${c>1?'s':''} / répétition · ${Math.ceil(50/c)} rép. pour 50 pts</small></div><div class="qty"><button data-i="${i}" data-d="-5">−</button><input type="number" min="0" data-i="${i}" value="${p5[i]||0}"><button data-i="${i}" data-d="5">+</button></div><span class="pp" id="p5p${i}">0</span></div>`).join('');
function drawP5(){
  let tot = 0; P5.forEach(([n,c],i) => { const v = (p5[i]||0)*c; tot += v; $('#p5p'+i).textContent = v + ' pts'; });
  $('#p5Pts').textContent = tot; $('#p5Bar').style.width = Math.min(100, tot/5) + '%';
  $('#p5Pts').parentElement.classList.toggle('ok', tot >= 500); store.set('p5', p5);
}
$('#p5List').addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; const i = +b.dataset.i; p5[i] = Math.max(0, (p5[i]||0) + +b.dataset.d); b.parentElement.querySelector('input').value = p5[i]; drawP5(); });
$('#p5List').addEventListener('input', e => { const t = e.target.closest('input'); if(!t) return; p5[+t.dataset.i] = Math.max(0, +t.value||0); drawP5(); });
drawP5();

/* juge */
let jr = [];
function drawJ(){ const r = jr.filter(x=>x).length, n = jr.length - r; $('#jR').textContent = r; $('#jN').textContent = n; $('#jPct').textContent = jr.length ? `${Math.round(n/jr.length*100)} % de no rep` : ''; }
$('#jRep').onclick = () => { jr.push(1); drawJ(); if(navigator.vibrate) navigator.vibrate(10); };
$('#jNo').onclick = () => { jr.push(0); drawJ(); if(navigator.vibrate) navigator.vibrate([30,40,30]); };
$('#jUndo').onclick = () => { jr.pop(); drawJ(); };
$('#jReset').onclick = () => { jr = []; drawJ(); };

checks('#crChecks', 'crChecks', ['Le « no rep » est défini pour chaque mouvement utilisé', 'Le rôle de juge est appris avant d\'être évalué', 'Les trois rôles sont observables dans une leçon d\'une heure', 'L\'échauffement est évalué à partir d\'un indicateur observable', 'L\'élève comprend la cotation sans l\'aide du professeur']);
resList('#crRes', 'cross', [
  ['Tâche complexe et cross-training', 'tache-complexe-cross-training.pdf', 'PDF · démarche et situations'],
  ['Repères de progression cycle 4', 'evaluation-cross-training-cycle-4.docx', 'Word · athlète, coach, juge'],
  ['Fiche d\'échauffement élève', 'fiche-echauffement-eleve.pdf', 'PDF']
]);
})();
