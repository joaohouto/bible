export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Substitui espaços por hifen
    .replace(/[^\w-]+/g, ""); // Remove caracteres especiais
}
