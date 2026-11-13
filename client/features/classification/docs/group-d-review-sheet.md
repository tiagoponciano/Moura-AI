# Regras do Grupo D: folha de revisão

Gerada a partir do código (`lib/rulesets/review-sheet.ts`); não edite à mão. Serve para conferir se cada nota da norma foi lida corretamente e para levar as perguntas em aberto à Moura.

## Estado

- **Todas as regras são provisórias.** Nenhuma foi aprovada por uma pessoa.
- Fonte: IN 1 parte 2, Anexo B, Tabelas 2 (coluna A-2, A-3, D, E e G) e 6; IN 3, arts. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco). Em vigor desde 24/04/2024 (IN 1 parte 2, art. 31; IN 3, art. 14; IN 1 parte 1, art. 165).
- Cobertura: o Grupo D (serviços profissionais: D-1 a D-4), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com o Grupo C. As divisões sem regras carregadas respondem "análise específica".

## Perguntas para a Moura

### Gerais

1. **Exatamente 750 m² ou 12 m.** A Tabela 2 vale para área ≤ 750 m² e altura ≤ 12 m; as tabelas por altura valem para área ≥ 750 m² ou altura ≥ 12 m. Um imóvel com exatamente 750 m² (ou 12 m) cai nas duas. Qual vale? Enquanto isso, o sistema responde "análise específica" e não lista sistemas.
2. **Térreo e H ≤ 6.** A norma diz que edificações térreas têm altura 0 (art. 8º, V). O código usa a coluna "Térreo" só para prédios de um pavimento e "H ≤ 6" para os de mais de um pavimento. Confirmar.
3. **O que conta como pavimento.** O art. 8º tira da altura os mezaninos, casas de máquinas e alguns subsolos. O código usa o número de pavimentos informado pelo usuário e não faz essas exclusões. Como a Moura quer contar?
4. **Gás combustível (IN 8).** Aparece como exigido em todas as colunas do Grupo C. Vale para qualquer imóvel do grupo, mesmo sem instalação de gás?
5. **Carga de incêndio.** O código aceita a classe (desprezível a altíssima) ou o valor em MJ/m² e deriva a classe pelos limites da IN 3, art. 11. Quem informa esse valor para o cliente? A IN 3 tem uma tabela por atividade (Anexo B) que ainda não está carregada.
6. **Divisão D-1 a D-4.** A divisão vem da conversa (o assistente propõe a partir da descrição e o usuário confirma). Quem valida a divisão final?
7. **Escopo do Grupo D.** Só entra: Grupo D, um bloco e uma ocupação. O armazenamento acima de 3,5 m é regra do Grupo C (IN 3, art. 8º) e não é perguntado. Fora disso o resultado é "análise específica". É aceitável?
8. **Coluna compartilhada da Tabela 2.** A coluna "A-2, A-3, D, E e G" vale para o Grupo D, e a nota 1 (isenção de brigadistas) cita só A-1, A-2 e J-1. Confirmar que a brigada é exigida para o D.
9. **Nível de risco (IN 1 parte 1, art. 5º e Anexo A).** O código avalia na ordem V, I, II, III e IV. A carga de incêndio é necessária mesmo para um imóvel pequeno, porque o risco V é "carga acima de 2.280 MJ/m²". Confirmar essa leitura.
10. **Risco I.** Foi reduzido a uma pergunta de sim/não ("a atividade se enquadra numa das dispensas?"). As dispensas têm detalhes (ambulante com tenda de até 50 m², residência de até 200 m² com no máximo 1 empregado…). Quem responde, e basta o sim/não?
11. **Líquidos inflamáveis e combustíveis.** A norma fala em inflamável classe I acima de 1.000 L para o risco V e em "líquido inflamável" (interno) e "inflamável/combustível" (externo) para o risco II. O código pergunta um volume só de "inflamáveis ou combustíveis" em área interna e outro em área externa. Basta, ou é preciso separar a classe?
12. **Altura no risco.** O código usa a mesma altura da exigência dos sistemas (art. 8º: térreo vale 0) também para o Quadro 2. Confirmar.
13. **Risco III do Grupo D.** O Quadro 2 traz uma linha "D, Todas" por faixa de altura (até 6 m, 6 a 12 m, 12 a 21 m). O código aplica as três às divisões D-1 a D-4. Confirmar.
14. **Ainda não existe:** a camada de edificações existentes e recentes (IN 5), que rotula cada sistema como vital, indispensável ou adequável. O resultado mostra o enquadramento de risco e os sistemas exigidos.

### Por nota

- Tabela 2, nota 1: A nota 1 diz que A-1, A-2 e J-1 são isentos de brigadistas. Como o Grupo D não está na lista, a brigada foi lida como exigida. Confirmar.
- Tabela 2, nota 2: A nota diz "área igual ou superior a 200m²". Confirmar que é a área total construída do imóvel (art. 7), não a área de um pavimento.
- Tabela 2, nota 6: "4 pavimentos ou mais": subsolos entram na contagem? O código conta os pavimentos informados pelo usuário.
- Tabela 6, nota 4: "detecção automática e chuveiros automáticos" foi lido como os dois sistemas juntos. Confirmar que não basta um deles.
- Tabela 6, nota 6: "detecção automática e chuveiros automáticos" foi lido como os dois sistemas juntos.
- Tabela 6, nota 9: "até 90 m de altura" foi lido como menor ou igual a 90 m. Os três sistemas foram lidos como juntos.
- Tabela 6, nota 10: O "e" foi lido como a união dos dois conjuntos de locais (depósitos acima de 300 MJ/m² e quaisquer locais acima de 1.200 MJ/m²). Confirmar.

## Como o código lê cada nota

### Tabela 2, nota 1

**Texto da norma:** A-1, A-2 e J-1 são isentos de brigadistas (para A-1 e A-2 recomenda-se a realização de capacitação EaD do CBMSC).

**Leitura do código:**

- Informação, sem efeito na exigência: A nota isenta de brigadistas apenas A-1, A-2 e J-1; o Grupo D não está entre eles.

**Perguntas:**

- A nota 1 diz que A-1, A-2 e J-1 são isentos de brigadistas. Como o Grupo D não está na lista, a brigada foi lida como exigida. Confirmar.

### Tabela 2, nota 2

**Texto da norma:** Exigido para imóveis com área igual ou superior a 200m².

**Leitura do código:**

- Exigido quando a área é maior ou igual a 200 m².

**Valores-limite:**

- a área é maior ou igual a 200 m²: em exatamente 200 m² → sim; logo acima → sim

**Perguntas:**

- A nota diz "área igual ou superior a 200m²". Confirmar que é a área total construída do imóvel (art. 7), não a área de um pavimento.

### Tabela 2, nota 6

**Texto da norma:** SHP é exigido para edificações com 4 pavimentos ou mais. Aceita-se reservatório com volume a partir de 2.000 litros.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior ou igual a 4.
- Informação, sem efeito na exigência: Aceita-se reservatório com volume a partir de 2.000 litros.

**Valores-limite:**

- o número de pavimentos é maior ou igual a 4: em exatamente 4 → sim; logo acima → sim

**Perguntas:**

- "4 pavimentos ou mais": subsolos entram na contagem? O código conta os pavimentos informados pelo usuário.

### Tabela 6, nota 1

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com a população fixa (ver IN 28).

### Tabela 6, nota 2

**Texto da norma:** Chuveiros automáticos são exigidos para imóveis que possuam altura igual ou superior à 45 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 45 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 45 m: em exatamente 45 m → sim; logo acima → sim

### Tabela 6, nota 3

**Texto da norma:** Pode ser substituído por chuveiros automáticos.

**Leitura do código:**

- Pode ser substituído por Chuveiros automáticos (apenas informação, o sistema continua exigido).

### Tabela 6, nota 4

**Texto da norma:** Pode ser substituído por detecção automática e chuveiros automáticos.

**Leitura do código:**

- Pode ser substituído por Detecção automática de incêndio + Chuveiros automáticos (apenas informação, o sistema continua exigido).

**Perguntas:**

- "detecção automática e chuveiros automáticos" foi lido como os dois sistemas juntos. Confirmar que não basta um deles.

### Tabela 6, nota 5

**Texto da norma:** Pode ser substituída por detecção automática.

**Leitura do código:**

- Pode ser substituído por Detecção automática de incêndio (apenas informação, o sistema continua exigido).

### Tabela 6, nota 6

**Texto da norma:** Pode ser substituída por detecção automática e chuveiros automáticos.

**Leitura do código:**

- Pode ser substituído por Detecção automática de incêndio + Chuveiros automáticos (apenas informação, o sistema continua exigido).

**Perguntas:**

- "detecção automática e chuveiros automáticos" foi lido como os dois sistemas juntos.

### Tabela 6, nota 7

**Texto da norma:** Exigido para imóveis com altura igual ou superior a 90 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 90 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 90 m: em exatamente 90 m → sim; logo acima → sim

### Tabela 6, nota 8

**Texto da norma:** Exigido para imóveis que possuam altura igual ou superior a 60 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 60 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 60 m: em exatamente 60 m → sim; logo acima → sim

### Tabela 6, nota 9

**Texto da norma:** Pode ser substituída por detecção automática, controle de fumaça e chuveiro automático até 90 m de altura, exceto para compartimentação de fachada, shafts e dutos.

**Leitura do código:**

- Pode ser substituído por Detecção automática de incêndio + Controle de fumaça + Chuveiros automáticos quando o prédio é térreo (um pavimento, altura 0, art. 8º V) ou a altura é menor ou igual a 90 m (apenas informação, o sistema continua exigido).

**Valores-limite:**

- a altura é menor ou igual a 90 m: em exatamente 90 m → sim; logo abaixo → sim

**Perguntas:**

- "até 90 m de altura" foi lido como menor ou igual a 90 m. Os três sistemas foram lidos como juntos.

### Tabela 6, nota 10

**Texto da norma:** Nos locais destinados a depósito com carga de incêndio superior a 300 MJ/m² e em todos os locais com carga de incêndio superior a 1.200 MJ/m².

**Leitura do código:**

- Exigido quando sempre, limitado a: locais destinados a depósito com carga de incêndio superior a 300 MJ/m² e em todos os locais com carga de incêndio superior a 1.200 MJ/m².

**Perguntas:**

- O "e" foi lido como a união dos dois conjuntos de locais (depósitos acima de 300 MJ/m² e quaisquer locais acima de 1.200 MJ/m²). Confirmar.

## Tabelas como estão impressas na norma

### Tabela 2: IMÓVEIS COM ÁREA ≤ 750 m² E ALTURA ≤ 12 m

| Sistema | IN | A-2, A-3, D, E e G |
| --- | --- | --- |
| Brigada de incêndio | IN 28 | x¹ |
| Controle de fumaça | IN 10 | - |
| Controle de materiais de acabamento | IN 18 | - |
| Detecção automática de incêndio | IN 12 | - |
| Extintores | IN 6 | x (V) |
| Gás combustível | IN 8 | x |
| Hidráulico preventivo | IN 7 | x⁶ |
| Iluminação de emergência | IN 11 | x (V) |
| Instalações elétricas de baixa tensão | IN 19 | x² |
| Plano de emergência | IN 31 | - |
| Proteção estrutural (TRRF) | IN 14 | - |
| Saídas de emergência | IN 9 | x |
| Sinalização para abandono de local | IN 13 | x (V) |

### Tabela 6: GRUPO D COM ÁREA ≥ 750 m² OU ALTURA ≥ 12 m

| Sistema | IN | Térreo | H ≤ 6 | 6 < H ≤ 12 | 12 < H ≤ 23 | 23 < H ≤ 30 | > 30 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x | x | x | x | x | x |
| Alarme de incêndio | IN 12 | x | x | x | x | x | x |
| Brigada de incêndio | IN 28 | x¹ | x¹ | x¹ | x¹ | x¹ | x¹ |
| Chuveiros automáticos | IN 15 | - | - | - | - | - | x² |
| Compartimentação horizontal ou de áreas | IN 14 | x³ | x³ | x³ | x⁴ | x⁴ | x |
| Compartimentação vertical | IN 14 | - | - | - | x⁵ | x⁶ | x⁹ |
| Controle de fumaça | IN 10 | - | - | - | - | - | x⁷ |
| Controle de materiais de acabamento | IN 18 | x | x | x | x | x | x |
| Detecção automática de incêndio | IN 12 | - | - | - | - | x¹⁰ | x¹⁰ |
| Elevador de emergência | IN 9 | - | - | - | - | - | x⁸ |
| Extintores (V) | IN 6 | x | x | x | x | x | x |
| Gás combustível | IN 8 | x | x | x | x | x | x |
| Hidráulico preventivo | IN 7 | x | x | x | x | x | x |
| Iluminação de emergência (V) | IN 11 | x | x | x | x | x | x |
| Instalações elétricas de baixa tensão | IN 19 | x | x | x | x | x | x |
| Plano de emergência | IN 31 | - | - | - | - | x | x |
| Saídas de emergência | IN 9 | x | x | x | x | x | x |
| Sinalização para abandono de local (V) | IN 13 | x | x | x | x | x | x |
| Proteção estrutural (TRRF) | IN 14 | x | x | x | x | x | x |
