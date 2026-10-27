export function buscarElementoPorId<T extends { id?: unknown }>(
  elementos: T[],
  id: unknown,
): T | undefined {
  return elementos.find((elemento) => String(elemento.id) === String(id));
}
