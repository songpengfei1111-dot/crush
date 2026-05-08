export function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const next = [...items];
  const index = next.findIndex((value) => value.id === item.id);
  if (index === -1) {
    next.push(item);
  } else {
    next[index] = item;
  }
  return next;
}

export function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}
