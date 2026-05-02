export interface Versiculo {
  versiculo: number;
  texto: string;
}

export interface Capitulo {
  capitulo: number;
  versiculos: Versiculo[];
}

export interface Livro {
  nome: string;
  capitulos: Capitulo[];
}

export interface BibliaJSON {
  antigoTestamento: Livro[];
  novoTestamento: Livro[];
}
