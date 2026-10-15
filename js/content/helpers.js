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
