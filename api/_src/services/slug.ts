// Slug seguro para nomes de ficheiro/pasta dentro do ZIP.
// Remove acentos, espaços -> "_", mantém só [A-Za-z0-9_-].
// Mantém a capitalização original (nomes de pessoas legíveis).
// Ex.: "Maryluz Lopes da Silva" -> "Maryluz_Lopes_da_Silva"
// Ex.: "Descrição da Acção"      -> "Descricao_da_Accao"
export function slugify(text: string): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira diacríticos
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .replace(/_{2,}/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
}
