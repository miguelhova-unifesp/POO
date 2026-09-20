// Contratos

    //Qualquer objeto que precisa reagir à passagem de um turno. 
interface AtualizavelPorTurno {
  novoTurno(): void
}


interface Arma extends AtualizavelPorTurno {
  readonly nome: string
  atacar(): number
  descrever(): string
}

    // Contrato de efeito temporário
interface Efeito extends AtualizavelPorTurno {
  readonly nome: string
  readonly ativo: boolean
  aplicarEm(alvo: Personagem): void
}

//Peças reutilizaveis (composição)

class Cooldown implements AtualizavelPorTurno {
  private turnosRestantes = 0

  constructor(private readonly duracao: number) {}

  disponivel(): boolean {
    return this.turnosRestantes === 0
  }

  iniciar(): void {
    this.turnosRestantes = this.duracao + 1
  }

  novoTurno(): void {
    if (this.turnosRestantes > 0) {
      this.turnosRestantes--
    }
  }

  get restante(): number {
    return this.turnosRestantes
  }
}

    //Contagem regressiva utilizada por efeitos temporários

class ContadorDeTurnos {
  private restantes: number

  constructor(turnos: number) {
    this.restantes = turnos
  }

  get expirou(): boolean {
    return this.restantes <= 0
  }

  get turnosRestantes(): number {
    return this.restantes
  }

  consumir(): void {
    if (this.restantes > 0) {
      this.restantes--
    }
  }
}

// Armas

class Espada implements Arma {
  private readonly cooldown: Cooldown

  constructor(
    public readonly nome: string,
    private readonly dano: number,
    duracaoCooldown: number = 1
  ) {
    this.cooldown = new Cooldown(duracaoCooldown)
  }

  atacar(): number {
    if (!this.cooldown.disponivel()) {
      console.log(`   [${this.nome}] em cooldown (${this.cooldown.restante} turno(s)).`)
      return 0
    }

    this.cooldown.iniciar()
    return this.dano
  }

  novoTurno(): void {
    this.cooldown.novoTurno()
  }

  descrever(): string {
    return `${this.nome} (dano ${this.dano})`
  }
}

class Arco implements Arma {
  private readonly cooldown: Cooldown

  constructor(
    public readonly nome: string,
    private readonly dano: number,
    private flechas: number,
    private readonly capacidade: number,
    duracaoCooldown: number = 1
  ) {
    this.flechas = Math.min(flechas, capacidade)
    this.cooldown = new Cooldown(duracaoCooldown)
  }

  atacar(): number {
    if (!this.cooldown.disponivel()) {
      console.log(`   [${this.nome}] em cooldown (${this.cooldown.restante} turno(s)).`)
      return 0
    }

    if (this.flechas === 0) {
      console.log(`   [${this.nome}] sem flechas!`)
      return 0
    }

    this.flechas--
    this.cooldown.iniciar()
    return this.dano
  }

  carregarFlechas(quantidade: number): void {
    this.flechas = Math.min(this.flechas + quantidade, this.capacidade)
    console.log(`   [${this.nome}] recarregado: ${this.flechas}/${this.capacidade} flechas.`)
  }

  novoTurno(): void {
    this.cooldown.novoTurno()
  }

  descrever(): string {
    return `${this.nome} (dano ${this.dano}, ${this.flechas}/${this.capacidade} flechas)`
  }
}

class VarinhaMagica implements Arma {
  private readonly cooldown: Cooldown

  constructor(
    public readonly nome: string,
    private readonly dano: number,
    private mana: number,
    private readonly manaMaxima: number,
    private readonly custoPorAtaque: number = 15,
    duracaoCooldown: number = 2
  ) {
    this.mana = Math.min(mana, manaMaxima)
    this.cooldown = new Cooldown(duracaoCooldown)
  }

  atacar(): number {
    if (!this.cooldown.disponivel()) {
      console.log(`   [${this.nome}] em cooldown (${this.cooldown.restante} turno(s)).`)
      return 0
    }

    if (this.mana < this.custoPorAtaque) {
      console.log(`   [${this.nome}] mana insuficiente (${this.mana}/${this.custoPorAtaque}).`)
      return 0
    }

    this.mana -= this.custoPorAtaque
    this.cooldown.iniciar()
    return this.dano
  }

  recuperarMana(quantidade: number): void {
    this.mana = Math.min(this.mana + quantidade, this.manaMaxima)
    console.log(`   [${this.nome}] mana: ${this.mana}/${this.manaMaxima}.`)
  }

  novoTurno(): void {
    this.cooldown.novoTurno()
  }

  descrever(): string {
    return `${this.nome} (dano ${this.dano}, mana ${this.mana}/${this.manaMaxima})`
  }
}

// Inventários e itens (composição)

class Item {
  constructor(
    public readonly nome: string,
    public readonly valor: number
  ) {}
}

class Inventario {
  private readonly itens: Item[] = []

  adicionar(item: Item): void {
    this.itens.push(item)
  }

  remover(item: Item): boolean {
    const indice = this.itens.indexOf(item)
    if (indice === -1) {
      return false
    }
    this.itens.splice(indice, 1)
    return true
  }

  get todos(): readonly Item[] {
    return [...this.itens]
  }

  get valorTotal(): number {
    return this.itens.reduce((soma, item) => soma + item.valor, 0)
  }

  listar(): void {
    if (this.itens.length === 0) {
      console.log('   Inventário vazio.')
      return
    }

    console.log('   Inventário:')
    for (const item of this.itens) {
      console.log(`    - ${item.nome} (${item.valor})`)
    }
    console.log(`    Total: ${this.valorTotal}`)
  }
}

// Personagens

class Personagem implements AtualizavelPorTurno {
  private static readonly XP_PARA_SUBIR = 100
  private static readonly XP_POR_ATAQUE = 10
  private static readonly VIDA_POR_NIVEL = 20

  private vida: number
  private nivel = 1
  private experiencia = 0

  private readonly inventario: Inventario 
  private efeitos: Efeito[] = []

  constructor(
    public readonly nome: string,
    private vidaMaxima: number,
    private arma: Arma 
  ) {
    this.vida = vidaMaxima
    this.inventario = new Inventario()
  }

  //Ações

  equipar(arma: Arma): void {
    this.arma = arma
    console.log(`${this.nome} equipou ${arma.descrever()}.`)
  }

  atacar(inimigo: Personagem): void {
    if (!this.estaVivo()) {
      console.log(`${this.nome} está derrotado e não pode atacar.`)
      return
    }

    console.log(`${this.nome} ataca ${inimigo.nome} com ${this.arma.nome}.`)

    const dano = this.arma.atacar()
    if (dano === 0) {
      console.log('   Ataque falhou.')
      return
    }

    inimigo.receberDano(dano)
    this.ganharExperiencia(Personagem.XP_POR_ATAQUE)
  }

  receberDano(dano: number): void {
    const vidaAntes = this.vida
    this.vida = Math.max(0, this.vida - dano)
    const danoReal = vidaAntes - this.vida

    console.log(`   ${this.nome} recebeu ${danoReal} de dano. ${this.statusVida()}`)

    if (!this.estaVivo()) {
      console.log(`   ${this.nome} foi derrotado!`)
    }
  }

  curar(quantidade: number): void {
    if (!this.estaVivo()) {
      return
    }

    const vidaAntes = this.vida
    this.vida = Math.min(this.vidaMaxima, this.vida + quantidade)

    console.log(
      `   ${this.nome} recuperou ${this.vida - vidaAntes} de vida. ${this.statusVida()}`
    )
  }

  estaVivo(): boolean {
    return this.vida > 0
  }

  ganharExperiencia(quantidade: number): void {
    this.experiencia += quantidade
    console.log(
      `   ${this.nome} ganhou ${quantidade} XP (${this.experiencia}/${Personagem.XP_PARA_SUBIR}).`
    )

    while (this.experiencia >= Personagem.XP_PARA_SUBIR) {
      this.experiencia -= Personagem.XP_PARA_SUBIR
      this.subirDeNivel()
    }
  }

  private subirDeNivel(): void {
    this.nivel++
    this.vidaMaxima += Personagem.VIDA_POR_NIVEL
    this.vida = this.vidaMaxima

    console.log(`   *** ${this.nome} subiu para o nível ${this.nivel}! ${this.statusVida()}`)
  }

  // efeitos

  aplicarEfeito(efeito: Efeito): void {
    efeito.aplicarEm(this)
    this.efeitos.push(efeito)
    console.log(`   ${efeito.nome} aplicado em ${this.nome}.`)
  }

  // inventário

  adicionarItem(item: Item): void {
    this.inventario.adicionar(item)
  }

  removerItem(item: Item): boolean {
    return this.inventario.remover(item)
  }

  mostrarInventario(): void {
    console.log(`${this.nome}:`)
    this.inventario.listar()
  }

  // turno

  novoTurno(): void {
    if (!this.estaVivo()) {
      return
    }

    this.arma.novoTurno() 

    for (const efeito of this.efeitos) {
      efeito.novoTurno()
    }
    this.efeitos = this.efeitos.filter(efeito => efeito.ativo) 
  }

  // leitura (vida e XP ficam encapsulados)

  statusVida(): string {
    return `Vida: ${this.vida}/${this.vidaMaxima}`
  }

  status(): string {
    const efeitos =
      this.efeitos.length > 0 ? ` | efeitos: ${this.efeitos.map(e => e.nome).join(', ')}` : ''
    return (
      `${this.nome} | nível ${this.nivel} | ${this.statusVida()} | ` +
      `XP ${this.experiencia} | ${this.arma.descrever()}${efeitos}`
    )
  }
}

// Efeitos temporários

class Veneno implements Efeito {
  public readonly nome: string
  private readonly duracao: ContadorDeTurnos
  private alvo?: Personagem

  constructor(private readonly danoPorTurno: number, turnos: number, nome = 'Veneno') {
    this.nome = nome
    this.duracao = new ContadorDeTurnos(turnos)
  }

  aplicarEm(alvo: Personagem): void {
    this.alvo = alvo
  }

  get ativo(): boolean {
    return !this.duracao.expirou && this.alvo !== undefined && this.alvo.estaVivo()
  }

  novoTurno(): void {
    if (!this.ativo || !this.alvo) {
      return
    }

    console.log(`   ${this.nome} corrói ${this.alvo.nome} (${this.duracao.turnosRestantes} turno(s) restantes).`)
    this.alvo.receberDano(this.danoPorTurno)
    this.duracao.consumir()
  }
}

class Regeneracao implements Efeito {
  public readonly nome: string
  private readonly duracao: ContadorDeTurnos
  private alvo?: Personagem

  constructor(private readonly curaPorTurno: number, turnos: number, nome = 'Regeneração') {
    this.nome = nome
    this.duracao = new ContadorDeTurnos(turnos)
  }

  aplicarEm(alvo: Personagem): void {
    this.alvo = alvo
  }

  get ativo(): boolean {
    return !this.duracao.expirou && this.alvo !== undefined && this.alvo.estaVivo()
  }

  novoTurno(): void {
    if (!this.ativo || !this.alvo) {
      return
    }

    console.log(`   ${this.nome} age em ${this.alvo.nome} (${this.duracao.turnosRestantes} turno(s) restantes).`)
    this.alvo.curar(this.curaPorTurno)
    this.duracao.consumir()
  }
}

// Jogo

class Jogo {
  private readonly personagens: Personagem[] = []
  private readonly atualizaveis: AtualizavelPorTurno[] = [] // só a abstração
  private turno = 0

  adicionarPersonagem(personagem: Personagem): void {
    this.personagens.push(personagem)
    this.registrar(personagem)
    console.log(`${personagem.nome} entrou na partida.`)
  }

  registrar(objeto: AtualizavelPorTurno): void {
    if (!this.atualizaveis.includes(objeto)) {
      this.atualizaveis.push(objeto)
    }
  }

  remover(objeto: AtualizavelPorTurno): void {
    const indice = this.atualizaveis.indexOf(objeto)
    if (indice !== -1) {
      this.atualizaveis.splice(indice, 1)
    }
  }

  passarTurno(): void {
    this.turno++
    console.log(`\n Turno: ${this.turno} `)

    for (const objeto of [...this.atualizaveis]) {
      objeto.novoTurno()
    }
  }

  get turnoAtual(): number {
    return this.turno
  }

  get participantes(): readonly Personagem[] {
    return [...this.personagens]
  }

  mostrarStatus(): void {
    console.log('--- Status ---')
    for (const personagem of this.personagens) {
      console.log(`   ${personagem.status()}`)
    }
  }
}

// Execução 
function titulo(texto: string): void {
  console.log(`\n>>> ${texto}`)
}

    //  Jogo
const jogo = new Jogo()

    //  Armas — criadas de forma independente 
const espadaEnferrujada = new Espada('Espada Enferrujada', 12, 1)
const excalibur = new Espada('Excalibur', 28, 1)
const arcoLongo = new Arco('Arco Longo', 20, 1, 5, 1)
const varinhaCarvalho = new VarinhaMagica('Varinha de Carvalho', 32, 25, 100, 15, 2)

    // Personagens
const thor = new Personagem('Thor', 150, espadaEnferrujada)
const artemis = new Personagem('Ártemis', 110, arcoLongo)
const merlin = new Personagem('Merlin', 100, varinhaCarvalho)

titulo('Equipando armas depois da criação')
thor.equipar(excalibur)

titulo('Adicionando ao jogo')
jogo.adicionarPersonagem(thor)
jogo.adicionarPersonagem(artemis)
jogo.adicionarPersonagem(merlin)


titulo('Inventário')
const pocao = new Item('Poção de Vida', 50)
thor.adicionarItem(pocao)
thor.adicionarItem(new Item('Escudo de Bronze', 120))
thor.mostrarInventario()
thor.removerItem(pocao)
console.log('   (poção usada)')
thor.mostrarInventario()

titulo('(6, 7) Ataques e cooldown')
thor.atacar(merlin)
thor.atacar(merlin) // mesma arma, mesmo turno -> cooldown
artemis.atacar(merlin)
merlin.atacar(thor)

titulo('(11) Efeitos temporários')
merlin.aplicarEfeito(new Veneno(9, 3))
thor.aplicarEfeito(new Regeneracao(15, 2))

// Passagem de vários turnos: tudo se atualiza sozinho
jogo.passarTurno()
thor.atacar(merlin) // ainda em cooldown

jogo.passarTurno()
artemis.atacar(merlin) // acabaram as flechas
arcoLongo.carregarFlechas(3) // recarga
artemis.atacar(merlin) // agora vai
merlin.atacar(thor)

jogo.passarTurno()
jogo.mostrarStatus()

titulo('(14) Dano e cura')
merlin.curar(40)

titulo('(15) Experiência e subida de nível')
thor.ganharExperiencia(85) // recompensa de missão
thor.atacar(merlin) // +10 XP -> 95... ainda falta
thor.ganharExperiencia(20) // estoura os 100 e sobe de nível

jogo.passarTurno()

titulo('(9) Mana insuficiente e recuperação')
merlin.atacar(thor) // mana abaixo do custo
varinhaCarvalho.recuperarMana(60)
merlin.atacar(thor) // agora vai

jogo.passarTurno()

console.log(`\n fim: (turno ${jogo.turnoAtual})`)
jogo.mostrarStatus()



