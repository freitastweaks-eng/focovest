// Static data for VestApp

export const SUBJECTS = [
  "Matemática",
  "Português",
  "Redação",
  "História",
  "Geografia",
  "Física",
  "Química",
  "Biologia",
  "Inglês",
  "Filosofia",
  "Sociologia",
] as const;

export const VESTIBULARES = [
  "ENEM",
  "FUVEST",
  "UNICAMP",
  "UNESP",
  "ITA",
  "IME",
  "AFA",
  "EsPCEx",
  "UERJ",
  "UFPR",
  "UFRGS",
  "UnB",
  "PUC-SP",
  "PUC-Rio",
  "Mackenzie",
  "Albert Einstein",
  "UNIFESP",
  "FAMERP",
  "FAMEMA",
  "Outro",
] as const;

export type Difficulty = "Fácil" | "Médio" | "Difícil";

export type Content = {
  id: string;
  title: string;
  subject: (typeof SUBJECTS)[number];
  vestibular: (typeof VESTIBULARES)[number];
  difficulty: Difficulty;
  readingTime: number;
  excerpt: string;
  body: string;
};

export const CONTENTS: Content[] = [
  {
    id: "funcoes-2grau",
    title: "Funções do 2º grau — Tudo que você precisa saber para o ENEM",
    subject: "Matemática",
    vestibular: "ENEM",
    difficulty: "Médio",
    readingTime: 12,
    excerpt:
      "Domine parábolas, vértice, raízes e aplicações com problemas reais cobrados nas últimas edições.",
    body: `# Funções do 2º grau

Uma função quadrática tem a forma f(x) = ax² + bx + c, com a ≠ 0. Seu gráfico é uma parábola.

## Concavidade
Se a > 0, a parábola tem concavidade para cima. Se a < 0, para baixo.

## Vértice
O vértice (xv, yv) é o ponto de máximo ou mínimo. xv = -b / 2a, yv = -Δ / 4a.

## Raízes
As raízes são obtidas pela fórmula de Bhaskara: x = (-b ± √Δ) / 2a, onde Δ = b² - 4ac.

## Aplicações no ENEM
Lançamento de projéteis, otimização de área, lucro máximo. Sempre identifique se o problema pede o vértice (máximo/mínimo) ou as raízes (zeros).

## Exemplo resolvido
Um agricultor quer cercar um terreno retangular usando 200m de tela. Qual a área máxima?
Perímetro: 2x + 2y = 200 → y = 100 - x. Área: A(x) = x(100 - x) = -x² + 100x.
Vértice em x = 50. A máxima = 2500 m².`,
  },
  {
    id: "analise-sintatica",
    title: "Análise Sintática Completa — FUVEST 2024",
    subject: "Português",
    vestibular: "FUVEST",
    difficulty: "Difícil",
    readingTime: 18,
    excerpt:
      "Sujeito, predicado, complementos verbais e nominais — com questões comentadas da FUVEST.",
    body: `# Análise Sintática

A análise sintática estuda a função das palavras dentro da oração.

## Termos essenciais
- **Sujeito**: ser sobre o qual se declara algo.
- **Predicado**: tudo o que se declara sobre o sujeito.

## Termos integrantes
- **Objeto direto**: completa verbos transitivos diretos sem preposição obrigatória.
- **Objeto indireto**: completa verbos transitivos indiretos com preposição.
- **Complemento nominal**: completa nomes (substantivos, adjetivos, advérbios).

## Termos acessórios
- Adjuntos adnominais e adverbiais, aposto e vocativo.

## Dica FUVEST
A banca adora confundir adjunto adnominal com complemento nominal. Lembre: complemento nominal completa nomes que indicam ação ou estado, geralmente abstratos.`,
  },
  {
    id: "geopolitica-petroleo",
    title: "Geopolítica do Petróleo — Repertório para Redação",
    subject: "Geografia",
    vestibular: "ENEM",
    difficulty: "Médio",
    readingTime: 10,
    excerpt: "Da OPEP às guerras do Oriente Médio: como o petróleo molda o mundo contemporâneo.",
    body: `# Geopolítica do Petróleo

O petróleo é uma das commodities mais estratégicas do mundo, influenciando diplomacia, guerras e economia.

## OPEP
Fundada em 1960, reúne os principais exportadores. Controla cerca de 40% da produção global.

## Conflitos relevantes
- Guerra do Golfo (1991)
- Invasão do Iraque (2003)
- Guerra na Ucrânia e impacto no preço do gás e petróleo

## Brasil e o pré-sal
Descoberta em 2006, projetou o Brasil como grande produtor. Discussão sobre royalties, exploração e transição energética.`,
  },
  {
    id: "leis-newton",
    title: "Leis de Newton com exercícios comentados",
    subject: "Física",
    vestibular: "ENEM",
    difficulty: "Médio",
    readingTime: 15,
    excerpt: "Inércia, F=ma e ação-reação aplicadas com clareza e exemplos do cotidiano.",
    body: `# Leis de Newton

## 1ª Lei — Inércia
Todo corpo tende a manter seu estado de movimento (ou repouso) na ausência de força resultante.

## 2ª Lei — Princípio Fundamental
F_resultante = m · a

## 3ª Lei — Ação e Reação
A toda ação corresponde uma reação de mesma intensidade, direção e sentido oposto.

## Exemplo
Um bloco de 5 kg empurrado com 20 N em superfície sem atrito acelera a 4 m/s².`,
  },
  {
    id: "ingles-unicamp",
    title: "Questões de Inglês por nível — UNICAMP",
    subject: "Inglês",
    vestibular: "UNICAMP",
    difficulty: "Difícil",
    readingTime: 14,
    excerpt: "Reading comprehension, vocabulário e inferência em textos da UNICAMP.",
    body: `# Inglês — UNICAMP

A UNICAMP cobra leitura crítica de textos longos, geralmente jornalísticos ou acadêmicos.

## Estratégias
- Skimming e scanning
- Identificar tese e contra-argumentos
- Inferência lexical pelo contexto

## Vocabulário-chave
however, therefore, despite, in spite of, whereas, nonetheless.`,
  },
  {
    id: "redacao-enem-estrutura",
    title: "Estrutura da Redação ENEM — As 5 Competências",
    subject: "Redação",
    vestibular: "ENEM",
    difficulty: "Médio",
    readingTime: 11,
    excerpt: "Como pontuar 1000 dominando cada competência avaliada pela banca.",
    body: `# Redação ENEM

São 5 competências, cada uma valendo 200 pontos.

1. **Domínio da norma culta**
2. **Compreensão do tema**
3. **Argumentação consistente**
4. **Coesão textual**
5. **Proposta de intervenção** (agente, ação, modo, finalidade, detalhamento)`,
  },
  {
    id: "filosofia-iluminismo",
    title: "Iluminismo: ideias que mudaram o mundo",
    subject: "Filosofia",
    vestibular: "FUVEST",
    difficulty: "Médio",
    readingTime: 9,
    excerpt: "Kant, Voltaire, Rousseau e a razão como motor da história moderna.",
    body: `# Iluminismo

Movimento intelectual do século XVIII que defendeu razão, liberdade e progresso.

## Principais autores
- Kant: "Sapere aude" — Ouse saber.
- Rousseau: contrato social, vontade geral.
- Voltaire: tolerância religiosa.
- Montesquieu: separação dos três poderes.`,
  },
  {
    id: "bio-genetica",
    title: "Genética Mendeliana — princípios e exercícios",
    subject: "Biologia",
    vestibular: "ENEM",
    difficulty: "Fácil",
    readingTime: 8,
    excerpt: "Da ervilha ao DNA: leis de Mendel explicadas com exemplos.",
    body: `# Genética Mendeliana

## 1ª Lei — Segregação dos fatores
Cada característica é determinada por um par de fatores que se separam na formação dos gametas.

## 2ª Lei — Segregação independente
Os fatores para diferentes características separam-se independentemente.`,
  },
  {
    id: "termoquimica",
    title: "Termoquímica — Entalpia e Hess sem mistério",
    subject: "Química",
    vestibular: "FUVEST",
    difficulty: "Médio",
    readingTime: 10,
    excerpt: "Reações exo/endotérmicas, ΔH e a Lei de Hess aplicados a questões da FUVEST.",
    body: `# Termoquímica

## Entalpia (H)
Energia total armazenada numa substância à pressão constante.

## ΔH
- ΔH < 0 → exotérmica (libera calor)
- ΔH > 0 → endotérmica (absorve calor)

## Lei de Hess
A variação de entalpia de uma reação depende apenas dos estados inicial e final, não do caminho.

## Exemplo
Combustão do metano: CH₄ + 2O₂ → CO₂ + 2H₂O, ΔH = -890 kJ/mol.`,
  },
  {
    id: "literatura-modernismo",
    title: "Modernismo brasileiro: 1ª, 2ª e 3ª gerações",
    subject: "Português",
    vestibular: "FUVEST",
    difficulty: "Médio",
    readingTime: 13,
    excerpt: "De Mário de Andrade a Clarice Lispector, o panorama completo cobrado pela FUVEST.",
    body: `# Modernismo

## 1ª Geração (1922-1930)
Semana de Arte Moderna. Ruptura com o passado. Oswald, Mário de Andrade, Manuel Bandeira.

## 2ª Geração (1930-1945)
Romance regionalista e poesia madura. Drummond, Graciliano Ramos, Jorge Amado.

## 3ª Geração (1945-1960)
Geração de 45. Clarice Lispector, Guimarães Rosa, João Cabral de Melo Neto.`,
  },
  {
    id: "sociologia-classicos",
    title: "Sociologia clássica: Marx, Weber e Durkheim",
    subject: "Sociologia",
    vestibular: "UNICAMP",
    difficulty: "Médio",
    readingTime: 12,
    excerpt: "Os três pilares da sociologia e como cada um explica a sociedade moderna.",
    body: `# Sociologia Clássica

## Marx — materialismo histórico
Luta de classes. Burguesia x proletariado. Mais-valia.

## Weber — ação social e racionalização
Tipos de dominação: tradicional, carismática, racional-legal.

## Durkheim — fato social
Coercitivo, externo e geral. Solidariedade mecânica vs orgânica.`,
  },
  {
    id: "geo-globalizacao",
    title: "Globalização e blocos econômicos",
    subject: "Geografia",
    vestibular: "ENEM",
    difficulty: "Fácil",
    readingTime: 9,
    excerpt: "Mercosul, União Europeia, BRICS — entenda quem é quem no tabuleiro global.",
    body: `# Globalização

Integração econômica, cultural e tecnológica acelerada após 1990.

## Principais blocos
- **UE** — união aduaneira + monetária
- **Mercosul** — união aduaneira
- **USMCA** — sucessor do NAFTA
- **BRICS** — Brasil, Rússia, Índia, China, África do Sul (+ expansão 2024)`,
  },
  {
    id: "historia-era-vargas",
    title: "Era Vargas (1930-1945) — do golpe ao Estado Novo",
    subject: "História",
    vestibular: "UNESP",
    difficulty: "Médio",
    readingTime: 14,
    excerpt: "Revolução de 30, Estado Novo, CLT e o legado trabalhista.",
    body: `# Era Vargas

## Governo Provisório (1930-1934)
Fim da República Velha. Crise do café.

## Governo Constitucional (1934-1937)
Constituição liberal. Voto feminino.

## Estado Novo (1937-1945)
Ditadura. DIP, censura. CLT (1943).`,
  },
  {
    id: "mat-trigonometria",
    title: "Trigonometria no triângulo retângulo",
    subject: "Matemática",
    vestibular: "ENEM",
    difficulty: "Fácil",
    readingTime: 8,
    excerpt: "Seno, cosseno e tangente — fundamentos que caem todo ano.",
    body: `# Trigonometria

Em um triângulo retângulo de hipotenusa h:
- sen(θ) = cateto oposto / h
- cos(θ) = cateto adjacente / h
- tan(θ) = oposto / adjacente

## Valores notáveis
| θ | sen | cos | tan |
|---|-----|-----|-----|
| 30° | 1/2 | √3/2 | √3/3 |
| 45° | √2/2 | √2/2 | 1 |
| 60° | √3/2 | 1/2 | √3 |`,
  },
  {
    id: "fis-eletricidade",
    title: "Eletricidade — Lei de Ohm e circuitos",
    subject: "Física",
    vestibular: "UNICAMP",
    difficulty: "Médio",
    readingTime: 11,
    excerpt: "U = R·I, associações em série e paralelo, potência elétrica.",
    body: `# Eletricidade

## Lei de Ohm
U = R · I

## Associação em série
R_eq = R₁ + R₂ + ... (corrente igual em todos)

## Associação em paralelo
1/R_eq = 1/R₁ + 1/R₂ + ... (tensão igual em todos)

## Potência
P = U · I = R · I² = U² / R`,
  },
  {
    id: "bio-ecologia",
    title: "Ecologia — cadeias, ciclos e impactos",
    subject: "Biologia",
    vestibular: "ENEM",
    difficulty: "Fácil",
    readingTime: 10,
    excerpt: "Cadeia alimentar, ciclos biogeoquímicos e a pegada humana no planeta.",
    body: `# Ecologia

## Cadeia alimentar
Produtores → consumidores primários → secundários → decompositores.

## Ciclos
Carbono, nitrogênio, água, fósforo.

## Impactos antrópicos
Efeito estufa, chuva ácida, eutrofização, perda de biodiversidade.`,
  },
  {
    id: "filo-existencialismo",
    title: "Existencialismo: Sartre, Beauvoir e a liberdade",
    subject: "Filosofia",
    vestibular: "UNICAMP",
    difficulty: "Difícil",
    readingTime: 11,
    excerpt: "“A existência precede a essência” — o que isso significa na prática.",
    body: `# Existencialismo

Movimento filosófico do século XX. O ser humano é o que faz de si.

## Sartre
Liberdade radical. Má-fé. Responsabilidade absoluta.

## Simone de Beauvoir
"Não se nasce mulher, torna-se." Fundamenta o feminismo contemporâneo.`,
  },
  {
    id: "port-figuras-linguagem",
    title: "Figuras de linguagem — guia prático",
    subject: "Português",
    vestibular: "ENEM",
    difficulty: "Fácil",
    readingTime: 9,
    excerpt: "Metáfora, metonímia, ironia, hipérbole — reconhecer rápido na prova.",
    body: `# Figuras de Linguagem

## Semânticas
- **Metáfora** — comparação implícita
- **Metonímia** — parte pelo todo
- **Ironia** — dizer o contrário
- **Hipérbole** — exagero

## Sintáticas
- **Elipse** — omissão de termo
- **Anáfora** — repetição no início

## Sonoras
- **Aliteração** — repetição de consoantes
- **Onomatopeia** — imitação de som`,
  },
  {
    id: "mat-probabilidade",
    title: "Probabilidade e análise combinatória sem decoreba",
    subject: "Matemática",
    vestibular: "FUVEST",
    difficulty: "Médio",
    readingTime: 12,
    excerpt:
      "Princípio fundamental da contagem, combinações e probabilidade com exemplos de prova.",
    body: `# Probabilidade e análise combinatória

## Princípio fundamental da contagem
Quando uma escolha tem m opções e outra tem n opções, existem m · n resultados possíveis.

## Combinação
Use combinações quando a ordem não importa: C(n,p) = n! / (p!(n-p)!).

## Probabilidade
Em espaços equiprováveis, P(A) = casos favoráveis / casos possíveis.

## Estratégia
Descreva primeiro o espaço amostral e só depois escolha entre arranjo, permutação ou combinação.`,
  },
  {
    id: "fis-optica-geometrica",
    title: "Óptica geométrica: espelhos, lentes e formação de imagens",
    subject: "Física",
    vestibular: "ITA",
    difficulty: "Difícil",
    readingTime: 16,
    excerpt: "Raios notáveis, equação de Gauss e aumento linear para resolver sistemas ópticos.",
    body: `# Óptica geométrica

## Equação de Gauss
1/f = 1/p + 1/p'. Adote uma convenção de sinais e mantenha-a até o fim.

## Aumento linear
A = i/o = -p'/p. O sinal informa se a imagem é direita ou invertida.

## Raios notáveis
Um raio paralelo converge para o foco; um raio que passa pelo centro óptico não sofre desvio relevante.`,
  },
  {
    id: "qui-equilibrio-quimico",
    title: "Equilíbrio químico e princípio de Le Chatelier",
    subject: "Química",
    vestibular: "IME",
    difficulty: "Difícil",
    readingTime: 15,
    excerpt:
      "Constantes de equilíbrio, quociente reacional e deslocamentos causados por perturbações.",
    body: `# Equilíbrio químico

No equilíbrio, as velocidades das reações direta e inversa são iguais.

## Constante Kc
Produtos sobre reagentes, cada concentração elevada ao coeficiente estequiométrico.

## Le Chatelier
O sistema responde a mudanças de concentração, pressão ou temperatura buscando reduzir a perturbação. Catalisadores não alteram K nem a composição final.`,
  },
  {
    id: "bio-fisiologia-humana",
    title: "Fisiologia humana: integração dos sistemas",
    subject: "Biologia",
    vestibular: "FAMERP",
    difficulty: "Médio",
    readingTime: 14,
    excerpt: "Como os sistemas digestório, respiratório, circulatório e excretor trabalham juntos.",
    body: `# Fisiologia humana

## Trocas e transporte
O sistema digestório fornece nutrientes, o respiratório realiza trocas gasosas e o circulatório distribui substâncias.

## Homeostase
Rins, fígado, pulmões e sistema endócrino cooperam para controlar pH, água, sais e glicemia.

## Dica de prova
Relacione sempre estrutura, função e consequência de uma falha no órgão analisado.`,
  },
  {
    id: "hist-brasil-republica",
    title: "República brasileira: de 1946 à redemocratização",
    subject: "História",
    vestibular: "UERJ",
    difficulty: "Médio",
    readingTime: 13,
    excerpt:
      "Populismo, ditadura militar, abertura política e Constituição de 1988 em uma linha do tempo.",
    body: `# República brasileira

## 1946-1964
Democracia, industrialização, nacional-desenvolvimentismo e aumento das tensões sociais.

## Ditadura militar
Autoritarismo, atos institucionais, censura, milagre econômico e crise da dívida.

## Redemocratização
Diretas Já, fim do regime em 1985 e Constituição cidadã de 1988.`,
  },
  {
    id: "geo-cartografia",
    title: "Cartografia: escala, projeções e leitura de mapas",
    subject: "Geografia",
    vestibular: "UFPR",
    difficulty: "Fácil",
    readingTime: 9,
    excerpt: "Converta escalas, interprete curvas de nível e reconheça distorções cartográficas.",
    body: `# Cartografia

## Escala
Na escala 1:n, uma unidade no mapa equivale a n unidades reais.

## Projeções
Mercator preserva ângulos, Peters prioriza áreas e projeções azimutais partem de um plano de contato.

## Relevo
Curvas de nível próximas indicam maior declividade; curvas afastadas indicam relevo suave.`,
  },
  {
    id: "port-interpretacao",
    title: "Interpretação de texto: inferência, tese e efeitos de sentido",
    subject: "Português",
    vestibular: "UnB",
    difficulty: "Médio",
    readingTime: 11,
    excerpt: "Um método para separar informação explícita, inferência válida e extrapolação.",
    body: `# Interpretação de texto

## Leia o comando primeiro
Identifique se a questão pede informação, inferência, finalidade, tom ou relação entre trechos.

## Evidência textual
Toda alternativa correta precisa ser sustentada pelo texto, mesmo quando exige conhecimento linguístico.

## Armadilhas
Desconfie de generalizações absolutas, troca de causa por consequência e conclusões mais amplas que o texto.`,
  },
  {
    id: "redacao-repertorio",
    title: "Repertório sociocultural produtivo na redação",
    subject: "Redação",
    vestibular: "PUC-SP",
    difficulty: "Fácil",
    readingTime: 8,
    excerpt:
      "Como escolher, explicar e conectar referências ao argumento sem produzir citações decorativas.",
    body: `# Repertório produtivo

Um repertório é produtivo quando está correto, relacionado ao tema e explicado dentro da argumentação.

## Estrutura prática
Apresente a referência, explique a ideia relevante e conecte-a diretamente à tese do parágrafo.

## Evite
Citações soltas, dados sem fonte, referências inventadas e exemplos que substituem a análise.`,
  },
];

// Repertório
export type Repertoire = {
  id: string;
  category: string;
  source: string;
  excerpt: string;
  themes: string[];
};

export const REPERTOIRE: Repertoire[] = [
  {
    id: "r1",
    category: "Filosofia",
    source: "Zygmunt Bauman",
    excerpt:
      '"Modernidade Líquida" — relações humanas, identidades e consumo se tornam fluidos e descartáveis na era digital.',
    themes: ["Tecnologia", "Solidão", "Sociedade"],
  },
  {
    id: "r2",
    category: "Dados e Estatísticas",
    source: "IBGE 2023",
    excerpt:
      "Brasil tem coeficiente de Gini de 0,518, entre os mais desiguais do mundo, segundo o IBGE.",
    themes: ["Desigualdade", "Brasil"],
  },
  {
    id: "r3",
    category: "Citações Poderosas",
    source: "Paulo Freire",
    excerpt:
      '"A educação não transforma o mundo. A educação muda pessoas. Pessoas transformam o mundo."',
    themes: ["Educação", "Transformação social"],
  },
  {
    id: "r4",
    category: "Direitos Humanos & ONU",
    source: "ONU",
    excerpt:
      "Os 17 Objetivos de Desenvolvimento Sustentável (ODS) são referência para temas ambientais, sociais e econômicos.",
    themes: ["Sustentabilidade", "ODS", "Meio ambiente"],
  },
  {
    id: "r5",
    category: "Filosofia",
    source: "Yuval Noah Harari",
    excerpt: '"Homo Deus" discute o futuro da humanidade diante da inteligência artificial.',
    themes: ["IA", "Tecnologia", "Futuro"],
  },
  {
    id: "r6",
    category: "Filosofia",
    source: "Michel Foucault",
    excerpt:
      '"Vigiar e Punir" pode ser aplicado à vigilância digital, redes sociais e privacidade no século XXI.',
    themes: ["Vigilância", "Privacidade", "Poder"],
  },
  {
    id: "r7",
    category: "Dados e Estatísticas",
    source: "PNAD Contínua 2023",
    excerpt: "Cerca de 33 milhões de brasileiros enfrentam fome, segundo a PNAD Contínua 2023.",
    themes: ["Fome", "Desigualdade", "Brasil"],
  },
  {
    id: "r8",
    category: "Filosofia",
    source: "Platão",
    excerpt:
      'A "Alegoria da Caverna" pode ser aplicada à desinformação e à propagação de fake news.',
    themes: ["Fake news", "Verdade", "Mídia"],
  },
  {
    id: "r9",
    category: "Literatura Brasileira",
    source: "Machado de Assis",
    excerpt:
      '"Dom Casmurro" — narrativa do ciúme e da dúvida como crítica social da elite do Segundo Reinado.',
    themes: ["Literatura", "Sociedade", "Crítica social"],
  },
  {
    id: "r10",
    category: "Dados e Estatísticas",
    source: "OMS",
    excerpt: "1 em cada 8 pessoas no mundo vive com algum transtorno mental, segundo a OMS (2022).",
    themes: ["Saúde mental", "Sociedade"],
  },
  {
    id: "r11",
    category: "Literatura Brasileira",
    source: "Clarice Lispector",
    excerpt: '"A Hora da Estrela" denuncia a invisibilidade social dos marginalizados no Brasil.',
    themes: ["Invisibilidade social", "Literatura", "Pobreza"],
  },
  {
    id: "r12",
    category: "Referências Históricas",
    source: "Revolução Industrial",
    excerpt:
      "As consequências ambientais da Revolução Industrial são paralelo histórico para a atual crise climática.",
    themes: ["Meio ambiente", "História", "Crise climática"],
  },
  {
    id: "r13",
    category: "Filosofia",
    source: "Immanuel Kant",
    excerpt:
      '"Sapere aude" — atreva-se a saber. Lema iluminista aplicável à autonomia intelectual.',
    themes: ["Educação", "Iluminismo", "Razão"],
  },
  {
    id: "r14",
    category: "Cultura Pop e Contemporânea",
    source: "Black Mirror (série)",
    excerpt:
      "A série explora os impactos sociais da hiperconectividade, vigilância e dependência tecnológica.",
    themes: ["Tecnologia", "Cultura", "Mídia"],
  },
  {
    id: "r15",
    category: "Meio Ambiente & Sustentabilidade",
    source: "Acordo de Paris (2015)",
    excerpt: "Pacto internacional que estabelece metas para limitar o aquecimento global a 1,5°C.",
    themes: ["Clima", "Sustentabilidade", "Política"],
  },
  {
    id: "r16",
    category: "Filosofia",
    source: "Jean-Jacques Rousseau",
    excerpt:
      '"O homem nasce livre, e por toda parte encontra-se acorrendado." — Do Contrato Social.',
    themes: ["Liberdade", "Política", "Sociedade"],
  },
  {
    id: "r17",
    category: "Literatura Brasileira",
    source: "Carlos Drummond de Andrade",
    excerpt: '"E agora, José?" — sintetiza a angústia existencial e o vazio diante da modernidade.',
    themes: ["Existência", "Modernidade", "Literatura"],
  },
  {
    id: "r18",
    category: "Direitos Humanos & ONU",
    source: "Declaração Universal dos Direitos Humanos (1948)",
    excerpt: "Marco fundamental que define direitos inalienáveis aplicáveis a temas de cidadania.",
    themes: ["Direitos humanos", "Cidadania", "Política"],
  },
  {
    id: "r19",
    category: "Cultura Pop e Contemporânea",
    source: "Documentário 'O Dilema das Redes'",
    excerpt: "Aborda como algoritmos manipulam comportamento e amplificam polarização social.",
    themes: ["Redes sociais", "Manipulação", "Tecnologia"],
  },
  {
    id: "r20",
    category: "Dados e Estatísticas",
    source: "ONU Mulheres",
    excerpt:
      "1 em cada 3 mulheres já sofreu violência física ou sexual no mundo, segundo a ONU Mulheres.",
    themes: ["Violência contra a mulher", "Gênero"],
  },
  {
    id: "r21",
    category: "Referências Históricas",
    source: "Lei Áurea (1888)",
    excerpt:
      "Aboliu formalmente a escravidão no Brasil, mas não garantiu inclusão socioeconômica dos libertos.",
    themes: ["Racismo estrutural", "História", "Brasil"],
  },
  {
    id: "r22",
    category: "Filosofia",
    source: "Hannah Arendt",
    excerpt:
      '"A banalidade do mal" — como ações cruéis se naturalizam quando perdemos a capacidade de pensar.',
    themes: ["Ética", "Política", "Sociedade"],
  },
];

// Redações
export type CompetencyAnnotation = { competency: 1 | 2 | 3 | 4 | 5; note: string };
export type Essay = {
  id: string;
  theme: string;
  year: string;
  vestibular: string;
  score: number;
  body: string;
  annotations: CompetencyAnnotation[];
};

const sampleEssayBody = (
  theme: string,
) => `A obra "Vidas Secas", de Graciliano Ramos, retrata a luta de uma família sertaneja contra a aridez do ambiente e da própria sociedade. De forma análoga, no Brasil contemporâneo, ${theme.toLowerCase()} surge como tema que escancara contradições históricas e sociais. Diante disso, é imprescindível analisar suas causas, consequências e os caminhos para superá-lo.

Em primeiro lugar, é necessário compreender as raízes estruturais do problema. Conforme o sociólogo polonês Zygmunt Bauman, vivemos em uma "modernidade líquida", em que valores e laços tornam-se voláteis e descartáveis. Esse cenário agrava ${theme.toLowerCase()}, na medida em que o tecido social se enfraquece e as instituições falham em proporcionar respostas consistentes às demandas coletivas. Não por acaso, dados do IBGE revelam um Brasil profundamente desigual, com Gini de 0,518, entre os mais altos do mundo.

Ademais, convém observar como a omissão do poder público e a passividade midiática perpetuam o quadro. O filósofo Michel Foucault, em "Vigiar e Punir", demonstra como mecanismos de poder operam de modo sutil, naturalizando injustiças. Quando a sociedade civil é silenciada e o Estado se ausenta, ${theme.toLowerCase()} se cristaliza como prática socialmente tolerada, ferindo princípios fundamentais da Constituição Cidadã de 1988, que prevê a dignidade da pessoa humana como pilar republicano.

Portanto, urge enfrentar tal realidade com ações estruturantes. O Ministério da Educação, em parceria com governos estaduais e organizações da sociedade civil, deve promover campanhas educativas em escolas e mídias digitais, abordando ${theme.toLowerCase()} de modo crítico e formativo. Tais ações, somadas a políticas públicas de fiscalização e financiamento, contribuirão para que a metáfora dos retirantes de Graciliano deixe de ser espelho do nosso presente e se torne, enfim, capítulo superado da história brasileira.`;

const defaultAnnotations: CompetencyAnnotation[] = [
  { competency: 1, note: "Domínio da norma culta: vocabulário preciso e período bem articulado." },
  { competency: 2, note: "Compreensão do tema com tese clara já no primeiro parágrafo." },
  {
    competency: 3,
    note: "Argumentos com repertórios sociocultural pertinente (Bauman, IBGE, Foucault).",
  },
  {
    competency: 4,
    note: "Coesão garantida por conectivos argumentativos: 'em primeiro lugar', 'ademais', 'portanto'.",
  },
  { competency: 5, note: "Proposta com agente, ação, modo, finalidade e detalhamento." },
];

export const ESSAYS: Essay[] = [
  {
    id: "e1",
    theme: "A manipulação do comportamento do usuário pelo controle de dados",
    year: "2023",
    vestibular: "ENEM",
    score: 1000,
    body: sampleEssayBody("a manipulação de dados pessoais"),
    annotations: defaultAnnotations,
  },
  {
    id: "e2",
    theme: "Invisibilidade e registro civil no Brasil",
    year: "2021",
    vestibular: "ENEM",
    score: 1000,
    body: sampleEssayBody("a ausência de registro civil"),
    annotations: defaultAnnotations,
  },
  {
    id: "e3",
    theme: "O estigma associado às doenças mentais na sociedade brasileira",
    year: "2022",
    vestibular: "ENEM",
    score: 1000,
    body: sampleEssayBody("o estigma sobre transtornos mentais"),
    annotations: defaultAnnotations,
  },
  {
    id: "e4",
    theme: "Democratização do acesso ao cinema no Brasil",
    year: "2018",
    vestibular: "ENEM",
    score: 1000,
    body: sampleEssayBody("a barreira de acesso ao cinema"),
    annotations: defaultAnnotations,
  },
  {
    id: "e5",
    theme: "Manipulação do comportamento humano por meio do poder econômico",
    year: "2020",
    vestibular: "ENEM",
    score: 1000,
    body: sampleEssayBody("a manipulação econômica do consumo"),
    annotations: defaultAnnotations,
  },
  {
    id: "e6",
    theme: "O empoderamento feminino como pauta do século XXI",
    year: "Recorrente",
    vestibular: "ENEM",
    score: 1000,
    body: sampleEssayBody("o empoderamento feminino"),
    annotations: defaultAnnotations,
  },
  {
    id: "e7",
    theme: "Desafios para a valorização de comunidades e povos tradicionais no Brasil",
    year: "2019",
    vestibular: "ENEM",
    score: 1000,
    body: sampleEssayBody("a invisibilidade dos povos tradicionais"),
    annotations: defaultAnnotations,
  },
  {
    id: "e8",
    theme: "Fake News e a crise da democracia",
    year: "Contemporâneo",
    vestibular: "ENEM",
    score: 1000,
    body: sampleEssayBody("a desinformação digital"),
    annotations: defaultAnnotations,
  },
  {
    id: "f1",
    theme: "Os impactos do trabalho remoto na sociedade contemporânea",
    year: "2023",
    vestibular: "FUVEST",
    score: 48,
    body: sampleEssayBody("a transformação do trabalho remoto"),
    annotations: defaultAnnotations,
  },
  {
    id: "f2",
    theme: "Diversidade linguística no Brasil",
    year: "2022",
    vestibular: "FUVEST",
    score: 47,
    body: sampleEssayBody("a diversidade linguística"),
    annotations: defaultAnnotations,
  },
  {
    id: "f3",
    theme: "O papel da arte na sociedade",
    year: "2021",
    vestibular: "FUVEST",
    score: 49,
    body: sampleEssayBody("o papel da arte"),
    annotations: defaultAnnotations,
  },
  {
    id: "f4",
    theme: "Tecnologia e privacidade",
    year: "2020",
    vestibular: "FUVEST",
    score: 48,
    body: sampleEssayBody("tecnologia e privacidade"),
    annotations: defaultAnnotations,
  },
  {
    id: "u1",
    theme: "Políticas afirmativas e combate ao racismo",
    year: "2023",
    vestibular: "UNICAMP",
    score: 30,
    body: sampleEssayBody("o combate ao racismo estrutural"),
    annotations: defaultAnnotations,
  },
  {
    id: "u2",
    theme: "Crise climática e responsabilidade global",
    year: "2022",
    vestibular: "UNICAMP",
    score: 29,
    body: sampleEssayBody("a crise climática"),
    annotations: defaultAnnotations,
  },
  {
    id: "u3",
    theme: "Desinformação na era digital",
    year: "2021",
    vestibular: "UNICAMP",
    score: 30,
    body: sampleEssayBody("a desinformação digital"),
    annotations: defaultAnnotations,
  },
];

// Themes
export type Theme = {
  id: string;
  title: string;
  recurrence: number; // 0-100
  subjects: string[];
};

export const THEMES: Theme[] = [
  { id: "t1", title: "Isolamento Social", recurrence: 78, subjects: ["Sociologia", "Saúde"] },
  { id: "t2", title: "Fake News", recurrence: 92, subjects: ["Mídia", "Política"] },
  { id: "t3", title: "Desigualdade Racial", recurrence: 88, subjects: ["História", "Sociologia"] },
  { id: "t4", title: "Saúde Mental", recurrence: 90, subjects: ["Saúde", "Sociedade"] },
  { id: "t5", title: "Inteligência Artificial", recurrence: 85, subjects: ["Tecnologia", "Ética"] },
  { id: "t6", title: "Meio Ambiente", recurrence: 95, subjects: ["Geografia", "Política"] },
  { id: "t7", title: "Educação", recurrence: 80, subjects: ["Sociologia", "Política"] },
  {
    id: "t8",
    title: "Violência Contra a Mulher",
    recurrence: 87,
    subjects: ["Sociologia", "Direito"],
  },
  { id: "t9", title: "Racismo Estrutural", recurrence: 89, subjects: ["História", "Sociologia"] },
  {
    id: "t10",
    title: "Trabalho e Automação",
    recurrence: 76,
    subjects: ["Economia", "Tecnologia"],
  },
  { id: "t11", title: "Mobilidade Urbana", recurrence: 65, subjects: ["Geografia", "Política"] },
  {
    id: "t12",
    title: "Cultura do Cancelamento",
    recurrence: 70,
    subjects: ["Mídia", "Sociologia"],
  },
  { id: "t13", title: "Crise Climática", recurrence: 93, subjects: ["Geografia", "Ciências"] },
  { id: "t14", title: "Direitos LGBTQIA+", recurrence: 82, subjects: ["Direito", "Sociologia"] },
  { id: "t15", title: "Privacidade Digital", recurrence: 84, subjects: ["Tecnologia", "Direito"] },
  {
    id: "t16",
    title: "Vacinação e Saúde Pública",
    recurrence: 73,
    subjects: ["Saúde", "Política"],
  },
  { id: "t17", title: "Acessibilidade", recurrence: 68, subjects: ["Direito", "Sociedade"] },
  {
    id: "t18",
    title: "Refugiados e Migração",
    recurrence: 71,
    subjects: ["Geografia", "Direitos Humanos"],
  },
  {
    id: "t19",
    title: "Influência das Redes Sociais",
    recurrence: 86,
    subjects: ["Mídia", "Sociologia"],
  },
  { id: "t20", title: "Trabalho Infantil", recurrence: 66, subjects: ["Direito", "Sociologia"] },
];

export const MOTIVATIONAL_PHRASES = [
  "A aprovação é uma maratona, não um sprint.",
  "Cada hora de estudo te aproxima do seu sonho.",
  "Disciplina vence motivação todos os dias.",
  "Pequenos progressos diários geram grandes resultados anuais.",
  "Você não precisa ser o melhor, só precisa ser melhor que ontem.",
  "Foque no processo, o resultado vem como consequência.",
  "Estude como se já fosse aprovado.",
];

export const DAILY_TIPS = [
  "Use a técnica Pomodoro: 25min de foco + 5min de pausa para manter a concentração.",
  "Releia suas redações em voz alta — erros saltam aos olhos.",
  "Revise no mesmo dia, no dia seguinte e em uma semana. A repetição espaçada salva memória.",
  "Resolva pelo menos 5 questões de provas anteriores por dia.",
  "Repertório novo na manhã, redação à noite.",
  "Dormir bem é estudar — sono consolida memória.",
];
