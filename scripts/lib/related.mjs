// 関連記事：同じ type の中から、同じ柱 → 同じサービス → 新しい順に n 本。足りなければ少ないまま。
export function pickRelated(item, items, n = 3) {
  const score = (x) => (x.pillar === item.pillar ? 2 : 0) + (x.service === item.service ? 1 : 0);
  return items
    .filter((x) => x.type === item.type && x.id !== item.id)
    .sort((a, b) => score(b) - score(a) || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, n);
}
