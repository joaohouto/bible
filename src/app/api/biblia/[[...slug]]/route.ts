import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-static";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    const dataFolder = path.join(process.cwd(), "src", "data", "biblia");

    // Rota: /api/biblia -> Retorna o índice instantaneamente
    if (!slug || slug.length === 0) {
      const indicePath = path.join(dataFolder, "indice.json");
      const indiceRaw = await fs.readFile(indicePath, "utf-8");
      return NextResponse.json(JSON.parse(indiceRaw));
    }

    const [livroSlug, capituloNumStr] = slug;

    // Tenta ler o arquivo do livro específico (ex: genesis.json)
    let livroRaw: string;
    try {
      const livroPath = path.join(dataFolder, `${livroSlug}.json`);
      livroRaw = await fs.readFile(livroPath, "utf-8");
    } catch (e) {
      return NextResponse.json(
        { error: "Livro não encontrado" },
        { status: 404 },
      );
    }

    const livro = JSON.parse(livroRaw);

    // Rota: /api/biblia/[livro]/[capitulo]
    if (capituloNumStr) {
      const num = parseInt(capituloNumStr);
      const capitulo = livro.capitulos.find((c: any) => c.capitulo === num);

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

    // Rota: /api/biblia/[livro]
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
