(() => {
  'use strict';

  // ---------- constants ----------
  // state keys saved to localStorage (prefixed "ict_")
  const KEYS = ['logs', 'archive', 'timers', 'view', 'unit', 'lang', 'durLink', 'useCons', 'useCountdown', 'cdMinutes', 'feedDefault', 'useNap', 'napMin', 'napMax', 'napLimit'];
  const THEME = {
    sleep: { c: '#8b93ff', ink: '#16122a', tx: '#aab1ff', shadow: '#4f55b8', dim: 'rgba(139,147,255,.4)', emoji: '🌙' },
    eat: { c: '#ffb14e', ink: '#2e1c08', tx: '#ffc06a', shadow: '#b87a2b', dim: 'rgba(255,177,78,.42)', emoji: '🍼' },
    poop: { c: '#e7895c', ink: '#2e1408', tx: '#f0a07a', shadow: '#a85c38', dim: 'rgba(231,137,92,.44)', emoji: '💩' },
    obs: { c: '#c792ea', ink: '#2a1236', tx: '#d9b3f2', shadow: '#8a5aa8', emoji: '📝' }
  };
  const TYPES = ['sleep', 'eat', 'poop', 'obs'];
  const SLEEP_MODES = [
    { key: 'couche', emoji: '🛏️', fr: 'Couché', en: 'In bed' },
    { key: 'portage', emoji: '🤗', fr: 'Portage', en: 'Carried' },
    { key: 'sein', emoji: '🤱', fr: 'Au sein', en: 'At the breast' }
  ];
  const OBS_KINDS = [
    { key: 'spitup', emoji: '💧', fr: 'Régurgitation', en: 'Spit-up' },
    { key: 'feedcry', emoji: '😭', fr: 'Pleurs pendant le repas', en: 'Crying during feed' },
    { key: 'arch', emoji: '😣', fr: 'Grimaces ou dos cambré', en: 'Grimacing or arched back' },
    { key: 'hiccup', emoji: '🫧', fr: 'Hoquet', en: 'Hiccups' },
    { key: 'cough', emoji: '😷', fr: 'Toux', en: 'Cough' },
    { key: 'wakecry', emoji: '😢', fr: 'Réveil en pleurs', en: 'Woke up crying' }
  ];
  const CONSISTENCIES = [
    { key: 'liquid', emoji: '💧', fr: 'Liquide', en: 'Liquid' },
    { key: 'puree', emoji: '🥣', fr: 'Purée', en: 'Mushy' },
    { key: 'solid', emoji: '🟤', fr: 'Solide', en: 'Solid' }
  ];
  const EAT_COLORS = { bottle: THEME.eat.c, breast: '#ffd9a0' };   // charts: bottle vs breastfeed
  const POOP_SIZES = ['small', 'medium', 'large', 'xl'];
  const DAY = 86400000;
  const ML_PER_OZ = 29.5735;
  const RESUME_WINDOW_MS = 20 * 60000;   // a stopped timer can be resumed for 20 minutes
  // numbers typed in Settings (minutes): default, allowed range and the +/- step of the buttons
  const NUM_FIELDS = {
    cdMinutes: { def: 15, min: 1, max: 180, step: 1 },   // sleep countdown length
    napMin: { def: 90, min: 1, max: 600, step: 5 },      // best time before a nap: from
    napMax: { def: 120, min: 1, max: 600, step: 5 },     // best time before a nap: to
    napLimit: { def: 150, min: 1, max: 600, step: 5 }    // maximum time awake
  };

  const STR = {
    fr: {
      sleeping: 'Dodo', eating: 'Repas', pooping: 'Caca',
      tapStart: 'Appuyez pour lancer le chrono', tapPoop: 'Appuyez pour enregistrer',
      noSleep: 'Aucun dodo enregistré.', noEat: 'Aucun repas enregistré.', noPoop: 'Aucun caca enregistré.', noObs: 'Aucune remarque notée.',
      copySleep: 'Copier les dodos', copyEat: 'Copier les repas', copyPoop: 'Copier les cacas', copyObs: 'Copier les remarques', clear: 'Effacer',
      copyAll: 'Copier toutes les données', deleteAll: 'Tout supprimer',
      cancel: 'Annuler', save: 'Enregistrer', edit: 'Modifier',
      dateTime: 'Date et heure', duration: 'Durée', size: 'Taille', milkLabel: 'Lait dans le biberon',
      howBig: 'Quelle taille ?', small: 'Petit', medium: 'Moyen', large: 'Gros', xl: 'Très gros',
      menu: 'Menu', discard: 'Abandonner', start: 'Lancer le chrono', stop: 'Arrêter et enregistrer',
      pause: 'Pause', resume: 'Reprendre', ready: 'Prêt', recording: 'En cours', paused: 'En pause',
      feeding: 'Repas', sleepingNow: 'Dodo', breastfeeding: 'Allaitement', bottle: 'Biberon', left: 'Gauche', right: 'Droit', endTime: 'Heure de fin',
      whichSide: 'Quel sein ?', chronoAdjust: 'Timer', startAdjust: 'Heure de départ', obsQuick: 'Noter une remarque',
      sleepType: 'Type de dodo', sleepNone: 'Choisir…',
      settings: 'Paramètres', archive: 'Archives', language: 'Langue', volumeUnit: 'Unité de volume',
      durLink: 'La durée modifie l’heure de fin',
      durLinkHelp: 'Activé : changer la durée d’une entrée déplace son heure de fin. Désactivé : seule la durée change, et un avertissement s’affiche à l’enregistrement si les heures ne correspondent plus.',
      mismatchTitle: 'Les heures ne correspondent plus',
      mismatchBody: (exp, rec) => `Début + durée donnent une fin à ${exp}, mais l’heure de fin enregistrée est ${rec}.`,
      mismatchContinue: 'Continuer la modification', mismatchSave: 'Enregistrer tel quel',
      snack: 'En-cas', fullBottle: 'Biberon',
      startedSince: { sleep: 'Dodo commencé depuis', bottle: 'Biberon commencé depuis', breast: 'Allaitement commencé depuis' }, ago: '',
      trends: 'Tendances', back: 'Retour', mSleep: 'Dodo', mEat: 'Repas', mPoop: 'Cacas',
      no7: 'Aucune donnée sur les 7 derniers jours.', tapDay: 'Appuyez sur un jour pour voir le détail sur 24 h',
      d7: '7 jours', noDay: 'Aucune entrée ce jour pour cette vue.', today: 'Auj.',
      hSleep: 'Sommeil · 7 derniers jours', hMilk: 'Lait · 7 derniers jours', hPoop: 'Cacas · 7 derniers jours',
      wSleep: 'Dodo', wPoop: 'Caca', wObs: 'Remarque',
      anomaly: 'Anomalie', anomalyKind: 'Type d’anomalie', anomalyPlaceholder: 'Précisez l’anomalie',
      anomLabel: 'Anomalie', anomColor: 'couleur', anomBlood: 'sang', anomOther: 'autre', anomOtherBtn: 'Autre', anomColorBtn: 'Couleur', anomBloodBtn: 'Sang',
      delAllTitle: 'Tout supprimer ?', delAllBody: 'Toutes les entrées (dodos, repas, cacas, remarques) seront définitivement effacées. Action irréversible.',
      clearTitle: { sleep: 'Effacer les dodos ?', eat: 'Effacer les repas ?', poop: 'Effacer les cacas ?', obs: 'Effacer les remarques ?' },
      clearBody: 'Ces entrées seront définitivement supprimées. Action irréversible.',
      delAllCta: 'Tout supprimer', clearCta: 'Effacer',
      kind: { sleep: 'dodo', eat: 'repas', poop: 'caca', obs: 'remarque' },
      copied: 'Copié dans le presse-papiers', copyFail: 'Accès au presse-papiers impossible',
      nothingCopy: 'Rien à copier', entryUpdated: 'Entrée mise à jour', badDate: 'Entrez une date et heure valides',
      allDeleted: 'Toutes les données supprimées', cleared: 'Effacé',
      obs: 'Remarques', obsSub: 'Appuyez pour noter une remarque',
      obsWhat: 'Que se passe-t-il ?', obsHint: 'Un appui enregistre à l’heure actuelle', obsKind: 'Remarque',
      obsLogged: 'Remarque notée · copiée ✓',
      poopLogged: 'Caca enregistré · copié 💩',
      allEntries: 'Toutes les entrées', actions: 'Actions', less: 'Réduire', showActions: 'Afficher les actions',
      feedDefault: 'Type de repas par défaut', feedDefaultHelp: 'Choix présélectionné à l’ouverture d’un nouveau repas ; modifiable à tout moment dans le chrono.',
      breastVolume: 'Volume bu au sein', sideRequired: 'Indiquez le sein pour enregistrer l’allaitement.',
      napSetTitle: 'Temps optimal avant la sieste',
      napHelp: 'Affiche sur l’accueil une barre qui suit le temps écoulé depuis la fin du dernier dodo : grise avant la durée optimale, verte pendant, orange jusqu’à la limite, puis rouge. Les durées sont en minutes.',
      napMin: 'Durée optimale min', napMax: 'Durée optimale max', napLimit: 'Limite max',
      napTitle: 'Moment idéal pour le dodo', napEarly: 'Pas encore l’heure', napIdeal: 'C’est le moment !', napLate: 'Il est temps !', napOver: 'Limite dépassée',
      napSleeping: 'Bébé dort', napNone: 'Aucun dodo enregistré', napAwake: (t) => `Éveillé depuis ${t}`,
      confirm: 'Valider', consistency: 'Consistance', typeName: { sleep: 'Dodo', eat: 'Repas' },
      startNow: 'Lancer maintenant', countdown: 'Compte à rebours', cdStatus: '⏳ Le dodo démarre dans', cdSub: 'Départ dans',
      cdAria: (n) => `Compte à rebours de ${n} minutes`,
      startedAt: 'Début', fromTime: 'dès', savedSuffix: ' enregistré · copié ✓',
      consTitle: 'Consistance des cacas',
      consHelp: 'Activé : choisir Liquide, Purée ou Solide en plus de la taille. Désactivé : seule la taille est demandée (les consistances déjà saisies sont conservées).',
      cdTitle: 'Compte à rebours avant le dodo',
      cdHelp: 'Activé : un bouton « Compte à rebours » permet de lancer le chrono dodo après le délai choisi. Désactivé : le bouton disparaît.',
      cdLength: 'Durée du décompte', minutes: 'Minutes',
      switchTitle: (ct) => `Un chrono ${ct} est déjà en cours`,
      switchBody: (nt) => `Voulez-vous l’arrêter et l’enregistrer pour lancer le ${nt}, ou garder les deux chronos en même temps ?`,
      switchStop: (ct, nt) => `Arrêter le ${ct} et lancer le ${nt}`, keepBoth: 'Garder les deux en même temps',
      copiedN: (n) => `${n} entrée${n > 1 ? 's' : ''} copiée${n > 1 ? 's' : ''}`, copiedAll: (n) => `Les ${n} entrées ont été copiées`,
      more: (n) => `+${n} entrée${n > 1 ? 's' : ''}`, showMore: (n) => (n === 1 ? 'Voir l’autre entrée' : `Voir les ${n} autres`),
      all: 'Tout', newestFirst: '↓ Récentes d’abord', oldestFirst: '↑ Anciennes d’abord',
      noEntryType: 'Aucune entrée de ce type.', noEntry: 'Aucune entrée pour le moment.',
      times: 'x', sideWord: { left: 'sein gauche', right: 'sein droit' },
      avgSleep: (v) => `moy ${v} h par jour`, avgPoop: (v) => `moy ${v} par jour`,
      sumEat: (feeds, ml) => `${feeds} repas · moy ${ml} ml par jour`,
      last3w: '3 dernières semaines', daysWithData: (d) => `${d} jour${d > 1 ? 's' : ''} avec données`, peakAt: (h) => `pic vers ${h}h`,
      eatDistTitle: 'Répartition des repas sur la journée', poopDistTitle: 'Répartition moyenne sur la journée', noData: 'Aucune donnée',
      sleepFreqTitle: 'Fréquence par heure de début', sleepFreqSub: (n) => `${n} dodos sur 3 semaines`, sleepsStarted: 'Dodos commencés',
      durTitle: 'Durée selon l’heure de début', durDesc: 'Chaque point est un dodo : plus il est haut, plus il a duré. Les points qui s’empilent montrent les horaires habituels.',
      last7: '7 derniers jours', earlier: 'Avant',
      volTitle: 'Volume selon l’heure de début', volDesc: 'Chaque point est un repas : plus il est haut, plus bébé a bu. Les points qui s’empilent montrent les horaires habituels.',
      daySleep: (h, n) => `${h} h de sommeil · ${n} dodo${n === 1 ? '' : 's'}`, dayEat: (ml, n) => `${ml} ml · ${n} repas`, dayPoop: (n) => `${n} caca${n === 1 ? '' : 's'}`,
      ax: ['0h', '6h', '12h', '18h', '24h']
    },
    en: {
      sleeping: 'Sleeping', eating: 'Eating', pooping: 'Pooping',
      tapStart: 'Tap to start the timer', tapPoop: 'Tap to log it right now',
      noSleep: 'No sleeps logged yet.', noEat: 'No feeds logged yet.', noPoop: 'No poops logged yet.', noObs: 'No remarks logged yet.',
      copySleep: 'Copy sleep data', copyEat: 'Copy feed data', copyPoop: 'Copy poop data', copyObs: 'Copy notes', clear: 'Clear',
      copyAll: 'Copy all data', deleteAll: 'Delete all data',
      cancel: 'Cancel', save: 'Save', edit: 'Edit',
      dateTime: 'Date & time', duration: 'Duration', size: 'Size', milkLabel: 'Milk in the bottle',
      howBig: 'How big was it?', small: 'Small', medium: 'Medium', large: 'Large', xl: 'XL',
      menu: 'Menu', discard: 'Discard', start: 'Start timer', stop: 'Stop & save',
      pause: 'Pause', resume: 'Resume', ready: 'Ready', recording: 'Recording', paused: 'Paused',
      feeding: 'Feeding', sleepingNow: 'Sleeping', breastfeeding: 'Breastfeeding', bottle: 'Bottle', left: 'Left', right: 'Right', endTime: 'End time',
      whichSide: 'Which side?', chronoAdjust: 'Timer', startAdjust: 'Start time', obsQuick: 'Log a remark',
      sleepType: 'Sleep type', sleepNone: 'Choose…',
      settings: 'Settings', archive: 'Archive', language: 'Language', volumeUnit: 'Volume unit',
      durLink: 'Duration changes the end time',
      durLinkHelp: 'On: changing an entry’s duration moves its end time. Off: only the duration changes, and a warning appears when saving if the times no longer match.',
      mismatchTitle: 'The times no longer match',
      mismatchBody: (exp, rec) => `Start + duration gives an end at ${exp}, but the saved end time is ${rec}.`,
      mismatchContinue: 'Keep editing', mismatchSave: 'Save as is',
      snack: 'Snack', fullBottle: 'Bottle',
      startedSince: { sleep: 'Sleep started', bottle: 'Bottle started', breast: 'Breastfeed started' }, ago: ' ago',
      trends: 'Trends', back: 'Back', mSleep: 'Sleep', mEat: 'Feeds', mPoop: 'Poops',
      no7: 'No data in the last 7 days yet.', tapDay: 'Tap a day to see its 24-hour view',
      d7: '7 days', noDay: 'No entries on this day for this view.', today: 'Today',
      hSleep: 'Sleep · last 7 days', hMilk: 'Milk · last 7 days', hPoop: 'Poops · last 7 days',
      wSleep: 'Sleep', wPoop: 'Poop', wObs: 'Note',
      anomaly: 'Anomaly', anomalyKind: 'Anomaly type', anomalyPlaceholder: 'Describe the anomaly',
      anomLabel: 'Anomaly', anomColor: 'color', anomBlood: 'blood', anomOther: 'other', anomOtherBtn: 'Other', anomColorBtn: 'Color', anomBloodBtn: 'Blood',
      delAllTitle: 'Delete all data?', delAllBody: 'This permanently erases every sleep, feed, poop and note entry. This can’t be undone.',
      clearTitle: { sleep: 'Clear sleep data?', eat: 'Clear feed data?', poop: 'Clear poop data?', obs: 'Clear notes?' },
      clearBody: 'This permanently removes these entries. This can’t be undone.',
      delAllCta: 'Delete all', clearCta: 'Clear',
      kind: { sleep: 'sleep', eat: 'feed', poop: 'poop', obs: 'note' },
      copied: 'Copied to clipboard', copyFail: 'Couldn’t access clipboard',
      nothingCopy: 'Nothing to copy', entryUpdated: 'Entry updated', badDate: 'Enter a valid date & time',
      allDeleted: 'All data deleted', cleared: 'Cleared',
      obs: 'Notes', obsSub: 'Tap to log a remark',
      obsWhat: 'What’s happening?', obsHint: 'One tap logs it at the current time', obsKind: 'Remark',
      obsLogged: 'Note logged · copied ✓',
      poopLogged: 'Poop logged · copied 💩',
      allEntries: 'All entries', actions: 'Actions', less: 'Show less', showActions: 'Show actions',
      feedDefault: 'Default feed type', feedDefaultHelp: 'Preselected when a new feed is opened; can still be changed at any time in the timer.',
      breastVolume: 'Volume drunk at the breast', sideRequired: 'Pick the side to save the breastfeed.',
      napSetTitle: 'Best time before a nap',
      napHelp: 'Shows a bar on the home screen that follows the time since the last sleep ended: grey before the best time, green during it, orange up to the limit, then red. Durations are in minutes.',
      napMin: 'Best time from (min)', napMax: 'Best time to (min)', napLimit: 'Maximum limit (min)',
      napTitle: 'Best time for sleep', napEarly: 'Not yet', napIdeal: 'Now is the time!', napLate: 'Getting late', napOver: 'Limit passed',
      napSleeping: 'Baby is asleep', napNone: 'No sleep logged yet', napAwake: (t) => `Awake for ${t}`,
      confirm: 'Confirm', consistency: 'Consistency', typeName: { sleep: 'Sleep', eat: 'Feed' },
      startNow: 'Start now', countdown: 'Countdown', cdStatus: '⏳ Sleep starts in', cdSub: 'Starts in',
      cdAria: (n) => `${n} minute countdown`,
      startedAt: 'Started', fromTime: 'from', savedSuffix: ' saved · copied ✓',
      consTitle: 'Poop consistency',
      consHelp: 'On: pick Liquid, Mushy or Solid along with the size. Off: only the size is asked (consistencies already logged are kept).',
      cdTitle: 'Sleep countdown',
      cdHelp: 'On: a “Countdown” button starts the sleep timer after the chosen delay. Off: the button is hidden.',
      cdLength: 'Countdown length', minutes: 'Minutes',
      switchTitle: (ct) => `A ${ct} timer is already running`,
      switchBody: (nt) => `Do you want to stop and save it to start the ${nt}, or keep both timers running at the same time?`,
      switchStop: (ct, nt) => `Stop ${ct} and start ${nt}`, keepBoth: 'Keep both running',
      copiedN: (n) => `Copied ${n} entr${n > 1 ? 'ies' : 'y'}`, copiedAll: (n) => `Copied all ${n} entries`,
      more: (n) => `+${n} more`, showMore: (n) => `Show ${n} more`,
      all: 'All', newestFirst: '↓ Newest first', oldestFirst: '↑ Oldest first',
      noEntryType: 'No entries of this type.', noEntry: 'No entries yet.',
      times: '×', sideWord: { left: 'left breast', right: 'right breast' },
      avgSleep: (v) => `avg ${v}h per day`, avgPoop: (v) => `avg ${v} per day`,
      sumEat: (feeds, ml) => `${feeds} feeds · avg ${ml} ml per day`,
      last3w: 'Last 3 weeks', daysWithData: (d) => `${d} day${d > 1 ? 's' : ''} with data`, peakAt: (h) => `peak around ${h}:00`,
      eatDistTitle: 'Feed distribution over the day', poopDistTitle: 'Average distribution over the day', noData: 'No data yet',
      sleepFreqTitle: 'Frequency by start hour', sleepFreqSub: (n) => `${n} sleeps over 3 weeks`, sleepsStarted: 'Sleeps started',
      durTitle: 'Duration by start time', durDesc: 'Each dot is a sleep: the higher, the longer. Stacked dots show usual times.',
      last7: 'Last 7 days', earlier: 'Earlier',
      volTitle: 'Volume by start time', volDesc: 'Each dot is a feed: the higher, the more baby drank. Stacked dots show usual times.',
      daySleep: (h, n) => `${h}h asleep · ${n} nap${n === 1 ? '' : 's'}`, dayEat: (ml, n) => `${ml} ml · ${n} feed${n === 1 ? '' : 's'}`, dayPoop: (n) => `${n} poop${n === 1 ? '' : 's'}`,
      ax: ['12am', '6am', '12pm', '6pm', '12am']
    }
  };

  // ---------- state ----------
  const load = (k, fallback) => {
    try { const v = localStorage.getItem('ict_' + k); return v == null ? fallback : v; } catch (e) { return fallback; }
  };
  const loadJson = (k, fallback) => { try { return JSON.parse(load(k, 'null')) ?? fallback; } catch (e) { return fallback; } };

  const emptyPoopSel = () => ({ size: '', consistency: '' });

  const state = {
    logs: loadJson('logs', []),
    archive: loadJson('archive', []),
    // one independent timer per kind, so sleep and feed can run at the same time
    timers: loadJson('timers', null) || { sleep: null, eat: null },
    view: load('view', 'home'),
    unit: load('unit', 'ml'),
    lang: load('lang', 'en'),
    durLink: loadJson('durLink', true),
    // optional features, on by default
    useCons: loadJson('useCons', true),
    useCountdown: loadJson('useCountdown', true),
    cdMinutes: loadJson('cdMinutes', NUM_FIELDS.cdMinutes.def),
    useNap: loadJson('useNap', true),             // "best time for a nap" bar on the home screen
    napMin: loadJson('napMin', NUM_FIELDS.napMin.def),
    napMax: loadJson('napMax', NUM_FIELDS.napMax.def),
    napLimit: loadJson('napLimit', NUM_FIELDS.napLimit.def),
    feedDefault: load('feedDefault', 'bottle'),   // what a new feed timer starts on: 'bottle' or 'breast'
    panel: null, mismatchPrompt: false,
    anomalyOn: false, anomalyKind: null, anomalyNote: '',
    toast: '', deleteTarget: null, editDraft: null,
    metric: 'sleep', selectedDay: null, archiveFilter: 'all', archiveSort: 'desc',
    poopPicker: false, poopSel: emptyPoopSel(), obsPicker: false, switchPrompt: null, sidePrompt: null, expanded: {}
  };
  // Upgrade data saved by older builds and make sure every saved value is valid.
  (function migrate() {
    const seen = new Set();
    state.archive = state.archive.filter(e => e && e.id && !seen.has(e.id) && seen.add(e.id));
    // older builds kept a single "active" timer and a separate "true" start time
    const oldActive = loadJson('active', null);
    if (oldActive && oldActive.type && !state.timers[oldActive.type]) state.timers[oldActive.type] = oldActive;
    try { localStorage.removeItem('ict_active'); } catch (e) {}
    Object.values(state.timers).forEach(t => {
      if (t && t.trueStartedAt) { t.startedAt = t.trueStartedAt; delete t.trueStartedAt; }
    });
    if ((state.view === 'sleep' || state.view === 'eat') && !state.timers[state.view]) state.view = 'home';
    if (!['home', 'sleep', 'eat', 'graphs', 'archive', 'settings'].includes(state.view)) state.view = 'home';
    ['durLink', 'useCons', 'useCountdown', 'useNap'].forEach(k => { if (typeof state[k] !== 'boolean') state[k] = true; });
    if (!['bottle', 'breast'].includes(state.feedDefault)) state.feedDefault = 'bottle';
    Object.entries(NUM_FIELDS).forEach(([k, f]) => { if (!(state[k] >= f.min && state[k] <= f.max)) state[k] = f.def; });
    // breastfeed volumes used to be guessed from the duration; they were too inaccurate, so drop them
    const dropGuess = (e) => { if (e && e.estimated) { const c = { ...e }; delete c.milk; delete c.estimated; return c; } return e; };
    state.logs = state.logs.map(dropGuess); state.archive = state.archive.map(dropGuess);
  })();

  const save = () => {
    try {
      KEYS.forEach(k => localStorage.setItem('ict_' + k, typeof state[k] === 'string' ? state[k] : JSON.stringify(state[k])));
    } catch (e) {}
  };
  const set = (patch) => { Object.assign(state, patch); save(); render(); };   // change + persist + redraw
  const upd = (patch) => { Object.assign(state, patch); render(); };           // change + redraw (screen-only state)

  // ---------- helpers ----------
  const L = () => STR[state.lang];
  const fr = () => state.lang === 'fr';
  const locale = () => (fr() ? 'fr-FR' : 'en-US');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const sortDesc = (arr) => [...arr].sort((a, b) => b.timestamp - a.timestamp);
  const clockLabel = (ms) => {
    const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };
  const durLabel = (sec) => {
    if (sec == null) return '';
    sec = Math.round(sec);
    if (sec < 60) return sec + 's';
    const m = Math.floor(sec / 60), s = sec % 60;
    if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60), mm = m % 60;
    return mm ? `${h}h ${mm}m` : `${h}h`;
  };
  const timeOf = (ts, opts) => new Date(ts).toLocaleTimeString(locale(), opts || { hour: 'numeric', minute: '2-digit' });
  const dateOf = (ts) => new Date(ts).toLocaleDateString(locale(), { month: 'short', day: 'numeric' });
  const toLocalInput = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const toMl = (v, u) => { const n = parseFloat(v); return isNaN(n) ? 0 : (u === 'oz' ? n * ML_PER_OZ : n); };
  // hours / minutes / seconds strings of a duration (the edit form keeps them as text)
  const durParts = (secs) => ({ durH: String(Math.floor(secs / 3600)), durM: String(Math.floor((secs % 3600) / 60)), durS: String(secs % 60) });
  const hasDuration = (type) => type !== 'poop' && type !== 'obs';
  const obsLabel = (key) => { const k = OBS_KINDS.find(x => x.key === key); return k ? (fr() ? k.fr : k.en) : ''; };
  const obsEmoji = (key) => { const k = OBS_KINDS.find(x => x.key === key); return k ? k.emoji : '📝'; };
  const anomalyLabelFor = (e) => {
    if (!e.anomaly) return '';
    if (e.anomaly === 'other') return (e.anomalyNote || '').trim() || L().anomOther;
    return e.anomaly === 'color' ? L().anomColor : L().anomBlood;
  };
  const typeLabel = (type) => L().typeName[type];
  const idPrefix = (type) => (type === 'eat' ? 'e' : 's');
  const upsertArchive = (entry) => sortDesc([entry, ...state.archive.filter(l => l.id !== entry.id)]);
  const sideLabel = (side) => (side === 'left' ? L().left : side === 'right' ? L().right : '');
  const consLabel = (key) => { const c = CONSISTENCIES.find(x => x.key === key); return c ? (fr() ? c.fr : c.en) : ''; };
  // "Gros · Purée" for the size and consistency of a poop entry
  const poopDesc = (e) => [e.size ? (L()[e.size] || e.size) : '', consLabel(e.consistency)].filter(Boolean).join(' · ');
  const entryEnd = (e) => e.endTimestamp || (e.timestamp + (e.duration || 0) * 1000);

  const lineFor = (e) => {
    const l = L();
    const date = dateOf(e.timestamp), time = timeOf(e.timestamp);
    const durMin = Math.round((e.duration || 0) / 60);
    const end = timeOf(entryEnd(e));
    if (e.type === 'poop') {
      const size = poopDesc(e) ? ` · ${poopDesc(e)}` : '';
      const anom = e.anomaly ? ` • ${l.anomLabel} : ${anomalyLabelFor(e)}` : '';
      return `${l.wPoop} · ${date} · ${time}${size}${anom}`;
    }
    if (e.type === 'obs') return `${l.wObs} · ${date} · ${time} · ${obsLabel(e.obs)}`;
    if (e.type === 'sleep') return `${l.wSleep} · ${date} · ${time} · ${end} · ${durMin}min${e.mode ? ` · ${sleepModeLabel(e.mode)}` : ''}`;
    if (e.breast) {
      const side = e.side ? l.sideWord[e.side === 'left' ? 'left' : 'right'] : '';
      const tail = [e.milk ? `${e.milk}${e.unit || 'ml'}` : '', side].filter(Boolean).map(s => ` · ${s}`).join('');
      return `${l.breastfeeding} · ${date} · ${time} - ${end} · ${durMin}min${tail}`;
    }
    const milk = e.milk ? `${e.milk}${e.unit || 'ml'}` : '';
    return `${l.bottle} · ${date} · ${time} - ${end} · ${durMin}min · ${milk}`;
  };

  // ---------- timer math ----------
  // the timer shown on the full-screen timer view (view is 'sleep' or 'eat')
  const curT = () => state.timers[state.view] || null;
  const setTimerOf = (type, t) => set({ timers: { ...state.timers, [type]: t } });
  const patchTimer = (p) => { const t = curT(); if (t) setTimerOf(t.type, { ...t, ...p }); };
  const otherType = (type) => (type === 'sleep' ? 'eat' : 'sleep');
  const isStarted = (type) => !!(state.timers[type] && state.timers[type].startedAt);
  const elapsedMs = (a = curT()) => {
    if (!a || !a.startedAt) return 0;
    return a.accMs + (a.running ? Date.now() - a.lastStart : 0);
  };
  // minutes since the meal/sleep started, from the start time (not from the main timer)
  const sinceStartLabel = (a) => {
    const min = Math.floor(Math.max(0, Date.now() - a.startedAt) / 60000);
    const txt = min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${pad(min % 60)}`;
    const key = a.type === 'sleep' ? 'sleep' : (a.breast ? 'breast' : 'bottle');
    return fr() ? `${L().startedSince[key]} ${txt}` : `${L().startedSince[key]} ${txt}${L().ago}`;
  };
  const clockTime = (ts) => timeOf(ts, { hour: '2-digit', minute: '2-digit' });
  // "● Recording · 05:12 · from 11:32 PM" for the home cards
  const runningSub = (a) => `${a.running ? '● ' + L().recording : '❚❚ ' + L().paused} · ${clockLabel(elapsedMs(a))} · ${L().fromTime} ${clockTime(a.startedAt)}`;
  // from 19:30 until 06:00 a sleep starts as "Couché" (can still be changed)
  const defaultSleepMode = () => {
    const d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    return (m >= 19 * 60 + 30 || m < 6 * 60) ? 'couche' : '';
  };
  const sleepModeOf = (key) => SLEEP_MODES.find(x => x.key === key);
  const sleepModeLabel = (key) => { const m = sleepModeOf(key); return m ? (fr() ? m.fr : m.en) : ''; };
  const freshTimer = (type) => {
    const breast = type === 'eat' && state.feedDefault === 'breast';
    return { type, startedAt: null, running: false, accMs: 0, lastStart: 0, milk: '', breast, mode: type === 'sleep' ? defaultSleepMode() : '' };
  };
  const buildEntryFromTimer = (a) => {
    const ms = elapsedMs(a);
    const entry = {
      id: a.resumedId || (idPrefix(a.type) + Date.now()), type: a.type, timestamp: a.startedAt || Date.now(),
      trueStartedAt: a.startedAt || Date.now(), duration: Math.round(ms / 1000),
      endTimestamp: (!a.running && a.pausedAt) ? a.pausedAt : Date.now()
    };
    if (a.type === 'eat') {
      const milk = (a.milk || '').toString().trim();
      if (a.breast) {
        entry.breast = true;
        if (a.side) entry.side = a.side;
        if (milk) { entry.milk = milk; entry.unit = state.unit; }   // optional for a breastfeed
      } else { entry.milk = milk; entry.unit = state.unit; }
    }
    if (a.type === 'sleep' && a.mode) entry.mode = a.mode;
    return entry;
  };

  // ---------- clipboard / toast ----------
  let toastTimer;
  const showToast = (msg) => {
    state.toast = msg; render();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { state.toast = ''; render(); }, 1900);
  };
  const fallbackCopy = (text) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;opacity:0';
      document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  };
  const copy = (text, msg) => {
    const done = () => showToast(msg || L().copied), fail = () => showToast(L().copyFail);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => (fallbackCopy(text) ? done() : fail()));
    } else (fallbackCopy(text) ? done() : fail());
  };

  // ---------- actions ----------
  const openTimer = (type) => {
    state.panel = null;
    set({ timers: { ...state.timers, [type]: state.timers[type] || freshTimer(type) }, view: type });
  };
  // the same timer, started at time `at` (no countdown pending, measured time back to 0)
  const startedTimer = (t, at) => ({ ...t, countdownEnd: null, startedAt: at, running: true, accMs: 0, lastStart: at, pausedAt: null });
  const beginTimer = (type) => {
    const t = state.timers[type];
    setTimerOf(type, { ...startedTimer(t, Date.now()), ...(type === 'sleep' && !t.mode ? { mode: defaultSleepMode() } : {}) });
  };
  // ----- countdown before a sleep timer (length set in Settings) -----
  // Only the end time is stored. A web page cannot run while the phone is locked or the app is in the
  // background, so when the app wakes up (or ticks) it checks whether the end time has passed and, if so,
  // starts the sleep timer with that end time as its start: the recorded time is exact either way.
  const countdownLeft = (t = state.timers.sleep) => (t && !t.startedAt && t.countdownEnd ? Math.max(0, t.countdownEnd - Date.now()) : null);
  const checkCountdown = () => {
    const t = state.timers.sleep;
    if (!t || t.startedAt || !t.countdownEnd || Date.now() < t.countdownEnd) return;
    setTimerOf('sleep', { ...startedTimer(t, t.countdownEnd), mode: t.mode || defaultSleepMode() });
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  };
  // Stop a running timer and save its entry; the timer slot is emptied.
  // a running breastfeed cannot be saved before the side is known
  const needsSide = (type) => { const t = state.timers[type]; return !!(t && t.type === 'eat' && t.breast && !t.side); };
  const finishTimer = (type) => {
    const entry = buildEntryFromTimer(state.timers[type]);
    commitEntry(entry, { timers: { ...state.timers, [type]: null } });
    copy(lineFor(entry), savedMsg(type));
  };
  const commitEntry = (entry, extra) => {
    set({ logs: [entry, ...state.logs.filter(l => l.id !== entry.id)], archive: upsertArchive(entry), ...extra });
  };
  const savedMsg = (type) => typeLabel(type) + L().savedSuffix;

  const savePoop = () => {
    const sel = state.poopSel || {};
    const entry = { id: 'p' + Date.now(), type: 'poop', timestamp: Date.now(), size: sel.size || '' };
    if (state.useCons && sel.consistency) entry.consistency = sel.consistency;
    if (state.anomalyOn && state.anomalyKind) {
      entry.anomaly = state.anomalyKind;
      if (state.anomalyKind === 'other') entry.anomalyNote = (state.anomalyNote || '').trim();
    }
    state.poopPicker = false; state.poopSel = emptyPoopSel(); state.anomalyOn = false; state.anomalyKind = null; state.anomalyNote = '';
    set({ logs: [entry, ...state.logs], archive: upsertArchive(entry) });
    copy(lineFor(entry), L().poopLogged);
  };
  const logObsKind = (key) => {
    const entry = { id: 'o' + Date.now(), type: 'obs', timestamp: Date.now(), obs: key };
    state.obsPicker = false;
    set({ logs: [entry, ...state.logs], archive: upsertArchive(entry) });
    copy(lineFor(entry), L().obsLogged);
  };

  // Start-time buttons: moving the start later (+) shortens the measured time by the same amount,
  // moving it earlier (−) lengthens it. The start can't pass "now" and the time can't go below 0.
  const bumpStart = (d) => {
    const a = curT();
    if (!a || !a.startedAt) return;
    const el = elapsedMs(a);
    const shift = d > 0 ? Math.min(d * 60000, el, Math.max(0, Date.now() - a.startedAt)) : d * 60000;
    patchTimer({ startedAt: a.startedAt + shift, accMs: el - shift, lastStart: Date.now() });
  };
  // Timer buttons: change the time shown on the main timer; the start time is untouched.
  const bumpTimer = (d) => {
    const a = curT();
    if (!a || !a.startedAt) return;
    patchTimer({ accMs: Math.max(0, elapsedMs(a) + d * 60000), lastStart: Date.now() });
  };
  const bumpMilk = (d) => {
    const have = parseFloat(curT() && curT().milk) || 0;
    patchTimer({ milk: String(Math.max(0, Math.round((have + d) * 10) / 10)) });
  };

  const canResume = (e) => {
    if (e.type === 'poop' || e.type === 'obs') return false;
    if (isStarted(e.type)) return false;
    return Date.now() - (e.timestamp + (e.duration || 0) * 1000) < RESUME_WINDOW_MS;
  };
  const resumeEntry = (id) => {
    const e = state.logs.find(l => l.id === id);
    if (!e) return;
    const active = {
      type: e.type, startedAt: e.timestamp, running: true, pausedAt: null,
      accMs: (e.duration || 0) * 1000, lastStart: Date.now(), milk: e.milk || '', breast: !!e.breast, side: e.side || '', mode: e.mode || '', resumedId: e.id
    };
    set({ logs: state.logs.filter(l => l.id !== id), timers: { ...state.timers, [e.type]: active }, view: e.type, ...(e.type === 'eat' && e.unit ? { unit: e.unit } : {}) });
  };

  const copyType = (type) => {
    const items = sortDesc(state.logs.filter(l => l.type === type));
    if (!items.length) return showToast(L().nothingCopy);
    const n = items.length;
    copy(items.reverse().map(lineFor).join('\n\n'), L().copiedN(n));
  };
  const copyAll = () => {
    if (!state.logs.length) return showToast(L().nothingCopy);
    const order = { sleep: 0, eat: 1, poop: 2, obs: 3 };
    const g = [...state.logs].sort((a, b) => order[a.type] - order[b.type] || a.timestamp - b.timestamp);
    copy(g.map(lineFor).join('\n\n'), L().copiedAll(g.length));
  };

  // edit draft
  const openEdit = (id) => {
    const e = state.logs.find(l => l.id === id);
    if (!e) return;
    const dur = e.duration || 0;
    upd({ editDraft: {
      id, type: e.type, dt: toLocalInput(e.timestamp), endDt: toLocalInput(entryEnd(e)), milk: e.milk || '', unit: e.unit || 'ml',
      origMis: entryEnd(e) - (e.timestamp + dur * 1000), mode: e.mode || '',
      size: e.size || '', consistency: e.consistency || '', obs: e.obs || '', breast: !!e.breast, side: e.side || '',
      ...durParts(dur)
    } });
  };
  const draftSecs = (d) => (parseFloat(d.durH) || 0) * 3600 + (parseFloat(d.durM) || 0) * 60 + (parseFloat(d.durS) || 0);
  // gap between the saved end time and start + duration (ms); null when it does not apply
  const draftMismatch = (d) => {
    if (!hasDuration(d.type)) return null;
    const s = new Date(d.dt).getTime(), e = new Date(d.endDt).getTime();
    if (isNaN(s) || isNaN(e)) return null;
    return e - (s + Math.round(draftSecs(d)) * 1000);
  };
  const saveEdit = () => {
    const d = state.editDraft, ts = new Date(d.dt).getTime();
    if (!d.dt || isNaN(ts)) return showToast(L().badDate);
    // warn only when this edit created a new gap (entries from timers can already differ slightly)
    const mis = draftMismatch(d);
    if (mis != null && Math.abs(mis) > 60000 && Math.abs(mis - (d.origMis || 0)) > 60000) return upd({ mismatchPrompt: true });
    commitEdit();
  };
  const commitEdit = () => {
    const d = state.editDraft, ts = new Date(d.dt).getTime();
    state.mismatchPrompt = false;
    const apply = (l) => {
      if (l.id !== d.id) return l;
      const next = { ...l, timestamp: ts };
      if (hasDuration(l.type)) {
        next.duration = Math.max(0, Math.round(draftSecs(d)));
        const endTs = new Date(d.endDt).getTime();
        next.endTimestamp = !isNaN(endTs) ? endTs : ts + next.duration * 1000;
      }
      if (l.type === 'poop') { next.size = d.size || ''; if (d.consistency) next.consistency = d.consistency; else delete next.consistency; }
      if (l.type === 'obs') next.obs = d.obs || l.obs;
      if (l.type === 'sleep') { if (d.mode) next.mode = d.mode; else delete next.mode; }
      if (l.type === 'eat') {
        const milk = (d.milk || '').toString().trim();
        if (d.breast) {
          next.breast = true;
          if (d.side) next.side = d.side; else delete next.side;
          if (milk) { next.milk = milk; next.unit = d.unit; } else delete next.milk;
        } else { next.milk = milk; next.unit = d.unit; }
      }
      return next;
    };
    state.editDraft = null;
    set({ logs: sortDesc(state.logs.map(apply)), archive: sortDesc(state.archive.map(apply)) });
    showToast(L().entryUpdated);
  };
  const patchDraft = (p) => { state.editDraft = { ...state.editDraft, ...p }; };

  const confirmDelete = () => {
    const t = state.deleteTarget;
    state.deleteTarget = null;
    set({ logs: t === 'all' ? [] : state.logs.filter(l => l.type !== t) });
    showToast(t === 'all' ? L().allDeleted : L().cleared);
  };

  const A = {
    setLang: (v) => set({ lang: v }),
    openSettings: () => set({ view: 'settings' }),
    openArchive: () => set({ view: 'archive' }),
    closePage: () => set({ view: 'home' }),
    toggleDurLink: () => set({ durLink: !state.durLink }),
    toggleCons: () => set({ useCons: !state.useCons }),
    setFeedDefault: (v) => {
      // a feed timer that was opened but not started yet follows the new default
      const t = state.timers.eat;
      const timers = t && !t.startedAt ? { ...state.timers, eat: { ...t, breast: v === 'breast' } } : state.timers;
      set({ feedDefault: v, timers });
    },
    // +/- buttons of a numeric setting; v = "key:delta"
    numBump: (v) => { const [k, d] = v.split(':'), f = NUM_FIELDS[k]; set({ [k]: Math.min(f.max, Math.max(f.min, state[k] + (+d))) }); },
    toggleNap: () => set({ useNap: !state.useNap }),
    toggleCountdown: () => set({ useCountdown: !state.useCountdown }),
    // collapsible timer panels: toggled in place (no re-render) so the CSS transition can animate
    panel: (v) => {
      state.panel = state.panel === v ? null : v;
      root.querySelectorAll('.tpanel').forEach(p => {
        const open = p.classList.contains('locked') || p.dataset.panel === state.panel;
        p.classList.toggle('open', open);
        const h = p.querySelector('.tp-head'); if (h) h.setAttribute('aria-expanded', open);
      });
    },
    openSleep: () => openTimer('sleep'),
    openEat: () => openTimer('eat'),
    logPoop: () => upd({ poopPicker: true, poopSel: emptyPoopSel(), anomalyOn: false, anomalyKind: null, anomalyNote: '' }),
    logObs: () => upd({ obsPicker: true }),
    cancelObs: () => upd({ obsPicker: false }),
    obsKind: logObsKind,
    cancelPoop: () => upd({ poopPicker: false, poopSel: emptyPoopSel(), anomalyOn: false, anomalyKind: null, anomalyNote: '' }),
    // size and consistency are only picked here; "Confirm" saves the entry
    poopSize: (v) => upd({ poopSel: { ...state.poopSel, size: state.poopSel.size === v ? '' : v } }),
    poopCons: (v) => upd({ poopSel: { ...state.poopSel, consistency: state.poopSel.consistency === v ? '' : v } }),
    confirmPoop: savePoop,
    toggleAnomaly: () => upd({ anomalyOn: !state.anomalyOn, anomalyKind: null, anomalyNote: '' }),
    anomalyKind: (v) => upd({ anomalyKind: v }),
    toggleExpand: (t) => upd({ expanded: { ...state.expanded, [t]: !state.expanded[t] } }),
    copyType, copyAll,
    clear: (t) => upd({ deleteTarget: t }),
    askDeleteAll: () => upd({ deleteTarget: 'all' }),
    cancelDelete: () => upd({ deleteTarget: null }),
    confirmDelete,
    edit: openEdit, resume: resumeEntry,
    cancelEdit: () => upd({ editDraft: null }),
    saveEdit,
    mismatchContinue: () => upd({ mismatchPrompt: false }),
    mismatchSave: () => commitEdit(),
    editCons: (v) => { patchDraft({ consistency: state.editDraft.consistency === v ? '' : v }); render(); },
    editSize: (v) => { patchDraft({ size: v }); render(); },
    editSide: (v) => { patchDraft({ side: v }); render(); },
    // shift the duration by v minutes (never below 0); the end time follows when the setting is on
    editDur: (v) => {
      const d = state.editDraft, secs = Math.max(0, Math.round(draftSecs(d) + v * 60));
      const start = new Date(d.dt).getTime();
      patchDraft({ ...durParts(secs), ...(isNaN(start) || !state.durLink ? {} : { endDt: toLocalInput(start + secs * 1000) }) });
      render();
    },
    editUnit: (v) => { patchDraft({ unit: v }); render(); },
    editObs: (v) => { patchDraft({ obs: v }); render(); },
    editMode: (v) => { patchDraft({ mode: v }); render(); },
    sleepMode: (v) => patchTimer({ mode: v }),
    // alert shown when a timer is started while the other kind is still running
    cancelSwitch: () => upd({ switchPrompt: null }),
    keepBoth: () => {
      const type = state.switchPrompt;
      state.switchPrompt = null;
      beginTimer(type);
    },
    stopOtherAndStart: () => {
      const type = state.switchPrompt, other = otherType(type);
      if (needsSide(other)) return upd({ sidePrompt: 'switch' });
      state.switchPrompt = null;
      const entry = buildEntryFromTimer(state.timers[other]);
      commitEntry(entry, { timers: { ...state.timers, [other]: null, [type]: startedTimer(state.timers[type], Date.now()) } });
      copy(lineFor(entry), savedMsg(other));
    },
    goHome: () => set({ view: 'home' }),
    switchView: (v) => { state.panel = null; set({ view: v }); },
    cancelTimer: () => { const t = curT(); set({ timers: { ...state.timers, [t.type]: null }, view: 'home' }); },
    startTimer: () => {
      const t = curT();
      if (isStarted(otherType(t.type))) return upd({ switchPrompt: t.type });
      state.panel = null;
      beginTimer(t.type);
    },
    startCountdown: () => patchTimer({ countdownEnd: Date.now() + state.cdMinutes * 60000 }),
    cancelCountdown: () => patchTimer({ countdownEnd: null }),
    togglePause: () => {
      const a = { ...curT() };
      if (a.running) { const t = Date.now(); a.accMs += t - a.lastStart; a.running = false; a.pausedAt = t; }
      else { a.running = true; a.lastStart = Date.now(); a.pausedAt = null; }
      setTimerOf(a.type, a);
    },
    stopTimer: () => {
      const type = curT().type;
      if (needsSide(type)) return upd({ sidePrompt: 'stop' });
      state.view = 'home'; finishTimer(type);
    },
    // popup shown when a breastfeed is stopped without a side: pick one, then the stop continues
    pickSide: (v) => {
      const then = state.sidePrompt;
      state.sidePrompt = null;
      state.timers = { ...state.timers, eat: { ...state.timers.eat, side: v } };
      if (then === 'switch') A.stopOtherAndStart(); else A.stopTimer();
    },
    cancelSidePrompt: () => upd({ sidePrompt: null }),
    bumpStart: (v) => bumpStart(+v), bumpTimer: (v) => bumpTimer(+v), bumpMilk: (v) => bumpMilk(+v),
    // presets are in ml: pick ml so the value shown matches the button
    presetMilk: (v) => patchTimer({ milk: String(v), breast: false }),
    modeBottle: () => patchTimer({ breast: false }),
    modeBreast: () => patchTimer({ breast: true }),
    breastSide: (v) => patchTimer({ side: v }),
    // the unit is a global setting: convert the volume typed in a running feed timer
    setUnit: (v) => {
      if (v === state.unit) return;
      const t = state.timers.eat, n = t ? parseFloat(t.milk) : NaN;
      const timers = (!isNaN(n) && n > 0)
        ? { ...state.timers, eat: { ...t, milk: String(v === 'oz' ? Math.round(n / ML_PER_OZ * 2) / 2 : Math.round(n * ML_PER_OZ)) } }
        : state.timers;
      set({ unit: v, timers });
    },
    openGraphs: () => upd({ view: 'graphs', selectedDay: null }),
    closeGraphs: () => upd({ view: 'home', selectedDay: null }),
    metric: (v) => upd({ metric: v }),
    selectDay: (v) => upd({ selectedDay: +v }),
    closeDay: () => upd({ selectedDay: null }),
    archiveFilter: (v) => upd({ archiveFilter: v }),
    archiveSort: () => upd({ archiveSort: state.archiveSort === 'desc' ? 'asc' : 'desc' }),
    removeArchive: (id) => set({ archive: state.archive.filter(l => l.id !== id) })
  };

  // when the setting is on, the end time follows start + duration while the user types
  const followEnd = (root) => {
    const d = state.editDraft, start = new Date(d.dt).getTime();
    if (isNaN(start) || !hasDuration(d.type) || !state.durLink) return;
    d.endDt = toLocalInput(start + draftSecs(d) * 1000);
    const el = root.querySelector('[data-i="editEndDt"]'); if (el) el.value = d.endDt;
  };
  const INPUTS = {
    milk: (v) => patchTimer({ milk: v }),
    anomalyNote: (v) => { state.anomalyNote = v; },
    editDt: (v, root) => { patchDraft({ dt: v }); followEnd(root); },
    editEndDt: (v, root) => {
      patchDraft({ endDt: v });
      const d = state.editDraft, s = new Date(d.dt).getTime(), e = new Date(v).getTime();
      if (isNaN(s) || isNaN(e)) return;
      const dur = Math.max(0, Math.round((e - s) / 1000));
      Object.assign(d, durParts(dur));
      ['durH', 'durM', 'durS'].forEach(k => { const el = root.querySelector(`[data-i="edit_${k}"]`); if (el) el.value = d[k]; });
    },
    editMilk: (v) => patchDraft({ milk: v })
  };
  // numbers typed in Settings: saved without re-rendering so the keyboard stays open
  Object.keys(NUM_FIELDS).forEach(k => {
    INPUTS['num_' + k] = (v) => { const n = parseInt(v, 10), f = NUM_FIELDS[k]; if (n >= f.min && n <= f.max) { state[k] = n; save(); } };
  });
  ['durH', 'durM', 'durS'].forEach(k => {
    INPUTS['edit_' + k] = (v, root) => { patchDraft({ [k]: v }); followEnd(root); };
  });

  // ---------- best time for a nap ----------
  // Time awake = time since the end of the last sleep. Four zones on the bar: grey (too early), green (best
  // time), orange (getting late) and red (past the limit); the bar ends a bit after the limit.
  const napCfg = () => {
    const min = state.napMin, max = Math.max(min, state.napMax), limit = Math.max(max, state.napLimit);
    return { min, max, limit, total: limit + Math.max(10, Math.round(limit * 0.25)) };
  };
  const lastSleepEnd = () => state.archive.reduce((m, e) => (e.type === 'sleep' ? Math.max(m, entryEnd(e)) : m), 0);
  const napStatus = () => {
    const c = napCfg();
    if (isStarted('sleep')) return { c, sleeping: true };
    const last = lastSleepEnd();
    if (!last) return { c, none: true };
    const mins = Math.max(0, (Date.now() - last) / 60000);
    return { c, mins, pct: Math.min(100, (mins / c.total) * 100), zone: mins < c.min ? 'early' : mins < c.max ? 'ideal' : mins < c.limit ? 'late' : 'over' };
  };
  const napDur = (m) => (m < 60 ? `${Math.floor(m)} min` : `${Math.floor(m / 60)}h${pad(Math.floor(m % 60))}`);
  const napTexts = (st) => {
    const l = L();
    if (st.sleeping) return { zone: 'sleeping', status: l.napSleeping, awake: '' };
    if (st.none) return { zone: 'none', status: l.napNone, awake: '' };
    return { zone: st.zone, status: { early: l.napEarly, ideal: l.napIdeal, late: l.napLate, over: l.napOver }[st.zone], awake: l.napAwake(napDur(st.mins)) };
  };
  const napHtml = () => {
    if (!state.useNap) return '';
    const l = L(), st = napStatus(), c = st.c, t = napTexts(st);
    const pc = (m) => `${(m / c.total) * 100}%`;
    const zones = [['early', c.min], ['ideal', c.max - c.min], ['late', c.limit - c.max], ['over', c.total - c.limit]]
      .map(([z, m]) => `<i class="z-${z}" style="width:${pc(m)}"></i>`).join('');
    const ticks = [c.min, c.max, c.limit].map(m => `<span style="left:${pc(m)}">${napDur(m)}</span>`).join('');
    return `<div class="nap" role="img" aria-label="${esc(l.napTitle + ' · ' + t.status + (t.awake ? ' · ' + t.awake : ''))}">
      <div class="nap-top"><span class="nap-title">😴 ${l.napTitle}</span><span class="nap-status zone-${t.zone}">${esc(t.status)}</span></div>
      <div class="nap-bar"><div class="nap-track">${zones}</div><b class="nap-cursor" style="left:${st.pct == null ? 0 : st.pct}%"${st.pct == null ? ' hidden' : ''}></b></div>
      <div class="nap-ticks">${ticks}</div>
      <div class="nap-awake">${esc(t.awake)}</div>
    </div>`;
  };
  // refresh the cursor and texts every second without redrawing the screen
  const updateNap = () => {
    const el = root.querySelector('.nap');
    if (!el) return;
    const st = napStatus(), t = napTexts(st), cur = el.querySelector('.nap-cursor');
    cur.hidden = st.pct == null;
    if (st.pct != null) cur.style.left = st.pct + '%';
    const status = el.querySelector('.nap-status'), awake = el.querySelector('.nap-awake');
    status.className = 'nap-status zone-' + t.zone;
    if (status.textContent !== t.status) status.textContent = t.status;
    if (awake.textContent !== t.awake) awake.textContent = t.awake;
  };

  // ---------- views ----------
  const attr = (a, v) => `data-a="${a}"${v !== undefined ? ` data-v="${esc(v)}"` : ''}`;
  const themeVars = (t) => `--c:${t.c};--ink-on:${t.ink};--tx:${t.tx || t.c};--shadow:${t.shadow || t.c}`;

  const rowsFor = (type) => sortDesc(state.logs.filter(l => l.type === type));

  const rowHtml = (type, e) => {
    const l = L(), th = THEME[type], end = timeOf(entryEnd(e));
    let main, line = '', big = false, anom = '';
    if (type === 'sleep') {
      main = durLabel(e.duration); line = `${timeOf(e.timestamp)} → ${end}`; big = true;
      if (e.mode) anom = `<span class="pill-mode">${sleepModeOf(e.mode).emoji} ${esc(sleepModeLabel(e.mode))}</span>`;
    }
    else if (type === 'eat') {
      main = e.breast ? `🤱 ${e.milk ? `${e.milk} ${e.unit || 'ml'}` : (sideLabel(e.side) || l.breastfeeding)}` : (e.milk ? `${e.milk} ${e.unit || 'ml'}` : durLabel(e.duration));
      line = `${timeOf(e.timestamp)} → ${end} · ${durLabel(e.duration)}${e.breast && e.milk && e.side ? ' · ' + sideLabel(e.side) : ''}`; big = true;
    } else if (type === 'poop') {
      main = timeOf(e.timestamp); line = poopDesc(e);
      if (e.anomaly) anom = `<span class="pill-anom">⚠ ${esc(anomalyLabelFor(e))}</span>`;
    } else { main = timeOf(e.timestamp); line = `${obsEmoji(e.obs)} ${obsLabel(e.obs)}`; }
    const resume = canResume(e) ? `<button class="resume-btn" ${attr('resume', e.id)}>${l.resume}</button>` : '';
    return `<div class="row" data-swipe="${esc(e.id)}">
      <div class="row-bin">🗑</div>
      <div class="row-body">
        <div class="row-text">
          <span class="row-main${big ? ' big' : ''}">${esc(main)}</span>
          <span class="row-line">${esc(line)}</span>
          <span class="row-date">${esc(dateOf(e.timestamp))}</span>${anom}
        </div>
        <div class="row-side"><button class="edit-btn" aria-label="Edit" ${attr('edit', e.id)}>✎</button>${resume}</div>
      </div></div>`;
  };

  const cdSub = (a) => `⏳ ${L().cdSub} ${clockLabel(countdownLeft(a) || 0)}`;
  const cardHtml = (type) => {
    const l = L(), th = THEME[type], rows = rowsFor(type), open = !!state.expanded[type] && rows.length > 0;
    const a = state.timers[type];
    const started = isStarted(type);
    const cfg = {
      sleep: { title: l.sleeping, empty: l.noSleep, copy: l.copySleep, act: 'openSleep', arrow: '›' },
      eat: { title: l.eating, empty: l.noEat, copy: l.copyEat, act: 'openEat', arrow: '›' },
      poop: { title: l.pooping, empty: l.noPoop, copy: l.copyPoop, act: 'logPoop', arrow: '+', sub: l.tapPoop },
      obs: { title: l.obs, empty: l.noObs, copy: l.copyObs, act: 'logObs', arrow: '+', sub: l.obsSub }
    }[type];
    const cd = type === 'sleep' ? countdownLeft(a) : null;
    const sub = cfg.sub || (started ? runningSub(a) : cd != null ? cdSub(a) : l.tapStart);
    const more = rows.length - 1;
    const foot = open ? l.less : more > 0 ? l.more(more) : l.actions;
    const footAria = open ? l.less : (more === 0 ? l.showActions : l.showMore(more));
    return `<div class="card${open ? ' wide' : ''}" style="${themeVars(th)}">
      <button class="card-main" ${attr(cfg.act)}>
        <span class="card-top"><span class="card-dot">${th.emoji}</span><span class="card-arrow">${cfg.arrow}</span></span>
        <span class="card-title">${esc(cfg.title)}</span>
        <span class="card-sub" data-live="${type}">${esc(sub)}</span>
      </button>
      ${rows.length === 0 ? `<div class="empty">${cfg.empty}</div>` : ''}
      ${(open ? rows : rows.slice(0, 1)).map(e => rowHtml(type, e)).join('')}
      ${open ? `<div class="card-actions"><button ${attr('copyType', type)}>${cfg.copy}</button><button class="clear" ${attr('clear', type)}>${l.clear}</button></div>` : ''}
      ${rows.length > 0 ? `<button class="card-foot${open ? ' open' : ''}" aria-expanded="${open}" aria-label="${esc(footAria)}" ${attr('toggleExpand', type)}><span>${esc(foot)}</span><span class="chev">▾</span></button>` : ''}
    </div>`;
  };

  // Flat icons built from the same palette as the stats bars: violet, orange, coral (and lilac).
  const svg = (inner) => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">${inner}</svg>`;
  const gearPath = (() => {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      [[i * 45 - 15, 7.2], [i * 45 - 10, 10], [i * 45 + 10, 10], [i * 45 + 15, 7.2]].forEach(([deg, r]) => {
        const t = (deg - 90) * Math.PI / 180;
        pts.push((12 + r * Math.cos(t)).toFixed(2) + ' ' + (12 + r * Math.sin(t)).toFixed(2));
      });
    }
    return 'M' + pts.join('L') + 'ZM15 12a3 3 0 1 0-6 0a3 3 0 1 0 6 0Z';
  })();
  const ICON = {
    // floppy disk: violet body, orange shutter, coral label
    save: svg(`<path d="M4 4a1 1 0 0 1 1-1h12l3.5 3.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="${THEME.sleep.c}"/><rect x="7.5" y="3" width="7" height="5" rx="1" fill="${THEME.eat.c}"/><rect x="12.3" y="4" width="1.6" height="3" rx=".5" fill="#161320"/><rect x="7" y="13" width="10" height="8" rx="1.2" fill="${THEME.poop.c}"/>`),
    // gear: one 8-tooth outline with a hole, filled with a brushed-metal grey gradient
    gear: svg(`<defs><linearGradient id="metal" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e3e6eb"/><stop offset=".55" stop-color="#9aa1ac"/><stop offset="1" stop-color="#6b7280"/></linearGradient></defs><path fill="url(#metal)" fill-rule="evenodd" d="${gearPath}"/><circle cx="12" cy="12" r="3" fill="none" stroke="#5b616b" stroke-width=".8"/>`)
  };

  const homeHtml = () => {
    const l = L();
    const counts = TYPES.map(t => `<span>${THEME[t].emoji} ${rowsFor(t).length}</span>`).join('');
    return `<div class="page"><div class="col">
      <div class="head">
        <div>
          <div class="title">Little Tracker</div>
          <div class="today">${esc(new Date().toLocaleDateString(locale(), { weekday: 'long', month: 'long', day: 'numeric' }))}</div>
          <div class="counts">${counts}</div>
        </div>
        <div class="head-tools">
          <button class="icon-btn stats-btn" aria-label="${esc(l.trends)}" ${attr('openGraphs')}>
            <span style="height:9px;background:${THEME.sleep.c}"></span><span style="height:16px;background:${THEME.eat.c}"></span><span style="height:12px;background:${THEME.poop.c}"></span>
          </button>
          <button class="icon-btn" aria-label="${esc(l.archive)}" ${attr('openArchive')}>${ICON.save}</button>
          <button class="icon-btn" aria-label="${esc(l.settings)}" ${attr('openSettings')}>${ICON.gear}</button>
        </div>
      </div>
      ${napHtml()}
      <div class="grid">${TYPES.map(cardHtml).join('')}</div>
      <div class="bottom">
        <button class="btn-ghost" ${attr('copyAll')}>${l.copyAll}</button>
        <button class="btn-danger-soft" ${attr('askDeleteAll')}>${l.deleteAll}</button>
      </div>
    </div></div>`;
  };

  const modal = (inner, cls) => `<div class="scrim"><div class="modal ${cls || ''}">${inner}</div></div>`;

  const switchHtml = () => {
    if (state.switchPrompt == null) return '';
    const l = L(), type = state.switchPrompt, other = otherType(type);
    const nt = typeLabel(type).toLowerCase(), ct = typeLabel(other).toLowerCase();
    return modal(`
      <div class="warn">⚠️</div>
      <div class="modal-title">${l.switchTitle(ct)}</div>
      <div class="modal-body">${l.switchBody(nt)}</div>
      <div class="modal-btns stack">
        <button class="btn-solid" ${attr('stopOtherAndStart')}>${l.switchStop(ct, nt)}</button>
        <button class="btn-solid alt" ${attr('keepBoth')}>${l.keepBoth}</button>
        <button class="btn-line" ${attr('cancelSwitch')}>${l.cancel}</button>
      </div>`);
  };

  const sideHtml = () => {
    if (!state.sidePrompt) return '';
    const l = L();
    return modal(`
      <div class="warn">🤱</div>
      <div class="modal-title">${l.whichSide}</div>
      <div class="modal-body">${l.sideRequired}</div>
      <div class="sides big"><button class="pick side" ${attr('pickSide', 'left')}>◀ ${l.left}</button><button class="pick side" ${attr('pickSide', 'right')}>${l.right} ▶</button></div>
      <button class="cancel-wide" ${attr('cancelSidePrompt')}>${l.back}</button>`);
  };

  const poopHtml = () => {
    if (!state.poopPicker) return '';
    const l = L();
    const sizes = POOP_SIZES.map((k, i) => [k, `${20 + i * 8}px`]);
    const kinds = [['color', l.anomColorBtn], ['blood', l.anomBloodBtn], ['other', l.anomOtherBtn]];
    return modal(`
      <div class="modal-title">${l.howBig}</div>
      <div class="sizes${state.poopSel.size ? ' has-sel' : ''}">${sizes.map(([k, fs]) => `<button class="size-btn${state.poopSel.size === k ? ' on' : ''}" aria-pressed="${state.poopSel.size === k}" ${attr('poopSize', k)}><span style="font-size:${fs}">💩</span><span>${l[k]}</span></button>`).join('')}</div>
      ${state.useCons ? `<div class="modal-sub">${l.consistency}</div>
      <div class="cons-row">${CONSISTENCIES.map(c => `<button class="cons-btn${state.poopSel.consistency === c.key ? ' on' : ''}" aria-pressed="${state.poopSel.consistency === c.key}" ${attr('poopCons', c.key)}><span>${c.emoji}</span>${esc(fr() ? c.fr : c.en)}</button>`).join('')}</div>` : ''}
      <button class="anom-row${state.anomalyOn ? ' on' : ''}" ${attr('toggleAnomaly')}><span class="check">${state.anomalyOn ? '✓' : ''}</span><span class="anom-label">${l.anomaly}</span></button>
      ${state.anomalyOn ? `<div class="anom-kinds"><div class="lbl">${l.anomalyKind}</div>
        <div class="btns">${kinds.map(([k, lb]) => `<button class="${state.anomalyKind === k ? 'on' : ''}" ${attr('anomalyKind', k)}>${lb}</button>`).join('')}</div>
        ${state.anomalyKind === 'other' ? `<input class="text-in" data-i="anomalyNote" id="anomalyNote" value="${esc(state.anomalyNote)}" placeholder="${esc(l.anomalyPlaceholder)}">` : ''}
      </div>` : ''}
      <div class="modal-btns"><button class="btn-line" ${attr('cancelPoop')}>${l.cancel}</button><button class="btn-solid poop" ${attr('confirmPoop')}>${l.confirm}</button></div>`, 'm370');
  };

  const obsHtml = () => {
    if (!state.obsPicker) return '';
    const l = L();
    return `<div class="scrim sheet-wrap" data-a="cancelObs" data-self="1">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(l.obsWhat)}">
        <div class="grabber"></div>
        <div class="modal-title">${l.obsWhat}</div>
        <div class="hint">${l.obsHint}</div>
        <div class="obs-die">${OBS_KINDS.map(k => `<button class="obs-item" ${attr('obsKind', k.key)}><span class="em">${k.emoji}</span><span class="lb">${esc(fr() ? k.fr : k.en)}</span></button>`).join('')}</div>
        <button class="cancel-wide" ${attr('cancelObs')}>${l.cancel}</button>
      </div></div>`;
  };

  const deleteHtml = () => {
    const t = state.deleteTarget;
    if (t == null) return '';
    const l = L();
    return modal(`<div class="warn">⚠️</div>
      <div class="modal-title">${t === 'all' ? l.delAllTitle : l.clearTitle[t]}</div>
      <div class="modal-body">${t === 'all' ? l.delAllBody : l.clearBody}</div>
      <div class="modal-btns"><button class="btn-line" ${attr('cancelDelete')}>${l.cancel}</button><button class="btn-solid danger" ${attr('confirmDelete')}>${t === 'all' ? l.delAllCta : l.clearCta}</button></div>`);
  };

  const editHtml = () => {
    const d = state.editDraft;
    if (!d) return '';
    const l = L(), hasDur = hasDuration(d.type);
    const emoji = THEME[d.type].emoji;
    const num = (key, val) => `<input type="number" inputmode="numeric" min="0" data-i="edit_${key}" value="${esc(val)}" placeholder="0">`;
    let body = `<div class="edit-title">${emoji} ${l.edit} ${l.kind[d.type]}</div>
      <div class="fl">${l.dateTime}</div>
      <input class="dt-in" style="font-weight:600;font-size:16px;padding:13px 14px" type="datetime-local" data-i="editDt" value="${esc(d.dt)}">`;
    if (hasDur) body += `
      <div class="fl">${l.endTime}</div>
      <input class="dt-in" type="datetime-local" data-i="editEndDt" value="${esc(d.endDt)}">
      <div class="fl">${l.duration}</div>
      <div class="dur-row">${num('durH', d.durH)}<span>h</span>${num('durM', d.durM)}<span>min</span>${num('durS', d.durS)}<span>s</span></div>
      <div class="dur-bumps">${[-5, -1, 1, 5].map(v => `<button ${attr('editDur', v)}>${v > 0 ? '+' : '−'}${Math.abs(v)} min</button>`).join('')}</div>`;
    if (d.type === 'poop') body += `<div class="fl">${l.size}</div><div class="pick-row">${POOP_SIZES.map(s => `<button class="pick${d.size === s ? ' on-poop' : ''}" ${attr('editSize', s)}>${l[s]}</button>`).join('')}</div>
      ${state.useCons ? `<div class="fl">${l.consistency}</div><div class="pick-row">${CONSISTENCIES.map(c => `<button class="pick${d.consistency === c.key ? ' on-poop' : ''}" ${attr('editCons', c.key)}>${c.emoji} ${esc(fr() ? c.fr : c.en)}</button>`).join('')}</div>` : ''}`;
    if (d.type === 'sleep') body += `<div class="fl">${l.sleepType}</div><div class="mode-opts">${SLEEP_MODES.map(m => `<button class="${d.mode === m.key ? 'on' : ''}" ${attr('editMode', d.mode === m.key ? '' : m.key)}><span>${m.emoji}</span>${esc(fr() ? m.fr : m.en)}</button>`).join('')}</div>`;
    if (d.type === 'obs') body += `<div class="fl">${l.obsKind}</div><div class="pick-col">${OBS_KINDS.map(k => `<button class="pick obs-opt${d.obs === k.key ? ' on-obs' : ''}" ${attr('editObs', k.key)}><span>${k.emoji}</span><span>${esc(fr() ? k.fr : k.en)}</span></button>`).join('')}</div>`;
    if (d.type === 'eat') body += `<div class="fl">${d.breast ? l.breastVolume : l.milkLabel}</div>
      <div class="milk-row"><input type="number" inputmode="decimal" data-i="editMilk" value="${esc(d.milk)}" placeholder="0">
      <button class="pick unit${d.unit === 'ml' ? ' on-unit' : ''}" ${attr('editUnit', 'ml')}>ml</button><button class="pick unit${d.unit === 'oz' ? ' on-unit' : ''}" ${attr('editUnit', 'oz')}>oz</button></div>`;
    if (d.type === 'eat' && d.breast) body += `<div class="fl">${l.whichSide}</div>
      <div class="pick-row"><button class="pick side${d.side === 'left' ? ' on-eat' : ''}" ${attr('editSide', 'left')}>◀ ${l.left}</button><button class="pick side${d.side === 'right' ? ' on-eat' : ''}" ${attr('editSide', 'right')}>${l.right} ▶</button></div>`;
    body += `<div class="modal-btns"><button class="btn-line" ${attr('cancelEdit')}>${l.cancel}</button><button class="btn-solid" ${attr('saveEdit')}>${l.save}</button></div>`;
    return modal(body, 'm370');
  };

  const timerHtml = () => {
    const a = curT();
    if (!a) return '';
    const l = L(), isEat = a.type === 'eat', isSleep = a.type === 'sleep', th = THEME[a.type];
    const started = !!a.startedAt, running = !!a.running;
    const cdLeft = isSleep ? countdownLeft(a) : null;
    const status = cdLeft != null ? l.cdStatus : !started ? l.ready : running ? l.recording : l.paused;
    // shortcut to the other timer when both are running
    const other = otherType(a.type), ot = state.timers[other];
    const otherChip = isStarted(other)
      ? `<button class="other-chip dimmable" style="--oc:${THEME[other].c}" ${attr('switchView', other)}><span>${THEME[other].emoji} ${other === 'eat' ? l.feeding : l.sleepingNow}${ot.running ? '' : ' ❚❚'}</span><b data-live="chip">${clockLabel(elapsedMs(ot))}</b><span>›</span></button>`
      : '';
    const unit = state.unit, oz = unit === 'oz';
    const presetBtn = (v) => `<button class="${parseFloat(a.milk) === v ? 'on' : ''}" ${attr('presetMilk', v)}>${v}</button>`;
    const bumps = (fn, vals) => vals.map(v => `<button ${attr(fn, v)}>${v > 0 ? '+' : '−'}${Math.abs(v)}</button>`).join('');
    // Each group sits in a collapsible panel; only one is open at a time. The head button is the
    // toggle (bigger and centered while open) and the body grows/shrinks with a CSS transition.
    // before the timer starts the volume panel stays open and cannot be folded
    const panel = (key, kind, label, body) => {
      const locked = (key === 'volume' || key === 'mode') && !started;
      const open = locked || state.panel === key;
      return `<div class="tpanel ${kind} dimmable${open ? ' open' : ''}${locked ? ' locked' : ''}" data-panel="${key}">
        <button class="tp-head" aria-expanded="${open}" ${locked ? 'tabindex="-1"' : attr('panel', key)}><span class="tp-lbl">${label}</span><i class="tp-chev">▾</i></button>
        <div class="tp-body"><div class="tp-in">${body}</div></div></div>`;
    };
    let mid = '', sinceHtml = '';
    if (started) {
      sinceHtml = `<div class="since dimmable" data-live="since">${esc(sinceStartLabel(a))}</div>`;
      mid += panel('timer', 'timer', `⏱ ${l.chronoAdjust}`, `<div class="tg-btns">${bumps('bumpTimer', [-5, -1, 1, 5])}</div><div class="tg-unit">min</div>`);
      mid += panel('start', 'start', `🕐 ${l.startAdjust}`, `<div class="tg-btns">${bumps('bumpStart', [-5, -1, 1, 5])}</div><div class="tg-unit">min</div>`);
    }
    if (isSleep) {
      // like the volume for feeds: open and locked before the start, then a panel titled with the choice
      const cur = sleepModeOf(a.mode);
      const title = cur ? `${cur.emoji} <span>${esc(fr() ? cur.fr : cur.en)}</span>` : `<span>${l.sleepNone}</span>`;
      const body = `<div class="mode-opts">${SLEEP_MODES.map(m => `<button class="${a.mode === m.key ? 'on' : ''}" ${attr('sleepMode', m.key)}><span>${m.emoji}</span>${esc(fr() ? m.fr : m.en)}</button>`).join('')}</div>`;
      mid += panel('mode', 'volume', title, body);
    }
    if (isEat) {
      const breast = !!a.breast;
      let body = `<div class="modes"><button class="${breast ? '' : 'on'}" ${attr('modeBottle')}>🍼 ${l.bottle}</button><button class="${breast ? 'on' : ''}" ${attr('modeBreast')}>🤱 ${l.breastfeeding}</button></div>`;
      const milkInput = `<div class="milk-main"><input type="number" inputmode="decimal" id="milk" data-i="milk" value="${esc(a.milk || '')}" placeholder="0"><span class="unit-tag">${unit}</span></div>`;
      if (breast) body += `<div class="breast-q">${l.whichSide}</div>
        <div class="sides"><button class="pick side${a.side === 'left' ? ' on-eat' : ''}" ${attr('breastSide', 'left')}>◀ ${l.left}</button><button class="pick side${a.side === 'right' ? ' on-eat' : ''}" ${attr('breastSide', 'right')}>${l.right} ▶</button></div>
        <div class="vol-lb">${l.breastVolume}</div>${milkInput}
        <div class="mbumps two">${bumps('bumpMilk', oz ? [-0.5, 0.5] : [-20, 20])}</div>`;
      else body += `${milkInput}
        <div class="vol-lb">${l.snack}</div>
        <div class="presets snack">${(oz ? [0.5, 1, 1.5, 2] : [20, 40, 60, 80]).map(presetBtn).join('')}</div>
        <div class="vol-lb">${l.fullBottle}</div>
        <div class="presets bottle">${(oz ? [3, 4, 5, 6, 7, 8] : [100, 120, 140, 160, 180, 200]).map(presetBtn).join('')}</div>
        <div class="mbumps">${bumps('bumpMilk', oz ? [-1, -0.5, 0.5, 1] : [-10, -5, 5, 10])}</div>`;
      // the panel title is the volume itself (value + unit), not the word "Volume"
      const title = breast
        ? `🤱 <span>${sideLabel(a.side) || l.whichSide}${parseFloat(a.milk) > 0 ? ` · ${esc(a.milk)} ${unit}` : ''}</span>`
        : `🍼 <span class="vol-val">${esc(a.milk || '0')} ${unit}</span>`;
      mid += panel('volume', 'volume', title, body);
      mid += `<button class="obs-quick dimmable" ${attr('logObs')}>📝 ${l.obsQuick}</button>`;
    }
    let ctas;
    if (cdLeft != null) ctas = `<button class="cta" ${attr('startTimer')}>${l.startNow}</button><button class="cta-ghost" ${attr('cancelCountdown')}>${l.cancel}</button>`;
    else if (!started) {
      ctas = `<button class="cta" ${attr('startTimer')}>${l.start}</button>`;
      if (isSleep && state.useCountdown) ctas += `<button class="cta-ghost" aria-label="${esc(l.cdAria(state.cdMinutes))}" ${attr('startCountdown')}>⏳ ${l.countdown} · ${state.cdMinutes} min</button>`;
    } else ctas = `<button class="cta" ${attr('stopTimer')}>${l.stop}</button><button class="cta-ghost" ${attr('togglePause')}>${running ? l.pause : l.resume}</button>`;
    return `<div class="full"><div class="full-in" style="${themeVars(th)}">
      <div class="bar dimmable">
        <button class="back" ${attr('goHome')}>‹ ${l.menu}</button>
        <div class="mid"><span class="em">${th.emoji}</span>${isEat ? l.feeding : l.sleepingNow}</div>
        <button class="discard" ${attr('cancelTimer')}>${l.discard}</button>
      </div>
      ${otherChip}
      <div class="timer-body${isSleep ? ' roomy' : ' eat'}">
        <div class="t-top">
        <div class="status dimmable" style="font-size:${isEat ? 12 : 14}px">${status}</div>
        <div class="clock${cdLeft != null ? ' cd' : ''}" data-live="clock" style="font-size:${isEat ? 58 : 76}px">${clockLabel(cdLeft != null ? cdLeft : elapsedMs())}</div>
        ${started ? `<div class="from-time dimmable">${l.startedAt} ${esc(clockTime(a.startedAt))}</div>` : ''}
        ${sinceHtml}
        </div>
        <div class="t-mid">${mid}</div>
      </div>
      <div class="ctas dimmable${isSleep ? ' stack' : started ? ' row eatc' : ''}" style="--shadow:${th.shadow}">${ctas}</div>
    </div></div>`;
  };

  // ----- trends -----
  const windowStart3w = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() - 20 * DAY; };

  const buildChart = () => {
    const m = state.metric, th = THEME[m], l = L();
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const todayStart = t0.getTime();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const start = todayStart - i * DAY;
      const items = state.archive.filter(e => e.type === m && e.timestamp >= start && e.timestamp < start + DAY);
      const val = m === 'sleep' ? items.reduce((s, e) => s + (e.duration || 0), 0) / 3600
        : m === 'eat' ? items.reduce((s, e) => s + toMl(e.milk, e.unit), 0) : items.length;
      days.push({ start, val, isToday: i === 0, label: i === 0 ? l.today : new Date(start).toLocaleDateString(locale(), { weekday: 'short' }) });
    }
    const max = Math.max(...days.map(d => d.val), 0), total = days.reduce((s, d) => s + d.val, 0);
    const bars = days.map(d => {
      const disp = d.val > 0 ? (m === 'sleep' ? d.val.toFixed(1) : String(Math.round(d.val))) : '';
      const pct = max > 0 ? Math.max((d.val / max) * 100, d.val > 0 ? 5 : 0) : 0;
      return { ...d, disp, pct, bg: d.isToday ? th.c : th.dim };
    });
    let heading, big, unit, sub;
    if (m === 'sleep') { heading = l.hSleep; big = total.toFixed(1); unit = 'h'; sub = l.avgSleep((total / 7).toFixed(1)); }
    else if (m === 'eat') {
      heading = l.hMilk; big = String(Math.round(total)); unit = 'ml';
      const feeds = state.archive.filter(e => e.type === 'eat' && e.timestamp >= days[0].start).length;
      sub = l.sumEat(feeds, Math.round(total / 7));
    } else { heading = l.hPoop; big = String(total); unit = ''; sub = l.avgPoop((total / 7).toFixed(1)); }
    return { bars, heading, big, unit, sub, empty: total === 0 };
  };

  const distSub = (days, peak) => `${L().last3w} · ${L().daysWithData(days)} · ${L().peakAt(peak)}`;
  const distHtml = (title, sub, legend, counts, grid) => {
    const max = Math.max(...counts, 1);
    const hours = counts.map((total, i) => {
      const segs = grid[i].segs.map(s => `<div style="width:100%;height:${(s.n / total) * 100}%;background:${s.bg}"></div>`).join('');
      return `<div class="hour${i % 6 === 0 ? ' tick' : ''}"><div class="hour-fill${total ? '' : ' none'}" style="height:${(total / max) * 100}%">${segs}</div></div>`;
    }).join('');
    const yAxis = [max, max / 2, 0].map((v, i) => `<span style="top:${i * 50}%">${Math.round(v * 10) / 10}${L().times}</span>`).join('');
    const ax = [0, 6, 12, 18, 24].map((h, i) => `<span style="text-align:${i === 0 ? 'left' : i === 4 ? 'right' : 'center'}">${h}h</span>`).join('');
    return `<div class="panel">
      <div class="ph">${title}</div><div class="psub">${sub}</div>
      <div class="legend">${legend.map(g => `<span><i style="background:${g.bg}"></i>${esc(g.label)}</span>`).join('')}</div>
      <div class="dist"><div class="yaxis">${yAxis}</div>
        <div class="plot">${[0, 25, 50, 75, 100].map(v => `<span class="gl" style="top:${v}%"></span>`).join('')}<div class="hours">${hours}</div></div></div>
      <div class="xaxis"><span class="sp"></span><div class="ax">${ax}</div></div></div>`;
  };

  const eatHoursHtml = () => {
    const l = L(), from = windowStart3w();
    const items = state.archive.filter(e => e.type === 'eat' && (e.trueStartedAt || e.timestamp) >= from);
    if (!items.length) return '';
    const grid = Array.from({ length: 24 }, () => ({ bottle: 0, breast: 0 }));
    items.forEach(e => { grid[new Date(e.trueStartedAt || e.timestamp).getHours()][e.breast ? 'breast' : 'bottle']++; });
    const colors = EAT_COLORS;
    const counts = grid.map(c => c.bottle + c.breast);
    const g = grid.map(c => ({ segs: ['bottle', 'breast'].filter(k => c[k] > 0).map(k => ({ n: c[k], bg: colors[k] })) }));
    const days = new Set(items.map(e => new Date(e.timestamp).toDateString())).size || 1;
    const peak = counts.indexOf(Math.max(...counts));
    return distHtml(l.eatDistTitle, distSub(days, peak),
      [{ label: l.bottle, bg: colors.bottle }, { label: l.breastfeeding, bg: colors.breast }], counts, g);
  };

  const poopHoursHtml = () => {
    const l = L(), from = windowStart3w();
    const items = state.archive.filter(e => e.type === 'poop' && e.timestamp >= from);
    const sizes = [['small', '#f7d3bb'], ['medium', '#f0a07a'], ['large', THEME.poop.c], ['xl', '#b8532a']];
    const grid = Array.from({ length: 24 }, () => ({ small: 0, medium: 0, large: 0, xl: 0, unknown: 0 }));
    items.forEach(e => { const c = grid[new Date(e.timestamp).getHours()]; c[e.size && c[e.size] !== undefined ? e.size : 'unknown']++; });
    const counts = grid.map(c => c.small + c.medium + c.large + c.xl + c.unknown);
    const g = grid.map(c => ({ segs: [...sizes.filter(([k]) => c[k] > 0).map(([k, bg]) => ({ n: c[k], bg })), ...(c.unknown ? [{ n: c.unknown, bg: 'rgba(231,137,92,.3)' }] : [])] }));
    const days = new Set(items.map(e => new Date(e.timestamp).toDateString())).size || 1;
    const peak = counts.indexOf(Math.max(...counts, 1));
    const sub = !items.length ? l.noData : distSub(days, peak);
    const legend = sizes.filter(([k]) => grid.some(c => c[k] > 0)).map(([k, bg]) => ({ label: l[k], bg }));
    return distHtml(l.poopDistTitle, sub, legend, counts, g);
  };

  // Sleep: how often a sleep starts in each hour of the day (last 3 weeks)
  const sleepHoursHtml = () => {
    const l = L(), from = windowStart3w();
    const items = state.archive.filter(e => e.type === 'sleep' && e.timestamp >= from);
    if (!items.length) return '';
    const counts = new Array(24).fill(0);
    items.forEach(e => { counts[new Date(e.timestamp).getHours()]++; });
    const g = counts.map(n => ({ segs: n ? [{ n, bg: THEME.sleep.c }] : [] }));
    const days = new Set(items.map(e => new Date(e.timestamp).toDateString())).size || 1;
    const peak = counts.indexOf(Math.max(...counts));
    return distHtml(l.sleepFreqTitle, `${l.sleepFreqSub(items.length)} · ${l.daysWithData(days)} · ${l.peakAt(peak)}`,
      [{ label: l.sleepsStarted, bg: THEME.sleep.c }], counts, g);
  };

  // One dot per entry: x = start time of day, y = duration (sleep) or volume (feed).
  // Dots are translucent, so piles of dots show how often that time slot is used.
  const scatterHtml = (title, sub, legend, pts, yMax, yFmt) => {
    const yAxis = [yMax, yMax / 2, 0].map((v, i) => `<span style="top:${i * 50}%">${esc(yFmt(v))}</span>`).join('');
    const dots = pts.map(p => `<span class="dot" title="${esc(p.tip)}" style="left:${(p.min / 1440) * 100}%;bottom:${Math.min(p.val / yMax, 1) * 100}%;background:${p.bg};opacity:${p.op}"></span>`).join('');
    const vlines = [0, 25, 50, 75].map(v => `<span class="gx" style="left:${v}%"></span>`).join('');
    const ax = [0, 6, 12, 18, 24].map((h, i) => `<span style="text-align:${i === 0 ? 'left' : i === 4 ? 'right' : 'center'}">${h}h</span>`).join('');
    return `<div class="panel">
      <div class="ph">${title}</div><div class="psub">${sub}</div>
      <div class="legend">${legend.map(g => `<span><i style="background:${g.bg}"></i>${esc(g.label)}</span>`).join('')}</div>
      <div class="dist"><div class="yaxis">${yAxis}</div>
        <div class="plot">${[0, 50].map(v => `<span class="gl" style="top:${v}%"></span>`).join('')}${vlines}${dots}</div></div>
      <div class="xaxis"><span class="sp"></span><div class="ax">${ax}</div></div></div>`;
  };

  const sleepScatterHtml = () => {
    const l = L(), from = windowStart3w(), weekAgo = Date.now() - 7 * DAY;
    const items = state.archive.filter(e => e.type === 'sleep' && e.timestamp >= from);
    if (!items.length) return '';
    const maxH = Math.max(...items.map(e => (e.duration || 0) / 3600));
    const yMax = Math.max(2, Math.ceil(maxH / 2) * 2);
    const pts = items.map(e => {
      const d = new Date(e.timestamp), recent = e.timestamp >= weekAgo;
      return { min: d.getHours() * 60 + d.getMinutes(), val: (e.duration || 0) / 3600, bg: THEME.sleep.c, op: recent ? .8 : .35, tip: `${timeOf(e.timestamp)} · ${durLabel(e.duration)}` };
    });
    return scatterHtml(l.durTitle, l.durDesc,
      [{ label: l.last7, bg: THEME.sleep.c }, { label: l.earlier, bg: 'rgba(139,147,255,.35)' }],
      pts, yMax, (v) => `${Math.round(v * 10) / 10}h`);
  };

  const eatScatterHtml = () => {
    const l = L(), from = windowStart3w();
    const items = state.archive.filter(e => e.type === 'eat' && (!e.breast || toMl(e.milk, e.unit) > 0) && (e.trueStartedAt || e.timestamp) >= from);   // a breastfeed counts once its volume was typed
    if (!items.length) return '';
    const maxMl = Math.max(...items.map(e => toMl(e.milk, e.unit)));
    const yMax = Math.max(100, Math.ceil(maxMl / 50) * 50);
    const pts = items.map(e => {
      const ts = e.trueStartedAt || e.timestamp, d = new Date(ts), ml = toMl(e.milk, e.unit);
      return { min: d.getHours() * 60 + d.getMinutes(), val: ml, bg: e.breast ? EAT_COLORS.breast : EAT_COLORS.bottle, op: .75, tip: `${timeOf(ts)} · ${Math.round(ml)} ml` };
    });
    return scatterHtml(l.volTitle, l.volDesc,
      [{ label: l.bottle, bg: EAT_COLORS.bottle }, ...(items.some(e => e.breast) ? [{ label: l.breastfeeding, bg: EAT_COLORS.breast }] : [])],
      pts, yMax, (v) => `${Math.round(v)} ml`);
  };

  const dayHtml = () => {
    const m = state.metric, l = L(), s = state.selectedDay;
    const items = sortDesc(state.archive.filter(e => e.type === m && e.timestamp >= s && e.timestamp < s + DAY));
    const pos = (ts) => ((ts - s) / DAY) * 100;
    let total, strip = '', events;
    if (m === 'sleep') {
      const sec = items.reduce((a, e) => a + (e.duration || 0), 0);
      total = l.daySleep((sec / 3600).toFixed(1), items.length);
      strip = items.map(e => { const left = pos(e.timestamp); return `<div style="position:absolute;top:15px;bottom:15px;left:${left}%;width:${Math.max(Math.min(((e.duration || 0) / 86400) * 100, 100 - left), 1)}%;background:${THEME.sleep.c};border-radius:6px;min-width:3px"></div>`; }).join('');
      events = items.map(e => [timeOf(e.timestamp), durLabel(e.duration)]);
    } else if (m === 'eat') {
      const ml = items.reduce((a, e) => a + toMl(e.milk, e.unit), 0), maxMl = Math.max(...items.map(e => toMl(e.milk, e.unit)), 1);
      total = l.dayEat(Math.round(ml), items.length);
      strip = items.map(e => { const v = toMl(e.milk, e.unit); return `<div style="position:absolute;bottom:0;left:${pos(e.timestamp)}%;width:7px;height:${Math.max(v / maxMl * 100, v > 0 ? 14 : 7)}%;background:${THEME.eat.c};border-radius:3px 3px 0 0;transform:translateX(-3.5px)"></div>`; }).join('');
      events = items.map(e => [timeOf(e.timestamp), (e.milk ? `${e.milk} ${e.unit || 'ml'} · ` : '') + durLabel(e.duration)]);
    } else {
      total = l.dayPoop(items.length);
      strip = items.map(e => `<div style="position:absolute;top:50%;left:${pos(e.timestamp)}%;width:14px;height:14px;border-radius:50%;background:${THEME.poop.c};transform:translate(-50%,-50%);border:2px solid #1b1726"></div>`).join('');
      events = items.map(e => [timeOf(e.timestamp), l.wPoop + (poopDesc(e) ? ' · ' + poopDesc(e) : '')]);
    }
    const label = new Date(s).toLocaleDateString(locale(), { weekday: 'short', month: 'short', day: 'numeric' });
    return `<div class="panel plain">
      <div class="zoom-head"><button class="back7" ${attr('closeDay')}>‹ ${l.d7}</button><div class="dl"><b>${esc(label)}</b><span>${esc(total)}</span></div></div>
      ${items.length === 0 ? `<div class="no-data s">${l.noDay}</div>` : `
        <div class="day-strip"><div class="gv" style="left:25%"></div><div class="gv mid" style="left:50%"></div><div class="gv" style="left:75%"></div>${strip}</div>
        <div class="day-axis">${l.ax.map(a => `<span>${a}</span>`).join('')}</div>
        <div class="events">${events.map(([t, v]) => `<div class="ev"><b>${esc(t)}</b><span>${esc(v)}</span></div>`).join('')}</div>`}
    </div>`;
  };

  const allEntriesHtml = () => {
    if (!state.archive.length) return '';
    const l = L();
    const flt = state.archiveFilter, asc = state.archiveSort === 'asc';
    const count = (t) => (t === 'all' ? state.archive.length : state.archive.filter(e => e.type === t).length);
    const chips = [['all', l.all], ['sleep', l.mSleep], ['eat', l.mEat], ['poop', l.mPoop], ['obs', l.obs]].map(([t, label]) => {
      const th = THEME[t];
      const on = flt === t;
      return `<button class="fchip${on ? ' on' : ''}" ${attr('archiveFilter', t)} style="${on ? `background:${th ? th.c : '#f4f1f8'};color:${th ? th.ink : '#0f0d14'};border-color:transparent` : ''}">${th ? th.emoji + ' ' : ''}${esc(label)} <i>${count(t)}</i></button>`;
    }).join('');
    const sortLabel = asc ? l.oldestFirst : l.newestFirst;
    const list = sortDesc(state.archive.filter(e => flt === 'all' || e.type === flt));
    if (asc) list.reverse();
    const rows = list.map(e => {
      const icon = e.type === 'sleep' ? '🌙' : e.type === 'eat' ? (e.breast ? '🤱' : '🍼') : e.type === 'obs' ? obsEmoji(e.obs) : '💩';
      let detail;
      if (e.type === 'sleep') detail = durLabel(e.duration) + (e.mode ? ` · ${sleepModeLabel(e.mode)}` : '');
      else if (e.type === 'eat') detail = e.breast ? [sideLabel(e.side), e.milk ? `${e.milk}${e.unit || 'ml'}` : ''].filter(Boolean).join(' · ') : (e.milk ? `${e.milk}${e.unit || 'ml'}` : durLabel(e.duration));
      else if (e.type === 'obs') detail = obsLabel(e.obs);
      else detail = poopDesc(e) + (e.anomaly ? ` • ${l.anomLabel} : ${anomalyLabelFor(e)}` : '');
      return `<div class="all-row"><span class="ic">${icon}</span><span class="tm">${esc(timeOf(e.timestamp))}</span><span class="dt">${esc(dateOf(e.timestamp))}</span><span class="dd">${esc(detail)}</span><button aria-label="Delete" ${attr('removeArchive', e.id)}>×</button></div>`;
    }).join('');
    return `<div class="panel plain">
      <div class="all-head"><div class="all-title">${l.allEntries}</div><button class="sort-btn" ${attr('archiveSort')}>${sortLabel}</button></div>
      <div class="fchips">${chips}</div>
      ${rows || `<div class="no-data s">${l.noEntryType}</div>`}</div>`;
  };

  const graphsHtml = () => {
    const l = L(), m = state.metric, th = THEME[m], c = buildChart();
    const tab = (k, label) => `<button ${attr('metric', k)} style="${m === k ? `background:${THEME[k].c};color:${THEME[k].ink}` : ''}">${THEME[k].emoji} ${label}</button>`;
    const zoom = state.selectedDay != null;
    const chart = c.empty ? `<div class="no-data">${l.no7}</div>` : `
      <div class="bars">${c.bars.map(b => `<div class="bar-col${b.val > 0 ? ' tap' : ''}" ${b.val > 0 ? attr('selectDay', b.start) : ''}><span class="bar-val">${b.disp}</span><div class="bar-fill" style="height:${b.pct}%;background:${b.bg}"></div></div>`).join('')}</div>
      <div class="bar-labels">${c.bars.map(b => `<span class="${b.isToday ? 'today' : ''}">${esc(b.label)}</span>`).join('')}</div>
      <div class="tap-hint">${l.tapDay}</div>`;
    return `<div class="full graphs"><div class="full-in">
      <div class="bar"><button class="back" ${attr('closeGraphs')}>‹ ${l.back}</button><div class="mid">${l.trends}</div><span style="width:54px"></span></div>
      <div class="tabs">${tab('sleep', l.mSleep)}${tab('eat', l.mEat)}${tab('poop', l.mPoop)}</div>
      <div class="panel summary"><div class="ph">${c.heading}</div>
        <div class="big-row" style="--c:${th.c}"><span class="big">${c.big}</span><span class="big-unit">${c.unit}</span></div>
        <div class="big-sub">${c.sub}</div></div>
      ${zoom ? dayHtml() : `<div class="panel">${chart}</div>`}
      ${!zoom && m === 'sleep' ? sleepHoursHtml() + sleepScatterHtml() : ''}
      ${!zoom && m === 'eat' ? eatHoursHtml() + eatScatterHtml() : ''}
      ${!zoom && m === 'poop' ? poopHoursHtml() : ''}
    </div></div>`;
  };

  const pageBar = (title) => `<div class="bar"><button class="back" ${attr('closePage')}>‹ ${L().back}</button><div class="mid">${title}</div><span style="width:54px"></span></div>`;

  const archiveHtml = () => {
    const l = L();
    return `<div class="full graphs"><div class="full-in">
      ${pageBar(l.archive)}
      <div style="margin-top:6px"></div>
      ${allEntriesHtml() || `<div class="panel plain"><div class="no-data s">${l.noEntry}</div></div>`}
    </div></div>`;
  };

  const settingsHtml = () => {
    const l = L();
    const seg = (items, cur, act) => `<div class="set-seg">${items.map(([v, label]) => `<button class="${cur === v ? 'on' : ''}" ${attr(act, v)}>${label}</button>`).join('')}</div>`;
    // a setting card with an on/off switch and a help text
    const toggleCard = (title, key, act, help, extra = '') => `<div class="panel plain set-card">
        <div class="set-row"><div class="set-title">${title}</div>
          <button class="switch${state[key] ? ' on' : ''}" role="switch" aria-checked="${state[key]}" aria-label="${esc(title)}" ${attr(act)}><i></i></button></div>
        <div class="set-help">${help}</div>${extra}
      </div>`;
    // a minutes field with - / + buttons
    const numRow = (key, label) => {
      const f = NUM_FIELDS[key];
      return `<div class="set-num"><span>${label}</span>
          <div class="num-ctl"><button aria-label="−${f.step} min" ${attr('numBump', `${key}:${-f.step}`)}>−</button><input type="number" inputmode="numeric" min="${f.min}" max="${f.max}" data-i="num_${key}" id="num_${key}" value="${state[key]}" aria-label="${esc(label)}"><button aria-label="+${f.step} min" ${attr('numBump', `${key}:${f.step}`)}>+</button></div><span>min</span></div>`;
    };
    return `<div class="full graphs"><div class="full-in">
      ${pageBar(l.settings)}
      <div class="panel plain set-card"><div class="set-title">${l.language}</div>${seg([['en', 'English'], ['fr', 'Français']], state.lang, 'setLang')}</div>
      <div class="panel plain set-card"><div class="set-title">${l.volumeUnit}</div>${seg([['ml', 'ml'], ['oz', 'oz']], state.unit, 'setUnit')}</div>
      <div class="panel plain set-card"><div class="set-title">${l.feedDefault}</div>${seg([['bottle', `🍼 ${l.bottle}`], ['breast', `🤱 ${l.breastfeeding}`]], state.feedDefault, 'setFeedDefault')}<div class="set-help">${l.feedDefaultHelp}</div></div>
      ${toggleCard(l.durLink, 'durLink', 'toggleDurLink', l.durLinkHelp)}
      ${toggleCard(l.consTitle, 'useCons', 'toggleCons', l.consHelp)}
      ${toggleCard(l.cdTitle, 'useCountdown', 'toggleCountdown', l.cdHelp, state.useCountdown ? numRow('cdMinutes', l.cdLength) : '')}
      ${toggleCard(l.napSetTitle, 'useNap', 'toggleNap', l.napHelp, state.useNap ? numRow('napMin', l.napMin) + numRow('napMax', l.napMax) + numRow('napLimit', l.napLimit) : '')}
    </div></div>`;
  };

  const mismatchHtml = () => {
    const d = state.editDraft;
    if (!state.mismatchPrompt || !d) return '';
    const l = L();
    const exp = clockTime(new Date(d.dt).getTime() + Math.round(draftSecs(d)) * 1000);
    const rec = clockTime(new Date(d.endDt).getTime());
    return modal(`<div class="warn">⚠️</div>
      <div class="modal-title">${l.mismatchTitle}</div>
      <div class="modal-body">${esc(l.mismatchBody(exp, rec))}</div>
      <div class="modal-btns stack">
        <button class="btn-solid" ${attr('mismatchContinue')}>${l.mismatchContinue}</button>
        <button class="btn-line" ${attr('mismatchSave')}>${l.mismatchSave}</button>
      </div>`);
  };

  // ---------- render ----------
  const root = document.getElementById('app');
  function render() {
    const ae = document.activeElement;
    const focus = ae && ae.id && root.contains(ae) ? { id: ae.id, s: ae.selectionStart, e: ae.selectionEnd } : null;
    const scrolls = [...root.querySelectorAll('.full, .modal, .sheet')].map(el => el.scrollTop);
    const winY = window.scrollY;
    const v = state.view;
    root.innerHTML = homeHtml()
      + (v === 'sleep' || v === 'eat' ? timerHtml() : '')
      + (v === 'graphs' ? graphsHtml() : '')
      + (v === 'archive' ? archiveHtml() : '')
      + (v === 'settings' ? settingsHtml() : '')
      + switchHtml() + sideHtml() + poopHtml() + obsHtml() + deleteHtml() + editHtml() + mismatchHtml()
      + (state.toast ? `<div class="toast">${esc(state.toast)}</div>` : '');
    window.scrollTo(0, winY);
    [...root.querySelectorAll('.full, .modal, .sheet')].forEach((el, i) => { if (scrolls[i]) el.scrollTop = scrolls[i]; });
    if (focus) {
      const el = document.getElementById(focus.id);
      if (el) { el.focus(); try { el.setSelectionRange(focus.s, focus.e); } catch (e) {} }
    }
    syncWakeLock();
    syncIdle();
  }

  // Dim everything except the running clock after a minute without touch while a feed timer runs.
  // (A web page cannot lower the phone's real brightness, so the elements are darkened instead.)
  // Also dims during the sleep countdown, but sooner (20 s) since nothing needs to be touched.
  const IDLE_MS = 60000, IDLE_CD_MS = 20000;
  let idleTimer = null;
  const inCountdown = () => state.view === 'sleep' && countdownLeft() != null;
  const dimWanted = () => (state.view === 'eat' && !!(state.timers.eat && state.timers.eat.running)) || inCountdown();
  function wakeUi() {
    document.body.classList.remove('dimmed');
    clearTimeout(idleTimer);
    idleTimer = dimWanted() ? setTimeout(() => { if (dimWanted()) document.body.classList.add('dimmed'); }, inCountdown() ? IDLE_CD_MS : IDLE_MS) : null;
  }
  function syncIdle() {
    if (!dimWanted()) { document.body.classList.remove('dimmed'); clearTimeout(idleTimer); idleTimer = null; }
    else if (idleTimer === null) wakeUi();
  }
  // a touch or button press anywhere brings everything back (the press still goes through)
  ['pointerdown', 'touchstart', 'keydown'].forEach(ev => document.addEventListener(ev, wakeUi, { capture: true, passive: true }));

  // Keep the screen on while a feed or sleep timer is running (Screen Wake Lock API).
  // The browser drops the lock when the app is hidden, so it is asked for again on return.
  let wakeLock = null, wakeBusy = false;
  async function syncWakeLock() {
    if (!('wakeLock' in navigator) || wakeBusy) return;
    const running = (t) => !!(t && t.running);
    const want = (running(state.timers.eat) || running(state.timers.sleep) || countdownLeft() != null) && document.visibilityState === 'visible';
    wakeBusy = true;
    try {
      if (want && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!want && wakeLock) {
        const w = wakeLock; wakeLock = null;
        await w.release();
      }
    } catch (e) { wakeLock = null; }
    wakeBusy = false;
  }
  document.addEventListener('visibilitychange', () => { checkCountdown(); syncWakeLock(); });
  window.addEventListener('pageshow', checkCountdown);
  window.addEventListener('focus', checkCountdown);

  // live-updating bits without a full re-render (keeps inputs and pickers intact)
  setInterval(() => {
    const live = (k, v) => root.querySelectorAll(`[data-live="${k}"]`).forEach(el => { if (el.textContent !== v) el.textContent = v; });
    checkCountdown();
    updateNap();
    const cdl = countdownLeft();
    if (cdl != null) {
      live('sleep', cdSub(state.timers.sleep));
      if (state.view === 'sleep') live('clock', clockLabel(cdl));
    }
    ['sleep', 'eat'].forEach(type => {
      const a = state.timers[type];
      if (!a || !a.running) return;
      live(type, runningSub(a));
      if (state.view === type) {
        const el = elapsedMs(a);
        live('clock', clockLabel(el));
        live('since', sinceStartLabel(a));
      } else if (state.view === otherType(type)) {
        live('chip', clockLabel(elapsedMs(a)));
      }
    });
  }, 1000);

  // ---------- events ----------
  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el || !root.contains(el)) return;
    if (el.dataset.self && ev.target !== el) return;
    const fn = A[el.dataset.a];
    if (fn) fn(el.dataset.v);
  });
  root.addEventListener('input', (ev) => {
    const k = ev.target.dataset && ev.target.dataset.i;
    if (k && INPUTS[k]) INPUTS[k](ev.target.value, root);
    if (k === 'milk') save();
  });

  // swipe right on a row to delete it
  let drag = null;
  root.addEventListener('pointerdown', (ev) => {
    const row = ev.target.closest('[data-swipe]');
    if (!row || ev.target.closest('button')) return;
    drag = { id: row.dataset.swipe, x0: ev.clientX, body: row.querySelector('.row-body'), dx: 0 };
    drag.body.style.transition = 'none';
  });
  window.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    drag.dx = Math.max(0, Math.min(120, ev.clientX - drag.x0));
    drag.body.style.transform = `translateX(${drag.dx}px)`;
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag; drag = null;
    d.body.style.transition = '';
    if (d.dx > 80) set({ logs: state.logs.filter(l => l.id !== d.id) });
    else d.body.style.transform = '';
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  checkCountdown();
  render();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
