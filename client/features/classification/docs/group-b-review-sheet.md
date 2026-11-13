# Regras do Grupo B: folha de revisão

Gerada a partir do código (`lib/rulesets/review-sheet.ts`); não edite à mão. Serve para conferir se cada nota da norma foi lida corretamente e para levar as perguntas em aberto à Moura.

## Estado

- **Todas as regras são provisórias.** Nenhuma foi aprovada por uma pessoa.
- Fonte: IN 1 parte 2, Anexo B, Tabelas 2 (coluna B) e 4; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco). Em vigor desde 24/04/2024 (IN 1 parte 2, art. 31; IN 3, art. 14; IN 1 parte 1, art. 165).
- Cobertura: o Grupo B (serviço de hospedagem: B-1 e B-2), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".

## Perguntas para a Moura

### Gerais

1. **Exatamente 750 m² ou 12 m.** A Tabela 2 vale para área ≤ 750 m² e altura ≤ 12 m; as tabelas por altura valem para área ≥ 750 m² ou altura ≥ 12 m. Um imóvel com exatamente 750 m² (ou 12 m) cai nas duas. Qual vale? Enquanto isso, o sistema responde "análise específica" e não lista sistemas.
2. **Térreo e H ≤ 6.** A norma diz que edificações térreas têm altura 0 (art. 8º, V). O código usa a coluna "Térreo" só para prédios de um pavimento e "H ≤ 6" para os de mais de um pavimento. Confirmar.
3. **O que conta como pavimento.** O art. 8º tira da altura os mezaninos, casas de máquinas e alguns subsolos. O código usa o número de pavimentos informado pelo usuário e não faz essas exclusões. Como a Moura quer contar?
4. **Gás combustível (IN 8).** Aparece como exigido em todas as colunas do Grupo C. Vale para qualquer imóvel do grupo, mesmo sem instalação de gás?
5. **Carga de incêndio.** O código aceita a classe (desprezível a altíssima) ou o valor em MJ/m² e deriva a classe pelos limites da IN 3, art. 11. Quem informa esse valor para o cliente? A IN 3 tem uma tabela por atividade (Anexo B) que ainda não está carregada.
6. **Divisão B-1 e B-2.** A divisão vem da conversa (o assistente propõe a partir da descrição e o usuário confirma). Quem valida a divisão final?
7. **Escopo do Grupo B.** Só entra: Grupo B, um bloco e uma ocupação. O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Fora disso o resultado é "análise específica". Um hotel costuma ter restaurante, salão de festas e garagem; o código manda isso para análise específica por ser ocupação mista. É aceitável?
8. **Tabela 4 tem cinco colunas de altura.** Térrea, até 6 m, de 6 a 12 m, de 12 a 30 m e acima de 30 m (as outras tabelas dividem em 23 m). O código usa as colunas como estão impressas.
9. **Instalações elétricas vitais no B.** Na coluna B da Tabela 2 a célula das instalações elétricas traz "(V)" (vital) e a nota 2 (área a partir de 200 m²); nas outras colunas ela não é vital. O código lê assim.
10. **Nível de risco (IN 1 parte 1, art. 5º e Anexo A).** O código avalia na ordem V, I, II, III e IV. A carga de incêndio é necessária mesmo para um imóvel pequeno, porque o risco V é "carga acima de 2.280 MJ/m²". Confirmar essa leitura.
11. **Risco I.** Foi reduzido a uma pergunta de sim/não ("a atividade se enquadra numa das dispensas?"). As dispensas têm detalhes (ambulante com tenda de até 50 m², residência de até 200 m² com no máximo 1 empregado…). Quem responde, e basta o sim/não?
12. **Líquidos inflamáveis e combustíveis.** A norma fala em inflamável classe I acima de 1.000 L para o risco V e em "líquido inflamável" (interno) e "inflamável/combustível" (externo) para o risco II. O código pergunta um volume só de "inflamáveis ou combustíveis" em área interna e outro em área externa. Basta, ou é preciso separar a classe?
13. **Altura no risco.** O código usa a mesma altura da exigência dos sistemas (art. 8º: térreo vale 0) também para o Quadro 2. Confirmar.
14. **Risco III do Grupo B.** O Quadro 2 traz duas linhas para B-1 e B-2: até 6 m com até 5.000 m², e de 6 a 12 m com até 4.000 m². O código as aplica às duas divisões. Confirmar.
15. **Ainda não existe:** a camada de edificações existentes e recentes (IN 5), que rotula cada sistema como vital, indispensável ou adequável. O resultado mostra o enquadramento de risco e os sistemas exigidos.

### Por nota

- Tabela 2, nota 2: A nota diz "área igual ou superior a 200m²". Confirmar que é a área total construída do imóvel (art. 7), não a área de um pavimento.
- Tabela 2, nota 5: "Exigido para os quartos" foi lido como a detecção limitada aos quartos, e os detectores autônomos como uma forma aceita de atender, sem mudar a exigência. Confirmar.
- Tabela 2, nota 6: "4 pavimentos ou mais": subsolos entram na contagem? O código conta os pavimentos informados pelo usuário.
- Tabela 4, nota 2: "Somente compartimentação entre as unidades autônomas" foi lido como a exigência limitada a essa compartimentação. Confirmar.
- Tabela 4, nota 4: "controle de fumaça e chuveiros automáticos" foi lido como os dois sistemas juntos. A exceção (fachada, shafts e dutos) vale "em imóveis com altura até 90 m", e o código só mostra a substituição até 90 m. Confirmar.
- Tabela 4, nota 5: Acima de 30 m o controle de fumaça foi lido como exigido nos átrios acima de 6 m e nos corredores de rota de fuga; a partir de 90 m, também nos corredores até a escada, a área de refúgio ou a área externa e nas salas acima de 300 m². Confirmar que o "também" soma os locais.

## Como o código lê cada nota

### Tabela 2, nota 2

**Texto da norma:** Exigido para imóveis com área igual ou superior a 200m².

**Leitura do código:**

- Exigido quando a área é maior ou igual a 200 m².

**Valores-limite:**

- a área é maior ou igual a 200 m²: em exatamente 200 m² → sim; logo acima → sim

**Perguntas:**

- A nota diz "área igual ou superior a 200m²". Confirmar que é a área total construída do imóvel (art. 7), não a área de um pavimento.

### Tabela 2, nota 5

**Texto da norma:** Exigido para os quartos (admitem-se detectores autônomos sem necessidade do sistema de alarme).

**Leitura do código:**

- Exigido quando sempre, limitado a: os quartos (admitem-se detectores autônomos sem necessidade do sistema de alarme).

**Perguntas:**

- "Exigido para os quartos" foi lido como a detecção limitada aos quartos, e os detectores autônomos como uma forma aceita de atender, sem mudar a exigência. Confirmar.

### Tabela 2, nota 6

**Texto da norma:** SHP é exigido para edificações com 4 pavimentos ou mais. Aceita-se reservatório com volume a partir de 2.000 litros.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior ou igual a 4.
- Informação, sem efeito na exigência: Aceita-se reservatório com volume a partir de 2.000 litros.

**Valores-limite:**

- o número de pavimentos é maior ou igual a 4: em exatamente 4 → sim; logo acima → sim

**Perguntas:**

- "4 pavimentos ou mais": subsolos entram na contagem? O código conta os pavimentos informados pelo usuário.

### Tabela 4, nota 1

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa, observar IN 28.

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com a população fixa, observar IN 28.

### Tabela 4, nota 2

**Texto da norma:** Somente compartimentação entre as unidades autônomas.

**Leitura do código:**

- Exigido quando sempre, limitado a: somente a compartimentação entre as unidades autônomas.

**Perguntas:**

- "Somente compartimentação entre as unidades autônomas" foi lido como a exigência limitada a essa compartimentação. Confirmar.

### Tabela 4, nota 3

**Texto da norma:** Pode ser substituída por chuveiros automáticos.

**Leitura do código:**

- Pode ser substituído por Chuveiros automáticos (apenas informação, o sistema continua exigido).

### Tabela 4, nota 4

**Texto da norma:** Pode ser substituído por controle de fumaça e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos em imóveis com altura até 90 m.

**Leitura do código:**

- Pode ser substituído por Controle de fumaça + Chuveiros automáticos quando o prédio é térreo (um pavimento, altura 0, art. 8º V) ou a altura é menor ou igual a 90 m (apenas informação, o sistema continua exigido).

**Valores-limite:**

- a altura é menor ou igual a 90 m: em exatamente 90 m → sim; logo abaixo → sim

**Perguntas:**

- "controle de fumaça e chuveiros automáticos" foi lido como os dois sistemas juntos. A exceção (fachada, shafts e dutos) vale "em imóveis com altura até 90 m", e o código só mostra a substituição até 90 m. Confirmar.

### Tabela 4, nota 5

**Texto da norma:** Para imóveis com altura superior a 30m, exigido apenas nos Átrios com altura superior a 6 m e corredores comunicantes utilizados como rota de fuga. Em imóveis com altura igual ou superior a 90 m, exigido também nos corredores de circulação até a escada de segurança, área de refúgio ou área externa e em sala ou compartimentos maiores que 300 m².

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior que 30 m, limitado a: átrios com altura superior a 6 m e corredores comunicantes utilizados como rota de fuga.
- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 90 m, limitado a: também os corredores de circulação até a escada de segurança, a área de refúgio ou a área externa, e salas ou compartimentos maiores que 300 m².

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior que 30 m: em exatamente 30 m → não; logo acima → sim
- a altura é maior ou igual a 90 m: em exatamente 90 m → sim; logo acima → sim

**Perguntas:**

- Acima de 30 m o controle de fumaça foi lido como exigido nos átrios acima de 6 m e nos corredores de rota de fuga; a partir de 90 m, também nos corredores até a escada, a área de refúgio ou a área externa e nas salas acima de 300 m². Confirmar que o "também" soma os locais.

### Tabela 4, nota 6

**Texto da norma:** Exigido em todos os ambientes (exceto banheiros e locais com carga de incêndio desprezível).

**Leitura do código:**

- Exigido quando sempre, limitado a: todos os ambientes (exceto banheiros e locais com carga de incêndio desprezível).

### Tabela 4, nota 7

**Texto da norma:** Exigido para imóveis com altura igual ou superior a 60 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 60 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 60 m: em exatamente 60 m → sim; logo acima → sim

## Tabelas como estão impressas na norma

### Tabela 2: IMÓVEIS COM ÁREA ≤ 750 m² E ALTURA ≤ 12 m

| Sistema | IN | B |
| --- | --- | --- |
| Brigada de incêndio | IN 28 | x |
| Controle de fumaça | IN 10 | - |
| Controle de materiais de acabamento | IN 18 | - |
| Detecção automática de incêndio | IN 12 | x⁵ |
| Extintores | IN 6 | x (V) |
| Gás combustível | IN 8 | x |
| Hidráulico preventivo | IN 7 | x⁶ |
| Iluminação de emergência | IN 11 | x (V) |
| Instalações elétricas de baixa tensão | IN 19 | x² (V) |
| Plano de emergência | IN 31 | - |
| Proteção estrutural (TRRF) | IN 14 | - |
| Saídas de emergência | IN 9 | x |
| Sinalização para abandono de local | IN 13 | x (V) |

### Tabela 4: GRUPO B COM ÁREA ≥ 750 m² OU ALTURA ≥ 12 m

| Sistema | IN | Térreo | H ≤ 6 | 6 < H ≤ 12 | 12 < H ≤ 30 | > 30 |
| --- | --- | --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x | x | x | x | x |
| Alarme de incêndio | IN 12 | x | x | x | x | x |
| Brigada de incêndio | IN 28 | x¹ | x¹ | x¹ | x¹ | x¹ |
| Chuveiros automáticos | IN 15 | - | - | - | - | x |
| Compartimentação horizontal ou de áreas | IN 14 | - | x² | x³ | x³ | x |
| Compartimentação vertical | IN 14 | - | - | - | x⁴ | x⁴ |
| Controle de fumaça | IN 10 | - | - | - | - | x⁵ |
| Controle de materiais de acabamento | IN 18 | x | x | x | x | x |
| Detecção automática de incêndio | IN 12 | x⁶ | x⁶ | x⁶ | x⁶ | x⁶ |
| Elevador de emergência | IN 9 | - | - | - | - | x⁷ |
| Extintores (V) | IN 6 | x | x | x | x | x |
| Gás combustível | IN 8 | x | x | x | x | x |
| Hidráulico preventivo | IN 7 | x | x | x | x | x |
| Iluminação de emergência (V) | IN 11 | x | x | x | x | x |
| Instalações elétricas de baixa tensão (V) | IN 19 | x | x | x | x | x |
| Plano de emergência | IN 31 | - | - | - | x | x |
| Proteção estrutural (TRRF) | IN 14 | x | x | x | x | x |
| Saídas de emergência | IN 9 | x | x | x | x | x |
| Sinalização para abandono de local (V) | IN 13 | x | x | x | x | x |
