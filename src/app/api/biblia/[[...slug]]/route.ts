import { NextRequest, NextResponse } from "next/server";
import bibliaData from "@/data/bibliaAveMaria.json";
import { slugify } from "@/lib/utils";

import { BibliaJSON, Livro } from "@/types/biblia";

const biblia = bibliaData as BibliaJSON;

export const revalidate = false;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // /api/biblia -> Retorna índice com total de capítulos
    if (!slug || slug.length === 0) {
      const mapearLivros = (livros: Livro[]) =>
        livros.map((l) => ({
          nome: l.nome,
          slug: slugify(l.nome),
          totalCapitulos: l.capitulos.length,
        }));

      return NextResponse.json({
        antigoTestamento: mapearLivros(biblia.antigoTestamento),
        novoTestamento: mapearLivros(biblia.novoTestamento),
      });
    }

    const [livroSlug, capituloNumStr] = slug;
    const todosLivros = [...biblia.antigoTestamento, ...biblia.novoTestamento];
    const livro = todosLivros.find((l) => slugify(l.nome) === livroSlug);

    if (!livro) {
      return NextResponse.json(
        { error: "Livro não encontrado" },
        { status: 404 },
      );
    }

    // /api/biblia/[livro]/[capitulo]
    if (capituloNumStr) {
      const num = parseInt(capituloNumStr);
      const capitulo = livro.capitulos.find((c) => c.capitulo === num);

      if (!capitulo) {
        return NextResponse.json(
          { error: "Capítulo não encontrado" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        livro: livro.nome,
        slug: livroSlug,
        totalCapitulosLivro: livro.capitulos.length,
        capitulo: capitulo.capitulo,
        versiculos: capitulo.versiculos,
      });
    }

    // /api/biblia/[livro]
    return NextResponse.json({
      nome: livro.nome,
      slug: livroSlug,
      totalCapitulos: livro.capitulos.length,
    });
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
