// PRIMARIA — manual vivo da marca. Tudo que a máquina sabe sobre a identidade mora aqui.
// Edite este arquivo para mudar regras, frases, imagens e logos (o site e a IA leem daqui).

export const COLORS = {
  vermelho: '#cc1410',
  branco: '#ffffff',
  grafite: '#2e2b2a',
  preto: '#000000',
};

export const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export const FORMATS = {
  feed: { w: 1080, h: 1350, label: 'Post 4:5' },
  story: { w: 1080, h: 1920, label: 'Story 9:16' },
};

// variant: desenho do logo. tone: cor. ratio = largura / altura do arquivo.
export const LOGOS = [
  { id: 'preto', variant: 'degrau', tone: 'preto', file: 'assets/logos/preto.png', ratio: 2400 / 410 },
  { id: 'branco', variant: 'degrau', tone: 'branco', file: 'assets/logos/branco.png', ratio: 2400 / 374 },
  { id: 'vermelho', variant: 'degrau', tone: 'vermelho', file: 'assets/logos/vermelho.png', ratio: 2400 / 410 },
  { id: 'preto_slogan', variant: 'degrau_slogan', tone: 'preto', file: 'assets/logos/preto_slogan.png', ratio: 2400 / 460 },
  { id: 'branco_slogan', variant: 'degrau_slogan', tone: 'branco', file: 'assets/logos/branco_slogan.png', ratio: 2400 / 463 },
  { id: 'vermelho_slogan', variant: 'degrau_slogan', tone: 'vermelho', file: 'assets/logos/vermelho_slogan.png', ratio: 2400 / 460 },
  { id: 'preto_00000', variant: 'linear_00000', tone: 'preto', file: 'assets/logos/preto_00000.png', ratio: 2400 / 407 },
  { id: 'branco_00000', variant: 'linear_00000', tone: 'branco', file: 'assets/logos/branco_00000.png', ratio: 2400 / 407 },
  { id: 'vermelho_00000', variant: 'linear_00000', tone: 'vermelho', file: 'assets/logos/vermelho_00000.png', ratio: 2400 / 407 },
];

// kind: rosto | corpo | detalhe | textura. red: a foto tem vermelho que vale preservar.
export const IMAGES = [
  { id: 'rosto_mulher', kind: 'rosto', file: 'assets/images/rosto_mulher.jpg', desc: 'mulher de cabelo preto longo, olhar direto, rosto e ombros' },
  { id: 'olhos', kind: 'rosto', file: 'assets/images/olhos.jpg', desc: 'faixa horizontal dos olhos da mulher, delineado forte' },
  { id: 'boca', kind: 'rosto', file: 'assets/images/boca.jpg', desc: 'close da boca e queixo, horizontal' },
  { id: 'rosto_cacheado', kind: 'rosto', file: 'assets/images/rosto_cacheado.jpg', desc: 'rapaz de cabelo cacheado, blusa preta, retrato' },
  { id: 'rosto_rapaz', kind: 'rosto', file: 'assets/images/rosto_rapaz.jpg', desc: 'rapaz de cabelo curto, camiseta branca, retrato' },
  { id: 'corpo_mulher', kind: 'corpo', file: 'assets/images/corpo_mulher.jpg', desc: 'mulher de corpo inteiro com camiseta YGP das freiras, vertical estreita' },
  { id: 'corredor', kind: 'corpo', file: 'assets/images/corredor.jpg', desc: 'mulher no fim de um corredor estreito, composição simétrica' },
  { id: 'corpo_cacheado', kind: 'corpo', file: 'assets/images/corpo_cacheado.jpg', desc: 'rapaz cacheado de corpo inteiro na porta, roupa preta, vertical estreita' },
  { id: 'dupla', kind: 'corpo', file: 'assets/images/dupla.jpg', desc: 'dois rapazes num banheiro antigo com porta amarela, piso xadrez' },
  { id: 'cabelo', kind: 'detalhe', file: 'assets/images/cabelo.jpg', desc: 'cabelo preto caindo sobre camiseta branca, vertical' },
  { id: 'estampa_freiras', kind: 'detalhe', file: 'assets/images/estampa_freiras.jpg', desc: 'estampa YGP de duas freiras na camiseta, meio-tom natural' },
  { id: 'estampa_camiseta', kind: 'detalhe', file: 'assets/images/estampa_camiseta.jpg', desc: 'estampa das freiras vista no corpo do rapaz' },
  { id: 'mao_porta', kind: 'detalhe', file: 'assets/images/mao_porta.jpg', desc: 'mão com anel segurando a porta, manga branca' },
  { id: 'manga_estrelas', kind: 'detalhe', file: 'assets/images/manga_estrelas.jpg', desc: 'manga preta com duas estrelas vermelhas', red: true },
  { id: 'pernas', kind: 'detalhe', file: 'assets/images/pernas.jpg', desc: 'barra da camiseta e pernas tatuadas, horizontal' },
  { id: 'piso', kind: 'textura', file: 'assets/images/piso.jpg', desc: 'piso xadrez gasto preto e branco' },
  { id: 'cano_vermelho', kind: 'textura', file: 'assets/images/cano_vermelho.jpg', desc: 'cano vermelho vertical em parede branca descascada', red: true },
];

// Efeitos aprovados (podem ser usados). O peso inicial vem das peças aprovadas no canvas.
export const EFFECTS = {
  movimento: { label: 'Borrão de movimento', weight: 3, desc: 'cópias deslocadas na horizontal com rastro, figura andando/tremendo' },
  meio_tom: { label: 'Meio-tom', weight: 3, desc: 'pontos de retícula de impressão, preto e branco' },
  raio_x: { label: 'Raio-x', weight: 2, desc: 'negativo invertido com brilho, melhor em rostos' },
  sepia_papel: { label: 'Impressão sépia em papel', weight: 3, desc: 'foto borrada em tom sépia impressa em papel com borda de tinta irregular' },
  fotocopia: { label: 'Fotocópia', weight: 2, desc: 'alto contraste 1-bit com ruído de xerox' },
  vermelho_seletivo: { label: 'Vermelho seletivo', weight: 2, desc: 'tudo preto e branco menos o vermelho, que vira #cc1410', needsRed: true },
  borrado: { label: 'Borrado', weight: 2, desc: 'desfoque forte com grão, identidade escondida, clima de memória' },
  grao: { label: 'Grão gasto', weight: 2, desc: 'preto e branco com grão, poeira e riscos, foto de arquivo' },
};

// Coisas reprovadas: a máquina não repete.
export const REJECTED = [
  'rosto se desfazendo em pixels (efeito glitch/dissolve)',
  'rosto rabiscado com anotações à mão',
  'sequência cópia da cópia degradando',
  'raio-x de corpo inteiro com frase gigante no topo',
  'polaroid com olhos borrados sobre fundo de meio-tom no feed',
  'texto de marcas em etiquetas brancas sobre estampa em meio-tom',
  'descritor em coluna estreita ao lado de fotocópia',
];

// Arquétipos de composição vindos das peças aprovadas. São pontos de partida, não templates fixos.
export const ARCHETYPES = {
  sangrado: 'imagem ocupando tudo, texto pequeno num canto, logo pequeno no canto oposto',
  papel: 'impressão sépia em papel com borda irregular ocupando quase tudo; logo branco e textos brancos por dentro da impressão',
  grade: 'grade de 6 a 12 rostos em meio-tom/gasto com algumas células vazias que recebem texto',
  painel: 'imagem no topo (60%) e painel branco embaixo com logo e lista de informações',
  faixa: 'imagem com movimento de fundo e uma faixa clara atravessando com a frase',
  zeros: 'textura escura (piso) com os onze zeros enormes em branco e uma frase curta',
  recorte: 'imagem recortada numa área (metade, coluna ou quadro) e tipografia ocupando o espaço branco',
};

export const RULES = [
  'Fonte única: Helvetica (regular e negrito), sempre em CAIXA ALTA, com espaçamento entre letras largo (0.08em a 0.2em) em textos pequenos.',
  'Paleta: #cc1410 (vermelho), #ffffff, #2e2b2a (grafite), #000000. Nada além disso em texto e fundo.',
  'Logo preto sobre fundo claro. Logo branco sobre fundo escuro ou foto escura. Logo vermelho só sobre fundo branco/claro, com parcimônia.',
  'Vermelho é acento: data, horário, uma palavra, estrelas. Nunca bloco grande de texto vermelho.',
  'Estética fria: preto e branco, grão, borrão, meio-tom, arte retrô gasta. Sem gradientes coloridos, sem emojis, sem ícones.',
  'Muito espaço vazio. Texto pequeno e preciso; frase grande só uma por peça.',
  'O nome é PRIMARIA, sem acento. Os zeros são sempre onze: 00000000000.',
  'Um logo por peça. Margem mínima de 60px nas bordas.',
];

// Conceito: valorizamos o que é primário (ideias com essência). Referência sim; cópia sem alma não.
export const CONCEPT = `PRIMARIA é uma curadoria de moda, música e cultura. Valoriza o que é primário: ideias e marcas com essência,
que se conectam de forma primária com as pessoas, num mundo cheio de coisas secundárias, sem toque imaginativo.
Não é sobre fazer tudo do zero nem negar referências. Os onze zeros são o ponto de origem de uma ideia, antes de ela virar série.
Tom: seco, confiante, curto, um pouco irônico com a cultura da cópia. Nunca didático, nunca "somos diferentes".
Evite dizer "fazemos tudo do zero" ou "sem referências".`;

export const PHRASES = [
  'PROTECT THE ORIGINAL ONE.',
  'TUDO É SECUNDÁRIO AGORA.',
  'NADA MAIS COMEÇA. TUDO CONTINUA.',
  'PARTIMOS DO OUTRO LADO: DA ORIGEM.',
  'O QUE É PRIMÁRIO NÃO SE REPETE.',
  'ESSÊNCIA NÃO TEM NÚMERO DE SÉRIE.',
  'NUM MUNDO SECUNDÁRIO, O PRIMÁRIO SE RECONHECE.',
  'ANTES DA PRIMEIRA CÓPIA.',
  'O ORIGINAL AINDA EXISTE.',
  'REFERÊNCIA SIM. CÓPIA SEM ALMA, NÃO.',
];

export const EVENT = {
  data: '17 OUTUBRO',
  dataCurta: '17.10',
  horario: '11:30 - 19:30',
  endereco: 'RUA PEDROSO, 476',
  bairro: 'BELA VISTA - SÃO PAULO - SP',
  marcas: ['CLOSET ARCHIVE', 'YOUNG GENERATION PRODUCTIONS'],
  lineup: ['[DJ 01]', '[DJ 02]', '[DJ 03]'],
  descritor: 'PRIMARIA É UMA CURADORIA DE MODA, MÚSICA E CULTURA QUE VALORIZA O QUE É PRIMÁRIO.',
  tagline: 'CURATED. CONCEIVED. FROM ZERO.',
  zeros: '00000000000',
};
