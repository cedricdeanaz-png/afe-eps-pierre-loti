/* Référentiel des pas — d'après « Les différents pas en STEP » (fiches de l'équipe EPS).
   t = nombre de temps · ch = change le pied directeur · cote = change de côté du step
   Description donnée pour un départ pied droit. */
const PAS_STEP = [
  // 4 temps sans changement de pied directeur
  {n:'Basic', t:4, ch:false, fam:'4 temps sans changement', d:"Monte pied droit dans l'axe, monte pied gauche à côté, descend pied droit, assemble pied gauche.", r:"Pied entier au milieu du step, j'amortis en descendant."},
  {n:'Mambo', t:4, ch:false, fam:'4 temps sans changement', d:"Pose pied droit devant sans monter, appui pied gauche, pose pied droit en arrière, appui pied gauche.", r:"Bassin à la verticale des appuis."},
  {n:'V-step', t:4, ch:false, fam:'4 temps sans changement', d:"Monte pied droit sur le bord droit, pied gauche sur le bord gauche, descend pied droit dans l'axe, assemble pied gauche.", r:"J'écarte en montant, je resserre en descendant."},
  {n:'Jazzsquare', t:4, ch:false, fam:'4 temps sans changement', d:"Monte pied droit au milieu, pied gauche croise devant, descend pied droit en arrière, descend pied gauche.", r:"Je croise sur le step, je décroise en descendant."},
  {n:'Reverse', t:4, ch:false, fam:'4 temps sans changement', tour:true, d:"Basic en réalisant un tour complet : ½ tour en montant, ½ tour en descendant.", r:"Je termine face au step."},
  // 4 temps avec changement de pied directeur
  {n:'Tap up', t:4, ch:true, fam:'4 temps avec changement', d:"Monte pied droit, tape pied gauche sur le step, descend pied gauche, assemble pied droit.", r:"Pied entier au milieu du step."},
  {n:'Tap down', t:4, ch:true, fam:'4 temps avec changement', d:"Monte pied droit, monte pied gauche, descend pied droit, tape pied gauche au sol.", r:"J'amortis en descendant."},
  {n:'Genou', t:4, ch:true, fam:'4 temps avec changement', d:"Monte pied droit, pousse et monte le genou gauche, descend pied gauche, assemble pied droit.", r:"Genou à hauteur de hanche."},
  {n:'Talon-fesse', t:4, ch:true, fam:'4 temps avec changement', v:'Genou', d:"Comme le Genou, le talon gauche monte vers la fesse.", r:"Talon proche de la fesse."},
  {n:'Kick', t:4, ch:true, fam:'4 temps avec changement', v:'Genou', d:"Comme le Genou, la jambe gauche donne un coup de pied devant.", r:"Jambe d'appui gainée."},
  {n:'Jambe tendue', t:4, ch:true, fam:'4 temps avec changement', v:'Genou', d:"Comme le Genou, la jambe gauche monte tendue.", r:"Buste redressé."},
  {n:'Traverse', t:4, ch:true, cote:true, fam:'4 temps avec changement', d:"Départ de profil : monte pied droit, pose pied gauche, descend pied droit de l'autre côté, assemble pied gauche.", r:"Je commence et je finis parallèle au step."},
  {n:'Mambo chachacha', t:4, ch:true, fam:'4 temps avec changement', d:"Mambo avec un contretemps : pose pied gauche et ramène pied droit à côté.", r:"Contretemps sur le « et »."},
  {n:'Talon-fesse-traverse', t:4, ch:true, cote:true, tour:true, fam:'4 temps avec changement', d:"Monte pied droit de profil (¼ tour), talon gauche vers la fesse, descend pied gauche de l'autre côté, assemble pied droit.", r:"¼ tour en montant, ¼ tour en descendant."},
  {n:'V-step-tournant', t:4, ch:true, tour:true, fam:'4 temps avec changement', d:"V-step, la descente se fait de profil (¼ tour).", r:"Je finis parallèle au step."},
  // 8 temps sans changement de pied directeur
  {n:'Cheval', t:8, ch:false, fam:'8 temps sans changement', d:"De profil : monte D, monte G, descend D à côté du step, descend G de l'autre côté, remonte D, remonte G, descend D face au step, descend G.", r:"Pieds dans l'axe de la longueur du step."},
  {n:'Lunge', t:8, ch:false, fam:'8 temps sans changement', d:"Monte D, monte G, tape D derrière, remonte D, tape G derrière, remonte G, descend D, descend G.", r:"Genou dans l'axe quand je fléchis."},
  {n:'Cheval-Genou', t:8, ch:false, fam:'8 temps sans changement', d:"Cheval avec une montée de genou sur chaque passage sur le step.", r:"Je termine du même côté, face au step."},
  {n:'L-step-Jazzsquare', t:8, ch:false, fam:'8 temps sans changement', d:"Monte D, tape G, descend G sur le côté, tape D au sol, remonte D, croise G devant, descend D derrière, assemble G.", r:"Début de L-step, retour en Jazzsquare."},
  {n:'Cheval-½ tour', t:8, ch:false, cote:true, tour:true, fam:'8 temps sans changement', d:"Cheval terminé de l'autre côté du step (¼ tour en descendant).", r:"Variante : tour du monde sur 16 temps."},
  {n:'Reverse-cheval', t:8, ch:false, tour:true, fam:'8 temps sans changement', d:"½ tour en montant, cheval, ¼ tour en remontant, je termine face au step.", r:"Je tourne toujours dans le même sens."},
  // 8 temps avec changement de pied directeur
  {n:'3 Genoux', t:8, ch:true, fam:'8 temps avec changement', d:"Monte D sur le côté gauche, 3 montées de genou gauche avec pose du pied gauche en arrière, assemble D.", r:"Genou à hauteur de hanche à chaque montée."},
  {n:'3 Talon-fesse', t:8, ch:true, fam:'8 temps avec changement', v:'3 Genoux', d:"Comme 3 Genoux avec 3 talons-fesses.", r:"Talon proche de la fesse."},
  {n:'L-step', t:8, ch:true, fam:'8 temps avec changement', d:"Monte D, tape G, descend G sur le côté, tape D au sol, remonte D, tape G, descend G derrière, assemble D.", r:"Je fais la même chose en sens inverse pour revenir."},
  {n:'Genou-Twist-Genou', t:8, ch:true, fam:'8 temps avec changement', d:"Genou gauche, pose G en arrière, twist du genou droit, repose D, genou gauche, descend G, assemble D.", r:"Je lève le talon pour le twist."},
  {n:'L-step-Genou', t:8, ch:true, fam:'8 temps avec changement', d:"L-step où les taps du pied gauche sont remplacés par des montées de genou.", r:"Genoux à hauteur de hanche."},
  {n:'L-step-Traverse', t:8, ch:true, cote:true, fam:'8 temps avec changement', d:"Monte D, tape G, descend G sur le côté, tape D au sol, remonte D au milieu, pose G, descend D de l'autre côté, assemble G.", r:"Je traverse le step dans la longueur."},
  {n:'3 Genoux-½ tour', t:8, ch:true, tour:true, fam:'8 temps avec changement', d:"3 Genoux en pivotant : le pied gauche se pose de l'autre côté du step entre les montées.", r:"Je pivote en levant le talon."}
];
const HIA_STEP = ['en courant', 'avec impulsion', 'en sautant'];
