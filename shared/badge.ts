// The small "Concept N of 10" tag every concept wears in its bottom-left corner while the owner
// compares them. It links back to the list of all concepts. Remove it from the winner.

export function conceptBadge(n: number, name: string) {
  const a = document.createElement("a");
  a.href = import.meta.env.VITE_HUB ?? "/concepts/";
  a.className = "concept-badge";
  a.setAttribute("aria-label", `Concept ${n} of 10, ${name}. Back to all concepts`);
  a.innerHTML = `<b>${n}</b><span>${name}</span><i>All concepts</i>`;
  const s = document.createElement("style");
  s.textContent = `.concept-badge{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;display:flex;align-items:center;gap:8px;padding:5px 10px 5px 5px;border-radius:999px;background:#111;color:#f4f4f0;font:500 12px/1 system-ui,-apple-system,sans-serif;text-decoration:none;opacity:.82;transition:opacity .2s}
.concept-badge:hover{opacity:1}.concept-badge b{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#f4f4f0;color:#111;font-weight:700}
.concept-badge i{font-style:normal;opacity:.6;display:none}.concept-badge:hover i{display:inline}
@media (max-width:640px){.concept-badge span{display:none}.concept-badge{padding:5px}}`;
  document.head.append(s);
  document.body.append(a);
}
