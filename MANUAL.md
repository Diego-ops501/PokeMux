# Manual do PokeMux

Guia curto do que cada coisa faz. Se você só quer resolver um problema pontual, veja o [FAQ](FAQ.md).

## Barra do topo

O PokeMux usa uma barra superior compacta, sem uma barra lateral fixa. Assim, toda a largura da janela fica disponível para as telas do jogo. Os recursos ficam na barra superior e no menu **☰ Opções**:

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
| **☰ Opções** | Tudo o mais: Hunt, Tierlist, Ditto, Alertas, Venda protegida, Eco, atualização e FAQ... |

Atalhos de teclado (só quando o foco está no app, não dentro do jogo): **H** Hunt, **C** Simples, **L** Limpar jogo, **R** Atualizar, **T** Treinadores, **G** Tierlist, **D** Ditto, **O** Opções, **M** menu do jogo, **E** Eco, **A** Alertas.

## 📊 Painel: a barra lateral

Mostra os números da conta que está em foco. Clique no painel de outra conta para trocar.

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
