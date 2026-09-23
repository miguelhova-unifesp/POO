// contrato de turno
interface AtualizavelPorTurno {
  novoTurno(): void;
}

// contrato de arma
interface Arma extends AtualizavelPorTurno {
  readonly nome: string;

  atacar(): number | null;
}

// contrato de efeito
interface Efeito extends AtualizavelPorTurno {
  readonly nome: string;

  terminou(): boolean;
}

// abstração de alvo
interface Alvo {
  readonly personagens: readonly Personagem[];
}

// contrato de habilidade
interface Habilidade extends AtualizavelPorTurno {
  readonly nome: string;

  usar(usuario: Personagem, alvo: Alvo): void;
}

// controle de recarga
class Cooldown implements AtualizavelPorTurno {
  private turnosRestantes = 0;

  constructor(private readonly duracao: number) {}

  disponivel(): boolean {
    return this.turnosRestantes === 0;
  }

  iniciar(): void {
    this.turnosRestantes = this.duracao;
  }

  novoTurno(): void {
    if (this.turnosRestantes > 0) {
      this.turnosRestantes--;
    }
  }
}

// alvo individual
class AlvoUnico implements Alvo {
  readonly personagens: readonly Personagem[];

  constructor(personagem: Personagem) {
    this.personagens = [personagem];
  }
}

// alvo múltiplo
class AlvoEmGrupo implements Alvo {
  readonly personagens: readonly Personagem[];

  constructor(personagens: readonly Personagem[]) {
    this.personagens = [...personagens];
  }
}

// regras comuns compartilhadas
class UsoDeHabilidade implements AtualizavelPorTurno {
  private readonly cooldown: Cooldown;

  constructor(
    private readonly nome: string,
    private readonly custoMana: number,
    duracaoCooldown: number
  ) {
    this.cooldown = new Cooldown(duracaoCooldown);
  }

  // valida e aplica
  executar(
    usuario: Personagem,
    alvo: Alvo,
    acao: (atingido: Personagem) => void
  ): void {
    if (!usuario.estaVivo()) {
      console.log(`${usuario.nome} não pode usar ${this.nome}.`);
      return;
    }

    // checa recarga
    if (!this.cooldown.disponivel()) {
      console.log(`${this.nome} está em recarga.`);
      return;
    }

    // checa mana
    if (!usuario.consumirMana(this.custoMana)) {
      console.log(`${this.nome}: mana insuficiente.`);
      return;
    }

    this.cooldown.iniciar();

    // aplica em alvos
    for (const atingido of alvo.personagens) {
      acao(atingido);
    }
  }

  novoTurno(): void {
    this.cooldown.novoTurno();
  }
}

// habilidade de dano
class BolaDeFogo implements Habilidade {
  readonly nome = "Bola de Fogo";

  private readonly dano = 40;
  private readonly uso = new UsoDeHabilidade(this.nome, 20, 2);

  usar(usuario: Personagem, alvo: Alvo): void {
    this.uso.executar(usuario, alvo, (atingido) => {
      console.log(
        `${usuario.nome} lançou ${this.nome} em ${atingido.nome} ` +
        `(${this.dano} de dano).`
      );

      atingido.receberDano(this.dano);
    });
  }

  novoTurno(): void {
    this.uso.novoTurno();
  }
}

// habilidade de cura
class Cura implements Habilidade {
  readonly nome = "Cura";

  private readonly quantidade = 30;
  private readonly uso = new UsoDeHabilidade(this.nome, 15, 1);

  usar(usuario: Personagem, alvo: Alvo): void {
    this.uso.executar(usuario, alvo, (atingido) => {
      console.log(
        `${usuario.nome} usou ${this.nome} em ${atingido.nome} ` +
        `(${this.quantidade} de vida).`
      );

      atingido.curar(this.quantidade);
    });
  }

  novoTurno(): void {
    this.uso.novoTurno();
  }
}

// dano sem mana
class GolpePoderoso implements Habilidade {
  readonly nome = "Golpe Poderoso";

  private readonly dano = 60;
  private readonly uso = new UsoDeHabilidade(this.nome, 0, 3);

  usar(usuario: Personagem, alvo: Alvo): void {
    this.uso.executar(usuario, alvo, (atingido) => {
      console.log(
        `${usuario.nome} acertou ${this.nome} em ${atingido.nome} ` +
        `(${this.dano} de dano).`
      );

      atingido.receberDano(this.dano);
    });
  }

  novoTurno(): void {
    this.uso.novoTurno();
  }
}

// dano em área
class Explosao implements Habilidade {
  readonly nome = "Explosão";

  private readonly dano = 20;
  private readonly uso = new UsoDeHabilidade(this.nome, 25, 3);

  usar(usuario: Personagem, alvo: Alvo): void {
    this.uso.executar(usuario, alvo, (atingido) => {
      console.log(
        `${usuario.nome} atingiu ${atingido.nome} com ${this.nome} ` +
        `(${this.dano} de dano).`
      );

      atingido.receberDano(this.dano);
    });
  }

  novoTurno(): void {
    this.uso.novoTurno();
  }
}

// habilidade autoral extra
class DrenarVida implements Habilidade {
  readonly nome = "Drenar Vida";

  private readonly dano = 25;
  private readonly roubo = 15;
  private readonly uso = new UsoDeHabilidade(this.nome, 10, 2);

  usar(usuario: Personagem, alvo: Alvo): void {
    this.uso.executar(usuario, alvo, (atingido) => {
      console.log(
        `${usuario.nome} drenou ${this.dano} de vida de ${atingido.nome}.`
      );

      atingido.receberDano(this.dano);
      usuario.curar(this.roubo);
    });
  }

  novoTurno(): void {
    this.uso.novoTurno();
  }
}

// arma corpo a corpo
class Espada implements Arma {
  private readonly cooldown: Cooldown;

  constructor(
    public readonly nome: string,
    private readonly dano: number
  ) {
    this.cooldown = new Cooldown(1);
  }

  atacar(): number | null {
    if (!this.cooldown.disponivel()) {
      console.log(`${this.nome} está em cooldown.`);
      return null;
    }

    this.cooldown.iniciar();

    return this.dano;
  }

  novoTurno(): void {
    this.cooldown.novoTurno();
  }
}

// arma com munição
class Arco implements Arma {
  private readonly cooldown: Cooldown;

  constructor(
    public readonly nome: string,
    private readonly dano: number,
    private flechas: number,
    private readonly capacidadeFlechas: number
  ) {
    this.cooldown = new Cooldown(2);
  }

  atacar(): number | null {
    if (!this.cooldown.disponivel()) {
      console.log(`${this.nome} está em cooldown.`);
      return null;
    }

    // sem flechas restantes
    if (this.flechas === 0) {
      console.log(`${this.nome}: não há flechas.`);
      return null;
    }

    this.flechas--;

    this.cooldown.iniciar();

    console.log(
      `${this.nome}: flecha disparada (${this.flechas} restantes).`
    );

    return this.dano;
  }

  recarregar(quantidade: number): void {
    this.flechas = Math.min(
      this.flechas + quantidade,
      this.capacidadeFlechas
    );

    console.log(
      `${this.nome}: ${this.flechas}/${this.capacidadeFlechas} flechas.`
    );
  }

  novoTurno(): void {
    this.cooldown.novoTurno();
  }
}

// arma com mana
class VarinhaMagica implements Arma {
  private readonly cooldown: Cooldown;

  constructor(
    public readonly nome: string,
    private readonly dano: number,
    private mana: number,
    private readonly manaMaxima: number,
    private readonly custoMana: number
  ) {
    this.cooldown = new Cooldown(2);
  }

  atacar(): number | null {
    if (!this.cooldown.disponivel()) {
      console.log(`${this.nome} está em cooldown.`);
      return null;
    }

    if (this.mana < this.custoMana) {
      console.log(`${this.nome}: mana insuficiente.`);
      return null;
    }

    this.mana -= this.custoMana;
    this.cooldown.iniciar();

    console.log(
      `${this.nome}: mana ${this.mana}/${this.manaMaxima}.`
    );

    return this.dano;
  }

  recuperarMana(quantidade: number): void {
    this.mana = Math.min(
      this.mana + quantidade,
      this.manaMaxima
    );

    console.log(
      `${this.nome}: mana ${this.mana}/${this.manaMaxima}.`
    );
  }

  novoTurno(): void {
    this.cooldown.novoTurno();
  }
}

// item do inventário
class Item {
  constructor(
    public readonly nome: string,
    public readonly valor: number
  ) {}
}

// coleção de itens
class Inventario {
  private readonly itens: Item[] = [];

  adicionar(item: Item): void {
    this.itens.push(item);
  }

  remover(item: Item): boolean {
    const indice = this.itens.indexOf(item);

    if (indice === -1) {
      return false;
    }

    this.itens.splice(indice, 1);
    return true;
  }

  // cópia defensiva
  listar(): readonly Item[] {
    return [...this.itens];
  }
}

// dano por turno
class Veneno implements Efeito {
  private turnosRestantes: number;

  constructor(
    public readonly nome: string,
    private readonly personagem: Personagem,
    private readonly danoPorTurno: number,
    duracao: number
  ) {
    this.turnosRestantes = duracao;
  }

  novoTurno(): void {
    if (this.terminou()) {
      return;
    }

    console.log(
      `${this.personagem.nome} sofreu ` +
      `${this.danoPorTurno} de dano por ${this.nome}.`
    );

    this.personagem.receberDano(this.danoPorTurno);

    this.turnosRestantes--;
  }

  terminou(): boolean {
    return this.turnosRestantes === 0;
  }
}

// cura por turno
class Regeneracao implements Efeito {
  private turnosRestantes: number;

  constructor(
    public readonly nome: string,
    private readonly personagem: Personagem,
    private readonly curaPorTurno: number,
    duracao: number
  ) {
    this.turnosRestantes = duracao;
  }

  novoTurno(): void {
    if (this.terminou()) {
      return;
    }

    console.log(
      `${this.personagem.nome} recuperou ` +
      `${this.curaPorTurno} HP por ${this.nome}.`
    );

    this.personagem.curar(this.curaPorTurno);

    this.turnosRestantes--;
  }

  terminou(): boolean {
    return this.turnosRestantes === 0;
  }
}

// entidade central
class Personagem implements AtualizavelPorTurno {
  // estado encapsulado
  private vida: number
  private mana: number
  private nivel = 1
  private experiencia = 0

  // composições internas
  private readonly inventario: Inventario
  private readonly efeitos: Efeito[] = []
  private readonly habilidades: Habilidade[] = []

  // observadores de turno
  private readonly atualizaveis: AtualizavelPorTurno[] = []

  constructor(
    public readonly nome: string,
    private vidaMaxima: number,
    private manaMaxima: number,
    private readonly arma: Arma
  ) {
    this.vida = vidaMaxima
    this.mana = manaMaxima
    this.inventario = new Inventario()
    this.registrarAtualizavel(arma)
  }

  // ataque com arma
  atacar(inimigo: Personagem): void {
    if (!this.estaVivo()) {
      console.log("Inimigo derrotado.")
      return
    }

    const dano = this.arma.atacar()
    if (dano == null) {
      return
    }

    console.log(`${this.nome} atacou ${inimigo.nome}` +
      ` com ${this.arma.nome}`
    )

    inimigo.receberDano(dano)
    this.ganharExperiencia(10)
  }

  // registra nova habilidade
  aprenderHabilidade(habilidade: Habilidade) {
    this.habilidades.push(habilidade)
    this.registrarAtualizavel(habilidade)
  }

  // delega para habilidade
  usarHabilidade(nome: string, alvo: Alvo) {
    const habilidade = this.habilidades.find(
      (candidata) => candidata.nome === nome
    )

    if (!habilidade) {
      console.log(`${this.nome} não conhece ${nome}.`)
      return
    }

    habilidade.usar(this, alvo)
  }

  listarHabilidades(): readonly string[] {
    return this.habilidades.map((habilidade) => habilidade.nome)
  }

  // gasta mana encapsulada
  consumirMana(quantidade: number): boolean {
    if (this.mana < quantidade) {
      return false
    }

    this.mana -= quantidade
    return true
  }

  recuperarMana(quantidade: number) {
    this.mana = Math.min(
      this.mana + quantidade,
      this.manaMaxima
    )
  }

  manaAtual(): number {
    return this.mana
  }

  receberDano(dano: number) {
    this.vida = Math.max(0, this.vida - dano)
    if (!this.estaVivo()) {
      console.log(`${this.nome} foi derrotado!`)
    }
  }

  curar(quantidade: number) {
    this.vida = Math.min(
      this.vida + quantidade,
      this.vidaMaxima
    )
  }

  estaVivo() {
    return this.vida > 0
  }

  ganharExperiencia(quantidade: number) {
    this.experiencia += quantidade
  }

  private verificarSubidaDeNivel() {
    while(this.nivel < Personagem.XP_POR_NIVEL.length &&
      this.experiencia >= Personagem.XP_POR_NIVEL[this.nivel]
    ) {
      this.subirDeNivel()
    }
  }

  private subirDeNivel() {
    this.nivel++
    this.vidaMaxima += 20
    this.vida = this.vidaMaxima
    this.manaMaxima += 10
    this.mana = this.manaMaxima

    console.log(`${this.nome} subiu para o nível ${this.nivel}`)
  }

  adicionarItem(item: Item) {
    this.inventario.adicionar(item)
  }

  removerItem(item: Item) {
    this.inventario.remover(item)
  }

  mostrarInventario() {
    console.log(`Inventario de ${this.nome}`)

    for (const item of this.inventario.listar()) {
      console.log(`- ${item.nome} (${item.valor})`)
    }
  }

  adicionarEfeito(efeito: Efeito) {
    this.efeitos.push(efeito)
    this.registrarAtualizavel(efeito)
  }

  private registrarAtualizavel(objeto: AtualizavelPorTurno) {
    this.atualizaveis.push(objeto)
  }

  // propaga o turno
  novoTurno() {
    for (const objeto of [...this.atualizaveis]) {
      objeto.novoTurno()
    }

    this.verificarSubidaDeNivel()

    this.removerEfeitosTerminados()
  }

  // limpeza de efeitos
  private removerEfeitosTerminados() {
    for (let i = this.efeitos.length - 1; i >= 0; i--) {
      const efeito = this.efeitos[i]
      if (!efeito.terminou()) {
        continue
      }

      this.efeitos.splice(i, 1)

      const indiceAtualizavel = this.atualizaveis.indexOf(efeito)
      if (indiceAtualizavel !== -1) {
        this.atualizaveis.splice(indiceAtualizavel, 1)
      }
    }
  }

  // tabela de progressão
  private static readonly XP_POR_NIVEL = [
    0,
    100,
    250,
    500,
    900,
    1400,
    2000
  ];
}

// orquestrador de turnos
class Jogo {
  private readonly personagens: Personagem[] = []
  private turno = 0

  adicionarPersonagem(personagem: Personagem) {
    this.personagens.push(personagem)
  }

  // apenas notifica personagens
  novoTurno() {
    this.turno++

    console.log(`--- Turno ${this.turno} ---`)

    for (const personagem of this.personagens) {
      personagem.novoTurno()
    }
  }
}

// montagem do cenário
const jogo = new Jogo()

const espada = new Espada("Espada longa", 25)

const arco = new Arco("Arco Élfico", 20, 3, 3)

const varinha = new VarinhaMagica("Varinha de fogo", 30, 50, 50, 10)

const arqueiro = new Personagem("Arqueiro", 100, 40, arco)
const guerreiro = new Personagem("Guerreiro", 150, 30, espada)
const mago = new Personagem("Mago", 80, 100, varinha)

jogo.adicionarPersonagem(guerreiro)
jogo.adicionarPersonagem(mago)
jogo.adicionarPersonagem(arqueiro)

// habilidades aprendidas
mago.aprenderHabilidade(new BolaDeFogo())
mago.aprenderHabilidade(new Cura())
mago.aprenderHabilidade(new Explosao())
mago.aprenderHabilidade(new DrenarVida())

guerreiro.aprenderHabilidade(new GolpePoderoso())

guerreiro.adicionarItem(new Item("Poção de vida", 50))
guerreiro.adicionarItem(new Item("Anel mágico", 200))

guerreiro.mostrarInventario()

// combate com armas
guerreiro.atacar(arqueiro)
arqueiro.atacar(guerreiro)
mago.atacar(guerreiro)

// segundo uso bloqueado
mago.usarHabilidade("Bola de Fogo", new AlvoUnico(guerreiro))
mago.usarHabilidade("Bola de Fogo", new AlvoUnico(guerreiro))

guerreiro.usarHabilidade("Golpe Poderoso", new AlvoUnico(mago))
guerreiro.usarHabilidade("Golpe Poderoso", new AlvoUnico(mago))

// habilidade em área
mago.usarHabilidade("Explosão", new AlvoEmGrupo([guerreiro, arqueiro]))

// efeitos aplicados
arqueiro.adicionarEfeito(
  new Veneno(
    "Envenenado",
    arqueiro,
    5,
    3
  )
)

guerreiro.adicionarEfeito(
  new Regeneracao(
    "Regeneração",
    guerreiro,
    8,
    2
  )
)

jogo.novoTurno()

mago.usarHabilidade("Cura", new AlvoUnico(mago))
mago.usarHabilidade("Drenar Vida", new AlvoUnico(arqueiro))

jogo.novoTurno()

mago.usarHabilidade("Bola de Fogo", new AlvoUnico(arqueiro))
mago.usarHabilidade("Explosão", new AlvoEmGrupo([guerreiro, arqueiro]))

jogo.novoTurno()