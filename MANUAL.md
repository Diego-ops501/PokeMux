# Manual do PokeMux

Guia curto do que cada coisa faz. Se você só quer resolver um problema pontual, veja o [FAQ](FAQ.md).

## Barra do topo

O PokeMux usa uma barra superior compacta, sem uma barra lateral fixa. Assim, toda a largura da janela fica disponível para as telas do jogo. Os recursos ficam na barra superior e no menu **☰ Opções**:

A barra combina comandos com texto e alguns ícones no estilo do jogo. Ajude o projeto e Referral ficam juntos à esquerda. À direita ficam os ícones de IV, Mercado e Opções, nessa ordem, com Opções no fim. Menu do jogo e Overlay ficam junto dos outros comandos, com texto e sem ícone. Passe o mouse para ver a descrição; use Tab para navegar e Enter para ativar. O Mercado Global mantém sua arte original.

| Botão | O que faz |
|---|---|
| **▶ Logar equipe** | Loga as 4 contas de uma vez, com as senhas salvas |
| **👤 Treinadores** | Cadastra e-mail e senha de cada conta. O 🗑 limpa o formulário; o 🧹 apaga os dados do jogo daquela conta (resolve conta bugada, a senha continua salva) |
| **⟳ Atualizar tudo** | Recarrega os painéis ligados, ignorando o cache (resolve tela de login velha presa) |
| **📊 Painel** | Abre o resumo da conta, onde fica a engrenagem de configuração e a compra de Pokébolas |
| **🃏 Cartas** | Alterna para o Dashboard de baixo consumo com métricas das quatro contas |
| **📌 Overlay** | Abre o resumo flutuante somente-leitura |
| **IV: ON/OFF** | Ativa ou desativa o cálculo automático de IV ao passar o mouse sobre um Pokémon |
| **🎯 Recomendar hunt** | Recomenda onde upar o Pokémon principal da conta; clique em uma opção para ir até ela |
| **Ícone dourado do Mercado Global** | Abre a consulta de preços, anúncios e Pokémon sem sair da hunt, com seleção de conta, categorias, busca, filtros, paginação e detalhes |
| **☰ Opções** | Tudo o mais: Hunt, Tierlist, Ditto, Alertas, Venda protegida, Eco, atualização e FAQ... |

Atalhos de teclado (só quando o foco está no app, não dentro do jogo): **H** Hunt, **C** Simples, **L** Limpar jogo, **R** Atualizar, **T** Treinadores, **G** Tierlist, **D** Ditto, **O** Opções, **M** menu do jogo, **E** Eco, **A** Alertas.

O ícone do Mercado Global abre uma janela de consulta usando a sessão da conta selecionada. A categoria Pokémon permite escolher uma espécie ou todos os Pokémon, filtrar shiny, IV, nível, qualidade, tipo e raridade, ordenar e navegar pelas páginas. Selecione um anúncio para ver seus detalhes. Estão disponíveis Comprar, Comparar com o mercado, Alertas, Meus Anúncios, Solicitações e Histórico da conta. A aba Solicitações inclui uma prévia; compras e negociações continuam sendo feitas pelo mercado do jogo. **⟳** atualiza os dados e **Esc** fecha a janela.

Em **Comparar com o mercado**, busque e selecione um item, Poké Ball, Diamonds ou Pokémon da conta. Itens são comparados pelo identificador e tipo; Pokémon pela espécie/forma, condição shiny e margens ajustáveis de IV, nível e qualidade (padrão: ±10 IV, ±10 níveis e ±0,10 qualidade). **Ampliar para toda a espécie** remove essas três margens e mantém espécie/forma e shiny. O resumo separa dollars e diamonds, com menor preço e mediana dos anúncios consultados e maior solicitação de compra disponível. A mediana é por oferta/grupo, sem ponderar quantidade; anúncios somente por proposta não entram nos preços. Pokémon são consultados em páginas: **Carregar mais anúncios** aumenta a amostra e recalcula o resumo. A quantidade consultada fica visível. Solicitações representam intenções de compra, sem histórico global de vendas concluídas. **⟳** também atualiza o inventário da conta.

Na busca normal de **Pokémon**, escolha uma espécie e marque **Incluir evoluções** nos filtros de IV, nível e qualidade para reunir toda a cadeia cadastrada no catálogo do jogo, incluindo evoluções anteriores. Por exemplo, Venusaur inclui Bulbasaur e Ivysaur; Alakazam inclui Abra e Kadabra. Os filtros, a ordenação e a paginação são mantidos. A cadeia aparece acima dos anúncios. A caixa não aparece na seleção geral de espécies. Formas diferentes não são agrupadas pelo nome.

O cabeçalho mostra três cards com os menores preços unitários dos anúncios ativos: Diamante em dollars, Strange Pheromone e Boss Token (Bronze Boss Token) em dollars e diamonds. Anúncios somente por proposta e sem quantidade disponível não entram no cálculo. Os cards usam o mercado da conta selecionada, independentemente dos filtros e da aba aberta; **⟳** atualiza os preços. Quando não há uma oferta na moeda, aparece “Sem anúncio”.

A seleção na comparação usa a moldura e as categorias da bag do jogo: Todos, Pokémon, Poké Balls e Itens (incluindo Diamonds). Clique no slot para consultar o bem. As células mostram quantidade ou nível, shiny e equipe; o nome e as condições aparecem ao passar o mouse e no painel do selecionado. A busca filtra a grade e inventários maiores têm páginas de 60 bens.

Os anúncios mostram há quanto tempo foram publicados, quando o jogo fornece a data. Nos detalhes aparece também a data completa. Em ofertas agrupadas de vários vendedores, essa data pertence à oferta representada pelo grupo; não representa todos os anúncios individuais. O tempo exibido é atualizado a cada minuto enquanto a janela está aberta.

Com o Mercado Global aberto, os dados são atualizados automaticamente a cada 60 segundos em segundo plano. A busca, os filtros, a ordenação, a página, a seleção e a rolagem são preservados, assim como campos de alertas ainda não salvos. A consulta não substitui os resultados por uma tela de carregamento. Ao fechar a janela, essa atualização para; os alertas salvos continuam com seu próprio monitor. Em falhas, os dados anteriores permanecem visíveis. Se o servidor limitar as consultas, a atualização automática aguarda cinco minutos. **⟳** continua disponível para atualizar manualmente.

## Alertas do Mercado Global

As [telas de demonstração no README](README.md#mercado-global-comparação-e-alertas) mostram a busca com filtros, a comparação pela bag e o formulário de alertas com dados fictícios.

A aba **Alertas** permite salvar até 10 regras, vinculadas ao personagem e à conta selecionados. Escolha um item/Poké Ball/Diamonds ou uma espécie/forma de Pokémon, moeda e preço máximo unitário. Pokémon também permitem filtrar comum/shiny, IV, nível e qualidade. Digite em **O que monitorar?** para ver as sugestões do catálogo com suas imagens; selecione pelo mouse ou pelas setas e Enter. Notificação no PC e voz podem ser escolhidas por regra e respeitam os controles gerais de alertas e voz do PokeMux.

Para Pokémon, a caixa **Incluir evoluções** acrescenta evoluções e pré-evoluções à regra e mostra quais espécies serão monitoradas. Todas precisam atender aos mesmos filtros de preço, moeda, shiny, IV, nível e qualidade. A caixa começa desmarcada; alertas existentes mantêm a espécie original.

O monitor consulta o mercado a cada 60 segundos enquanto o aplicativo estiver aberto, inclusive com a janela do mercado fechada ou o app minimizado. A primeira consulta após criar, ativar ou reabrir o app estabelece uma referência e não avisa anúncios já existentes. Ofertas repetidas não geram novos avisos. **Pausar**, **Ativar**, **Remover** e **Verificar agora** controlam as regras; a lista informa a última consulta, oferta detectada ou problema de conexão. Se o personagem da conta mudou, a regra antiga não é aplicada ao novo personagem.

O jogo não envia um evento público de novo anúncio: a detecção depende das consultas. Para Pokémon são consultadas até 60 ofertas recentes por espécie nas faixas configuradas, incluindo as evoluções quando marcadas. Ofertas que surgem e desaparecem entre consultas ou ficam fora dessa janela podem não ser detectadas. Se o jogo limitar as consultas, o monitor aguarda cinco minutos antes de tentar novamente. As regras são salvas localmente; a referência dos anúncios é refeita ao reiniciar o app.

## 📊 Painel: a barra lateral

Com o Resumo aberto, ampliar uma tela seleciona automaticamente o treinador daquela conta. Você também pode escolher um treinador específico ou o total Σ pelas abas do Resumo. A seleção manual permanece até você ampliar outra tela.

Na **engrenagem ⚙** do topo dela você escolhe **quais seções aparecem** e arrasta pra reordenar. Duas seções precisam de um passo antes de mostrar algo:

**📌 Itens fixados.** Serve para acompanhar a quantidade de um item específico em todas as contas ao mesmo tempo. Na engrenagem, procure o item (ou a pokébola) pelo nome e clique. Ele passa a aparecer na seção com o total de cada conta. Útil pra bola, revive, pena, o que você estiver juntando.

**🎯 Alvo shiny.** Serve para acompanhar a caçada de um shiny específico. Na engrenagem, em "Alvo shiny", busque a espécie. A seção passa a mostrar se ele **já apareceu**, se foi **capturado** e **quantas bolas** você gastou nele. Sem escolher a espécie, a seção fica vazia explicando isso (antes ela sumia, e parecia que a opção não funcionava).

## 🍃 Simples: o painel de todas as contas

O jogo some e ficam só os números das 4 contas. Serve pra deixar farmando gastando pouco do PC. Seções principais:

- **Hoje**: gold, XP, kills e capturas do dia, com meta e o botão que exporta as planilhas
- **Hunts**: o ranking. Ordene por **Sugerido** e escolha o atacante em **"caçar com"**. Golpe de TM só entra na conta se aquele pokémon aprendeu o disco. Com Ditto no time, aparece a melhor transformação por elemento, respeitando o que cada Ditto pode copiar (o Shiny só vira espécie com forma shiny) e sem TM, que Ditto não aprende
- **Capturas / Shinies**: histórico com filtros por conta, IV, qualidade e período
- **Inventário**: soma a mochila **e o depósito** das 4 contas
- **Tendência**: gráficos de gold/h e XP/h, e de gold/dia dos últimos 30 dias

## 🏆 Tierlist (Opções, ou tecla G)

Ranking de todas as espécies do jogo por elemento, nota de 0 a 100.

Escolha **seu nível** no topo da tierlist (vai até 3000): só entram as hunts que você alcança e só as espécies que dá pra ter nesse nível, caçando ou evoluindo. Cada pokémon é avaliado no nível de cada hunt, pra comparação entre espécies ser justa. A caixinha **com TM** inclui os golpes de TM (poder 600, Dragão 300); fica desligada por padrão porque TM é item. O golpe **físico** enfrenta a defesa física de cada hunt, o **especial** a defesa especial, e a **vida** do defensor segura o ritmo. A aba **Geral** compara todos os elementos juntos, e nela a nota é o rendimento somado em todas as hunts (quem rende em todo lugar vale mais que quem só brilha numa fraqueza ×4).

Na linha: **FÍS/ESP** é a categoria do golpe, **folga ×N** é quanto dano sobra além do necessário pra matar de um golpe, e **ORRE | OUT** são as melhores hunts em cada região, cada uma com sua nota.

Como a nota é calculada: o dano do melhor golpe segue as regras do próprio jogo (efetividade amplificada na hunt: ×2 vira ×2.5, ×4 vira ×5.5, resistências dividem por 1.5; STAB ×1.5 no golpe do tipo do pokémon; golpe físico contra a Defesa e especial contra a Defesa Especial do selvagem), e a vida do selvagem diz quantos golpes o kill leva. Matar de um golpe no limite não vale o mesmo que matar com folga: a nota usa a chance de matar de um golpe, então dois pokémon que "matam de um" não empatam mais em 100. A nota final é XP por golpe (kills esperados × XP da hunt), com 100 pro melhor da lista. Hunts de **NIGHTMARE** (nível 2000 a 3000) levam esse rótulo na lista de hunts do Simples. Na tierlist elas só ganham linha quando são a de maior XP da espécie, o que hoje não acontece: o jogo paga menos XP nelas do que em Orre.

## ✨ Ditto (Opções, logo abaixo da Tierlist)

Onde caçar com um Ditto e em que pokémon virar. Escolha **Shiny** ou **Comum**, o **nível do Ditto** e o **nível da conta** (só entram hunts até esse nível; 0 mostra todas). **Meu Ditto…** preenche com um Ditto que esteja no time de uma conta ligada. Qualidade e IV não se escolhem: no jogo eles são fixos e iguais pra todo Ditto (comum 1.4 e 89, shiny 2.0 e 119), e o app usa esses.

**Por hunt** é o ranking das hunts, cada uma com a melhor transformação pra ela; **Por tipo** é a melhor forma de cada elemento e onde farmar com ela. A nota vai de 0 a 100 (100 = a melhor hunt da lista), com o golpe, a efetividade e a folga, como na tierlist. As regras são as do jogo: o Ditto não copia lendários, Mega, Nightmare, bosses de Orre nem Outland; o Shiny só vira espécie com forma shiny; nenhum usa TM. Os debuffs também entram na conta: Shiny Ditto -20% de Ataque e Sp. Atk (e -25% de HP e defesas, que não pesam no ranking), comum -25% de Ataque e defesas. A transformação do comum dura 12 h; a do shiny é permanente. Premissa do cálculo: o transformado usa as bases e os golpes da espécie copiada no nível do próprio Ditto.

## Proteções

Quando o jogo informa um **Tipo do Dia** ativo, a recomendação de hunt mostra uma seção separada com a melhor hunt acessível desse tipo para o principal. A borda usa a cor do tipo; a seção informa bônus de XP/loot e horário de término. Ambos os tipos do selvagem contam. O bônus vem do evento do jogo, sem multiplicar novamente medições de XP/h. A seção atualiza ao término do evento; use **⟳** para buscar mudanças com o painel aberto.

O botão **🎯 Recomendar hunt** no topo permite escolher a conta. O **🎯** no cabeçalho de cada painel abre diretamente aquela conta. A recomendação usa o Pokémon marcado como principal no jogo, seu nível, qualidade, IV, golpes aprendidos e vantagens de tipo. Considera ataque físico/especial, HP e defesas de ambos os lados e prioriza rendimento com resistência aceitável. Atributos observados são usados quando disponíveis; os demais são estimados. Medições de XP/h pertencentes ao mesmo Pokémon ajudam a calibrar as sugestões.

A janela apresenta a melhor opção e até quatro alternativas, com golpe, efetividade, golpes estimados por abate e risco. **Ir para esta hunt** envia uma única solicitação naquela conta e aguarda confirmação do jogo. Troca de personagem ou líder invalida a sugestão; conta desconectada, Pokémon sem HP e hunt acima do nível da conta impedem a entrada. Regiões com liberação especial continuam sujeitas às regras do servidor. A recomendação não troca o Pokémon principal nem cria uma rotação automática.

A calculadora de IV mostra a **aptidão natural** da espécie (física, especial ou equilibrada), o **perfil do exemplar** pelos atributos observados e a **sinergia** com os golpes disponíveis. Até 10% de diferença entre Ataque e Ataque Especial é mostrado como equilíbrio; esse limite é uma convenção de apresentação. Golpes de nível superior e TMs sem aprendizado confirmado ficam fora da contagem de sinergia. A comparação não substitui a análise de efetividade contra a hunt. Para Pokémon abaixo do nível 15, o card recomenda subir ao menos até esse nível para uma medição de IV mais precisa.

Depois de **dez minutos sem novos abates** em uma hunt confirmada, o app recarrega o painel. A recuperação continua com novas tentativas a cada **cinco minutos** até confirmar um novo abate, mesmo sem aviso de manutenção. Se a conta voltar para a cidade durante a recuperação, o app tenta enviá-la à hunt anterior. Contas ligadas com credenciais salvas também tentam novamente quando ficam presas no login. CAPTCHA pendente, 2FA e campos em edição pausam as recargas e continuam manuais. Uma conta parada voluntariamente na cidade, sem recuperação pendente, não é enviada para uma hunt.

- **🛡 Venda protegida**: pede confirmação antes de vender shiny, qualidade Lendária ou acima e itens raros. Na engrenagem do Painel dá pra travar seus próprios itens (**🔒 Cadeado de venda**)
- **🔔 Alertas**: avisa quando um shiny é capturado, um Pokémon com IV 160+ ou raridade Lendária é capturado, cai **Strange Pheromones** ou **Boss Token**, uma conta cai, para de farmar, fica sem suprimento ou tem pokémon derrubado. Na engrenagem do Simples você escolhe quais tipos avisam no Windows, um por um. Com webhook do Discord configurado, os avisos de problema também chegam no celular
- **🗣️ Voz dos alertas**: usa uma voz instalada no Windows e fala a conta envolvida. Anuncia somente a captura bem-sucedida de shiny, **Strange Pheromones**, **Boss Token**, Pokébolas/curas acabando e capturas com IV 160+ ou exatamente da faixa Lendária. Esses avisos informam o IV e a raridade do Pokémon, sem duplicar uma captura que atende aos dois critérios. A aparição e a falha de captura de shiny não disparam voz nem notificação do Windows. Mítica, Anciã e Divina não são chamadas de Lendária
- **📷 Print de shiny**: quando ligado, salva localmente uma imagem do painel em que o shiny apareceu
- **💾 Exportar/Importar config**: leva suas configurações e seu histórico pra outro PC. Credenciais e webhook ficam de fora, de propósito. Importar troca o histórico pelo do arquivo e guarda uma cópia do seu antes. O app também salva um backup semanal na pasta de dados do PokeMux
- **⬆ Atualização**: consulta o canal oficial uma vez por dia. Exibe versão, changelog e tamanho antes de perguntar se pode baixar; a instalação também exige confirmação

## Coisas que confundem no começo

- **IV automático**: deixe o botão **IV: ON** e passe o mouse sobre um Pokémon no jogo. O resultado aparece em uma caixa junto ao cursor e desaparece ao sair do Pokémon. A caixa mostra IV total, IV por atributo, qualidade, poder e aptidão, sem precisar clicar ou editar campos. **IV: OFF** desativa a exibição e a preferência fica salva. O helper embutido só entra depois do login e nunca roda na tela que contém senha, CAPTCHA ou 2FA
- **A opção marcada não mudou nada?** Provavelmente é uma seção que precisa de configuração (Fixados e Alvo shiny). Elas agora dizem isso na tela
- **Não consigo trocar a pokébola**: confira se o **🧼 Limpar jogo** está verde. Essa opção vem desligada por padrão; quando ativada, esconde o Auto-Helper até você passar o mouse no canto
- **O ouro da sessão**: desde a 1.5.16 vem do próprio servidor do jogo, então é o mesmo número do Hunt Analyzer
- **Conta travada quando saio do PC**: corrigido na 1.5.16; atualize
