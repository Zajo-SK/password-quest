// Pomocné konštruktory úloh. Obsah (texty, správne odpovede, vysvetlenia) je oddelený od vykresľovania.
// Každá úloha je čistý objekt (JSON-like), ktorý neskôr môže pochádzať aj zo súboru či databázy.

// choice: good = [text, prečo, {icon}], bads = [[text, prečo, {icon}], ...]
export function choice(prompt, good, bads, summary, extra = {}) {
  return {
    type: 'choice',
    prompt,
    options: [
      { text: good[0], why: good[1], correct: true, ...(good[2] || {}) },
      ...bads.map((b) => ({ text: b[0], why: b[1], ...(b[2] || {}) })),
    ],
    summary,
    ...extra,
  };
}

// multi: items = [text, jeSprávne(bool), prečo]
export function multi(prompt, items, summary, extra = {}) {
  return {
    type: 'multi',
    prompt,
    options: items.map(([text, correct, why]) => ({ text, correct, why })),
    summary,
    ...extra,
  };
}

// rows (zdieľané kategórie): items = [text, idKategórie, prečo]
export function rows(prompt, categories, items, summary, extra = {}) {
  return {
    type: 'rows',
    prompt,
    categories,
    rows: items.map(([text, answer, why]) => ({ text, answer, why })),
    summary,
    ...extra,
  };
}

// rowsPer (každý riadok má vlastné možnosti): defs = [{label, plan, good:[text,why], bad:[[text,why],..]}]
export function rowsPer(prompt, defs, summary, extra = {}) {
  return {
    type: 'rows',
    prompt,
    rows: defs.map((d) => ({
      text: d.label,
      plan: d.plan,
      options: [
        { text: d.good[0], why: d.good[1], correct: true },
        ...d.bad.map((b) => ({ text: b[0], why: b[1] })),
      ],
    })),
    summary,
    ...extra,
  };
}

// hotspot: mock = {kind:'email', ..., parts:[{text, pick?, flag?, why?}]}
export function hotspot(prompt, mock, summary, extra = {}) {
  return { type: 'hotspot', prompt, mock, summary, ...extra };
}

// order: items = [text, tier|null, prečo]; tier = poradie dôležitosti (null = zavádzajúci krok)
export function order(prompt, items, summary, extra = {}) {
  return {
    type: 'order',
    prompt,
    items: items.map(([text, tier, why]) => ({ text, tier, why })),
    summary,
    ...extra,
  };
}

// mail: jeden e-mail do schránky. paragraphs = text alebo pole odsekov; odsek je text alebo pole častí
// (text, alebo odkaz { link: true, text, url }). scam = je to podvod; why = vysvetlenie. extra napr. { attachment }.
export function mail(from, subject, paragraphs, scam, why, extra = {}) {
  const paras = (Array.isArray(paragraphs) ? paragraphs : [paragraphs]).map((p) => (Array.isArray(p) ? p : [p]));
  return { from, subject, paragraphs: paras, scam: !!scam, why, ...extra };
}

// inbox: simulovaná schránka. Žiak otvorí každý e-mail a rozhodne, či je v poriadku, alebo podvod.
export function inbox(prompt, emails, summary, extra = {}) {
  return { type: 'inbox', prompt, emails, summary, ...extra };
}

// Všetky časti ukážky (e-mail, chat, stránka), ktoré sú objektom: na označovanie, kontrolu a premietanie.
export function mockParts(mock) {
  const list = [];
  const add = (p) => { if (p && typeof p === 'object') list.push(p); };
  if (!mock) return list;
  if (mock.kind === 'chat') mock.messages.forEach((m) => m.parts.forEach(add));
  else if (mock.kind === 'page') { add(mock.url); add(mock.title); (mock.paragraphs || []).forEach((para) => para.forEach(add)); }
  else { add(mock.from); add(mock.subject); (mock.paragraphs || []).forEach((para) => para.forEach(add)); }
  return list;
}

// cipher: zašifrované slovo. spec = { alphabet: 'bot' | 'leet' | 'caesar3' | 'rot13' | {A:'x', ...}, mode: 'decode' | 'encode',
// text: pôvodné slovo, choices?: [slová na výber] (bez choices sa odpoveď píše), table?: 'full' | 'used' | 'none', why }.
export function cipher(prompt, spec, summary, extra = {}) {
  return { type: 'cipher', prompt, table: 'full', ...spec, summary, ...extra };
}
