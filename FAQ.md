# PokeMux: perguntas frequentes

## Instalação e atualização

### Atualizar apaga minhas configurações?
Não. Os dados ficam no perfil do Windows, fora da pasta do programa. Atualizar ou reinstalar não apaga essa pasta.

### Existe um config.ini?
Não. Use Exportar configuração ou copie a pasta de dados do PokeMux. As senhas não migram para outro PC porque são criptografadas pelo Windows; o restante pode ser restaurado.

### O processo abre mas a janela não aparece
Use o botão de atualização do PokeMux ou baixe a versão mais recente no repositório público de releases.

### Qual navegador o app usa?
Electron (Chromium, o motor do Chrome). Cada conta roda numa sessão separada.

## Uso diário

### Como consulto o Mercado Global sem sair da hunt?
Clique no ícone dourado do mercado no topo e escolha a conta conectada. Use categorias, busca, filtros e detalhes dos anúncios. A janela atualiza automaticamente a cada 60 segundos sem alterar sua pesquisa, filtros, página ou rolagem; **⟳** também permite atualizar manualmente.

### Como vejo o preço de um item ou Pokémon que já tenho?
Abra **Comparar com o mercado**, selecione o bem na bag e consulte os valores em dollars e diamonds. Pokémon permitem ajustar as margens de IV, nível e qualidade ou ampliar para toda a espécie/forma. A mediana representa somente a amostra consultada; **Carregar mais anúncios** amplia essa amostra.

### Há histórico global de vendas concluídas?
Não. São consultados anúncios ativos e solicitações de compra, que não comprovam vendas. **Histórico** mostra apenas o histórico da conta disponibilizado pelo jogo.

### Os alertas funcionam com a janela do mercado fechada?
Sim, enquanto o PokeMux estiver aberto. Na aba **Alertas**, digite e selecione o bem, configure preço/moeda e condições e salve a regra. As consultas ocorrem a cada 60 segundos; a primeira não avisa ofertas antigas. Notificação e voz respeitam os controles gerais do app. Anúncios removidos entre consultas ou fora da janela de até 60 ofertas recentes por espécie podem não ser detectados.

### Incluir evoluções também inclui evoluções anteriores?
Sim. A opção reúne a cadeia cadastrada no jogo: Venusaur inclui Bulbasaur e Ivysaur. Na busca normal, ela fica nos filtros após escolher a espécie; nos alertas, fica no formulário de Pokémon. Os mesmos filtros são aplicados a toda a cadeia.

### Onde vejo a sugestão de hunts?
**Simples → seção Hunts**: ordene por **Sugerido** e escolha o atacante no **"caçar com"**. Com Ditto no time, aparece a melhor transformação por elemento. As estimativas de kills/h e XP/h surgem depois que o app mede algumas hunts suas.

### Tenho um Shiny Ditto: onde caço e em que viro?
**☰ Opções → ✨ Ditto** (logo abaixo da Tierlist). Escolha shiny ou comum, o nível do Ditto e o nível da conta (qualidade e IV são fixos no jogo, o app já usa os certos); **Meu Ditto…** preenche com o Ditto do seu time. **Por hunt** lista as hunts da melhor pra pior, cada uma com a forma certa pra ela; **Por tipo** mostra a melhor forma de cada elemento. Só entram formas que o jogo deixa o Ditto copiar (o shiny só vira espécie com forma shiny), sem TM, e com o debuff do jogo na conta.

### Mudo um filtro e nada acontece / painel demora
Bug corrigido na **1.5.11**: o painel segurava a atualização enquanto o foco ficava no seletor. Fora isso, o Simples atualiza a cada 10s de propósito, pra pesar menos.

### Não consigo mudar a pokébola!
O botão **🧼 Limpar jogo** pode esconder o Auto-Helper do jogo, onde fica o seletor de pokébola. A opção vem **desligada por padrão**, deixando todo o HUD visível. Se você a ativou (botão verde), passe o mouse no canto para revelar o Auto-Helper ou clique novamente no 🧼 para manter o HUD visível.

### Posso instalar userscripts?
Não. O PokeMux não carrega código arbitrário dentro das contas conectadas. Essa decisão protege as credenciais e mantém o conjunto de automações limitado ao que o projeto declara.

### Como exporto os logs de hunt?
**Simples → Hoje → "⬇ Hunts (N)"**. Baixa duas planilhas (hunts e drops) que abrem direto no Excel. O app guarda as últimas 150 hunts; as mais antigas ficam na pasta `backups` dos dados locais do aplicativo (`hunts-historico.csv` e `hunts-historico-drops.csv`).

### O ouro da sessão não bate com o Hunt Analyzer do jogo
A partir da 1.5.16 bate: o app passou a usar os números do próprio servidor do jogo, os mesmos que o Hunt Analyzer mostra. Antes ele refazia a conta por fora e errava em coisas que só o servidor sabe (qual pokébola foi usada em cada arremesso, se o pokémon novo veio de captura ou do mercado, se a poção saiu por uso ou por venda). Se ainda houver diferença, lembre que o relógio do Hunt Analyzer zera ao trocar de hunt e no 🗑 dele, e nenhum dos dois mede o ouro real da carteira: os dois mostram o valor do que caiu, a preço de NPC.

### O app recarregou um painel e a conta ficou parada na cidade
É o jogo: toda vez que a página recarrega, ele coloca a conta em Cerulean. O app recarrega sozinho quando um painel trava ou cai. Em **☰ Opções** existe o **↩ Voltar pra hunt** (experimental, desligado por padrão): ligado, o app manda a conta de volta pra mesma hunt 12 segundos depois do recarregamento (e repete a cada 12 s, até 3 vezes, enquanto não houver kill), desde que ela tenha matado algo nos últimos 10 minutos. A tela do jogo pode continuar mostrando a cidade enquanto a conta farma; os números do Painel e do Simples são os do servidor.

### E o captcha?
O app nunca resolve captcha. É sempre você, na janela da conta. Proposital, não vai mudar.

### Ativei o 2FA no jogo, o app funciona?
Funciona. O app preenche e-mail e senha e para ali. Depois da senha o jogo pede o código do autenticador na janela da conta: você digita, igual ao captcha. O app nunca toca no código.

### Como funciona a proteção de venda?
Com o escudo ligado, o app pede confirmação antes de vender shiny, qualidade Lendária ou acima e itens raros. Desde a 1.5.11 dá pra travar seus próprios itens na engrenagem do painel (**🔒 Cadeado de venda**).

## Projeto

### Como apoio o projeto?
Pelo botão **Ajude o projeto** ao lado do logo, no topo do app, ou direto em [link.mercadopago.com.br/POKEmux](https://link.mercadopago.com.br/POKEmux) (Pix e cartão). Apoio é opcional e não desbloqueia nada; o app é e continua gratuito. **Esse é o único link oficial**: desconfie de qualquer outro.


### Como contribuo?
Faça um fork de [Diego-ops501/PokeMux](https://github.com/Diego-ops501/PokeMux), rode `npm test` e abra um PR neste repositório. Para mudanças no mercado, rode também `npm run test:market-refresh`. Os créditos e a licença da base [PokeGrid](https://github.com/soufoka/PokeGrid-source) devem ser preservados.
