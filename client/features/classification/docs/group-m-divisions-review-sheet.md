# Regras de M-3 a M-11: folha de revisão

Gerada a partir do código (`lib/rulesets/review-sheet.ts`); não edite à mão. Serve para conferir se cada nota da norma foi lida corretamente e para levar as perguntas em aberto à Moura.

## Estado

- **Todas as regras são provisórias.** Nenhuma foi aprovada por uma pessoa.
- Fonte: IN 1 parte 2, Anexo B, Tabelas 2 (coluna I, J e M3) e 25 a 29; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º (risco). Em vigor desde 24/04/2024 (IN 1 parte 2, art. 31; IN 3, art. 14; IN 1 parte 1, art. 165).
- Cobertura: as divisões M-3, M-4, M-5, M-6, M-7 e M-11, com as regras de nível de risco, travas e carga de incêndio que elas compartilham com os demais grupos cobertos. M-8, M-9, M-10 e a Tabela 30 (subsolos) ainda não têm regras e respondem "análise específica".

## Perguntas para a Moura

### Gerais

1. **Exatamente 750 m² ou 12 m.** A Tabela 2 vale para área ≤ 750 m² e altura ≤ 12 m; as tabelas por altura valem para área ≥ 750 m² ou altura ≥ 12 m. Um imóvel com exatamente 750 m² (ou 12 m) cai nas duas. Qual vale? Enquanto isso, o sistema responde "análise específica" e não lista sistemas.
2. **Térreo e H ≤ 6.** A norma diz que edificações térreas têm altura 0 (art. 8º, V). O código usa a coluna "Térreo" só para prédios de um pavimento e "H ≤ 6" para os de mais de um pavimento. Confirmar.
3. **O que conta como pavimento.** O art. 8º tira da altura os mezaninos, casas de máquinas e alguns subsolos. O código usa o número de pavimentos informado pelo usuário e não faz essas exclusões. Como a Moura quer contar?
4. **Gás combustível (IN 8).** Aparece como exigido em todas as colunas do Grupo C. Vale para qualquer imóvel do grupo, mesmo sem instalação de gás?
5. **Carga de incêndio.** O código aceita a classe (desprezível a altíssima) ou o valor em MJ/m² e deriva a classe pelos limites da IN 3, art. 11. Quem informa esse valor para o cliente? A IN 3 tem uma tabela por atividade (Anexo B) que ainda não está carregada.
6. **Divisões M-3 a M-7 e M-11.** A divisão vem da conversa e o usuário confirma. Só M-3 depende de área e altura (Tabela 2 e Tabela 25); M-4 a M-7 e M-11 não, e o código não aplica a elas a trava de exatamente 750 m² ou 12 m. M-8, M-9 e M-10 não têm tabela e respondem "análise específica".
7. **Faixas que a norma não cobre.** A Tabela 26 só traz M-4 acima de 1.500 m² e a Tabela 28 só traz M-6 com plantio acima de 500 ha. Abaixo disso o código responde "análise específica". Confirmar.
8. **Dados novos.** O código pergunta a área das construções de apoio do silo (M-5), a área de plantio (M-6), se a estufa usa gás combustível (M-11), se há sistema fixo de gases (M-3) e a capacidade total de isotanques (M-7). Quem responde cada um?
9. **Escopo.** Entra: um bloco e uma só ocupação (ou outras só subsidiárias). Fora disso o resultado é "análise específica". É aceitável?
10. **Risco.** O Quadro 2 do Anexo A da IN 1 parte 1 não traz linha para M-3 a M-11. O código usa as regras gerais de risco I, II e V e deixa o resto no risco IV. Confirmar.
11. **Líquidos inflamáveis e combustíveis.** A norma fala em inflamável classe I acima de 1.000 L para o risco V e em "líquido inflamável" (interno) e "inflamável/combustível" (externo) para o risco II. O código pergunta um volume só de "inflamáveis ou combustíveis" em área interna e outro em área externa. Basta, ou é preciso separar a classe?
12. **Altura no risco.** O código usa a mesma altura da exigência dos sistemas (art. 8º: térreo vale 0) também para o Quadro 2. Confirmar.
13. **Ocupação subsidiária (IN 1 parte 2, art. 10).** Quando o usuário diz que há mais de uma ocupação, o código pergunta se as outras são só subsidiárias (vinculadas e fundamentais à principal, como garagem, salão de festas ou depósito de apoio), sem reunião de público para mais de 100 pessoas (art. 10, § 4º) e sem depósito acima de 1.000 m² (IN 1 parte 1, art. 4º, IV). Se sim, valem os sistemas da ocupação predominante, com a observação da compartimentação de garagens (§§ 1º a 3º). Se não, é ocupação mista ou secundária e vai para análise específica. Quem responde essa pergunta, e os limites usados estão certos?
14. **Ainda não existe:** a camada de edificações existentes e recentes (IN 5), que rotula cada sistema como vital, indispensável ou adequável. O resultado mostra o enquadramento de risco e os sistemas exigidos.

### Por nota

- Tabela 2, nota 1: A nota 1 isenta A-1, A-2 e J-1 de brigadistas. Para esta coluna foi lido que a brigada é dispensada para J-1 e exigida para as demais divisões de I e J. Confirmar.
- Tabela 2, nota 2: A nota diz "área igual ou superior a 200m²". Confirmar que é a área total construída do imóvel (art. 7), não a área de um pavimento.
- Tabela 2, nota 6: "4 pavimentos ou mais": subsolos entram na contagem? O código conta os pavimentos informados pelo usuário.
- Tabela 25, nota 4: A nota dispensa o sistema hidráulico só nos locais com equipamentos protegidos por gases. O código não avalia cada local e mantém o sistema exigido, com o texto da nota como observação. Confirmar.
- Tabela 25, nota 6: A nota 6 está na coluna acima de 30 m e fala em altura igual ou superior a 30 m. O código mostra o texto como observação e não cria uma exigência separada de escada pressurizada. Confirmar.
- Tabela 25, nota 7: A nota restringe a detecção a certos locais. O código não avalia cada local: lista o sistema com esse escopo.
- Tabela 26, nota 3: A nota remete à IN 22 (pátio de contêineres), que o código não consulta. O sistema hidráulico fica exigido para M-7.
- Tabela 27, nota 6: A nota 6 não é citada por nenhuma célula do PDF (a linha da IN 13 parece faltar). O código a carrega só como texto.

## Como o código lê cada nota

### Tabela 2, nota 1

**Texto da norma:** A-1, A-2 e J-1 são isentos de brigadistas (para A-1 e A-2 recomenda-se a realização de capacitação EaD do CBMSC).

**Leitura do código:**

- Dispensado quando a divisão é J-1.
- Informação, sem efeito na exigência: A nota isenta de brigadistas A-1, A-2 e J-1.

**Perguntas:**

- A nota 1 isenta A-1, A-2 e J-1 de brigadistas. Para esta coluna foi lido que a brigada é dispensada para J-1 e exigida para as demais divisões de I e J. Confirmar.

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

### Tabela 25, nota 1

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

### Tabela 25, nota 2

**Texto da norma:** Pode ser substituído por sistemas de gases, através da supressão total do ambiente.

**Leitura do código:**

- Pode ser substituído por Sistema de gases, com supressão total do ambiente (apenas informação, o sistema continua exigido).

### Tabela 25, nota 3

**Texto da norma:** Exigido para imóveis que possuam altura igual ou superior a 60 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 60 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 60 m: em exatamente 60 m → sim; logo acima → sim

### Tabela 25, nota 4

**Texto da norma:** É dispensada a instalação nos locais, áreas ou pavimentos em em que existam equipamentos elétro-eletrônicos com sistema de gases para combate a incêndio.

**Leitura do código:**

- Informação, sem efeito na exigência: É dispensada a instalação nos locais, áreas ou pavimentos em que existam equipamentos elétro-eletrônicos com sistema de gases para combate a incêndio.

**Perguntas:**

- A nota dispensa o sistema hidráulico só nos locais com equipamentos protegidos por gases. O código não avalia cada local e mantém o sistema exigido, com o texto da nota como observação. Confirmar.

### Tabela 25, nota 5

**Texto da norma:** Sempre que houver sistema fixo de gases para supressão de incêndio.

**Leitura do código:**

- Exigido quando gas_suppression_system.

### Tabela 25, nota 6

**Texto da norma:** Escada pressurizada para imóveis que possuam altura igual ou superior a 30 m.

**Leitura do código:**

- Informação, sem efeito na exigência: Escada pressurizada para imóveis que possuam altura igual ou superior a 30 m.

**Perguntas:**

- A nota 6 está na coluna acima de 30 m e fala em altura igual ou superior a 30 m. O código mostra o texto como observação e não cria uma exigência separada de escada pressurizada. Confirmar.

### Tabela 25, nota 7

**Texto da norma:** Exigido em: centro de processamento de dados; locais que tenham geradores/banco de baterias/nobreaks; locais onde se mantém equipamentos de comunicação e transmissão de dados sem supervisão de pessoas; salas elétricas.

**Leitura do código:**

- Exigido quando sempre, limitado a: somente em centro de processamento de dados, locais com geradores, banco de baterias ou nobreaks, locais com equipamentos de comunicação e transmissão de dados sem supervisão de pessoas e salas elétricas.

**Perguntas:**

- A nota restringe a detecção a certos locais. O código não avalia cada local: lista o sistema com esse escopo.

### Tabela 26, nota 1

**Texto da norma:** Para ocupações subsidiárias, verificar SMSCI específicos para a ocupação.

**Leitura do código:**

- Informação, sem efeito na exigência: Para ocupações subsidiárias, verificar SMSCI específicos para a ocupação.

### Tabela 26, nota 2

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

### Tabela 26, nota 3

**Texto da norma:** Conforme IN específica (IN 22 sobre pátio de contêineres).

**Leitura do código:**

- Informação, sem efeito na exigência: Conforme IN específica (IN 22 sobre pátio de contêineres).

**Perguntas:**

- A nota remete à IN 22 (pátio de contêineres), que o código não consulta. O sistema hidráulico fica exigido para M-7.

### Tabela 26, nota 4

**Texto da norma:** Para M-4: aceitam-se as próprias saídas da edificação, podendo as escadas ser do tipo NE. Para M-7: aceitam-se os arruamentos entre as quadras de armazenamento conforme IN especifica.

**Leitura do código:**

- Informação, sem efeito na exigência: Para M-4: aceitam-se as próprias saídas da edificação, podendo as escadas ser do tipo NE. Para M-7: aceitam-se os arruamentos entre as quadras de armazenamento conforme IN específica.

### Tabela 26, nota 5

**Texto da norma:** Quando houver armazenamento de tanque portátil (isotanque) com líquidos inflamáveis ou combustíveis com capacidade total acima de 20 m³.

**Leitura do código:**

- Exigido quando isotank_total_m3 é maior que 20.

**Valores-limite:**

- isotank_total_m3 é maior que 20: em exatamente 20 → não; logo acima → sim

### Tabela 27, nota 1

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

### Tabela 27, nota 2

**Texto da norma:** Atenderá os requisitos da IN 6 e da IN 34.

**Leitura do código:**

- Informação, sem efeito na exigência: Atenderá os requisitos da IN 6 e da IN 34.

### Tabela 27, nota 3

**Texto da norma:** Sistema Hidráulico deve ser instalado se as construções de apoio do silo somarem área maior ou igual a 750 m², atendendo, neste caso, os requisitos das IN 7 e 34.

**Leitura do código:**

- Exigido quando silo_support_area_m2 é maior ou igual a 750.
- Informação, sem efeito na exigência: Atenderá os requisitos das IN 7 e 34.

**Valores-limite:**

- silo_support_area_m2 é maior ou igual a 750: em exatamente 750 → sim; logo acima → sim

### Tabela 27, nota 4

**Texto da norma:** Atenderá os requisitos da IN 11 e da IN 34.

**Leitura do código:**

- Informação, sem efeito na exigência: Atenderá os requisitos da IN 11 e da IN 34.

### Tabela 27, nota 5

**Texto da norma:** Atenderá os requisitos da IN 9 e da IN 34.

**Leitura do código:**

- Informação, sem efeito na exigência: Atenderá os requisitos da IN 9 e da IN 34.

### Tabela 27, nota 6

**Texto da norma:** Atenderá os requisitos da IN 13 e da IN 34.

**Leitura do código:**

- Informação, sem efeito na exigência: Atenderá os requisitos da IN 13 e da IN 34.

**Perguntas:**

- A nota 6 não é citada por nenhuma célula do PDF (a linha da IN 13 parece faltar). O código a carrega só como texto.

### Tabela 28, nota 1

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

### Tabela 28, nota 2

**Texto da norma:** O plano de emergência deve contemplar o plano de regulação de material combustível e ações de apoio às operações de combate à incêndios, sendo competência do responsável técnico o seu dimensionamento.

**Leitura do código:**

- Informação, sem efeito na exigência: O plano de emergência deve contemplar o plano de regulação de material combustível e ações de apoio às operações de combate a incêndios, sendo competência do responsável técnico o seu dimensionamento.

### Tabela 29, nota 1

**Texto da norma:** Para estufas que utilizam gás combustível.

**Leitura do código:**

- Exigido quando greenhouse_uses_gas.

### Tabela 29, nota 2

**Texto da norma:** Exigido para áreas maiores que 300 m².

**Leitura do código:**

- Exigido quando a área é maior que 300 m².

**Valores-limite:**

- a área é maior que 300 m²: em exatamente 300 m² → não; logo acima → sim

## Tabelas como estão impressas na norma

### Tabela 2: IMÓVEIS COM ÁREA ≤ 750 m² E ALTURA ≤ 12 m

| Sistema | IN | I, J e M3 |
| --- | --- | --- |
| Brigada de incêndio | IN 28 | x¹ |
| Controle de fumaça | IN 10 | - |
| Controle de materiais de acabamento | IN 18 | - |
| Detecção automática de incêndio | IN 12 | - |
| Extintores | IN 6 | x (V) |
| Gás combustível | IN 8 | x |
| Hidráulico preventivo | IN 7 | x⁶ |
| Iluminação de emergência | IN 11 | x |
| Instalações elétricas de baixa tensão | IN 19 | x² |
| Plano de emergência | IN 31 | - |
| Proteção estrutural (TRRF) | IN 14 | - |
| Saídas de emergência | IN 9 | x |
| Sinalização para abandono de local | IN 13 | x |

### Tabela 25: DIVISÃO M-3 COM ÁREA ≥ 750 m² OU ALTURA ≥ 12,00 m

| Sistema | IN | Térreo | H ≤ 6 | 6 < H ≤ 12 | 12 < H ≤ 23 | 23 < H ≤ 30 | > 30 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x | x | x | x | x | x |
| Alarme de incêndio | IN 12 | x | x | x | x | x | x |
| Brigada de incêndio | IN 28 | x¹ | x¹ | x¹ | x¹ | x¹ | x¹ |
| Chuveiros automáticos | IN 15 | - | - | - | - | x² | x² |
| Compartimentação horizontal ou de áreas | IN 14 | x | x | x | x | x | x |
| Compartimentação vertical | IN 14 | - | - | - | x | x | x |
| Controle de fumaça | IN 10 | - | - | - | - | - | - |
| Controle de materiais de acabamento | IN 18 | x | x | x | x | x | x |
| Detecção automática de incêndio | IN 12 | - | - | x 7 | x 7 | x 7 | x 7 |
| Elevador de emergência | IN 9 | - | - | - | - | - | x 3 |
| Extintores (V) | IN 6 | x | x | x | x | x | x |
| Gás combustível | IN 8 | x | x | x | x | x | x |
| Hidráulico preventivo | IN 7 | x 4 | x 4 | x 4 | x 4 | x 4 | x 4 |
| Iluminação de emergência (V) | IN 11 | x | x | x | x | x | x |
| Instalações elétricas de baixa tensão | IN 19 | x | x | x | x | x | x |
| Plano de emergência | IN 31 | x 5 | x 5 | x 5 | x | x | x |
| Proteção estrutural (TRRF) | IN 14 | x | x | x | x | x | x |
| Saídas de emergência | IN 9 | x | x | x | x | x | x 6 |
| Sinalização para abandono de local (V) | IN 13 | x | x | x | x | x | x |

### Tabela 26: DIVISÕES M-4 e M-7

| Sistema | IN | M-4 (acima de 1.500 m²) | M-7 |
| --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x | x |
| Brigada de incêndio | IN 28 | - | x² |
| Espuma | NBR 12232 | - | x⁵ |
| Extintores | IN 6 | x | x |
| Hidráulico preventivo | IN 7 | - | x³ |
| Plano de emergência | IN 31 | - | x |
| Saídas de emergência | IN 9 | x⁴ | x⁴ |
| Sinalização para abandono de local | IN 13 | x | x |

### Tabela 27: DIVISÃO M-5

| Sistema | IN | Qualquer área |
| --- | --- | --- |
| Brigada de incêndio | IN 28 | x¹ |
| Extintores | IN 6 | x² |
| Hidráulico preventivo | IN 7 | x³ |
| Iluminação de emergência | IN 11 | x 4 |
| Saídas de emergência | IN 9 | x 5 |

### Tabela 28: DIVISÃO M-6

| Sistema | IN | Área de plantio > 500 ha |
| --- | --- | --- |
| Brigada de incêndio | IN 28 | x¹ |
| Plano de emergência | IN 31 | x² |

### Tabela 29: DIVISÃO M-11 INDEPENDENTE DE ÁREA OU ALTURA

| Sistema | IN | < 750 m² | ≥ 750 m² |
| --- | --- | --- | --- |
| Extintores | IN 6 | x | x |
| Gás combustível | IN 8 | x 1 | x 1 |
| Iluminação de emergência | IN 11 | x 2 | x |
| Instalações elétricas de baixa tensão | IN 19 | x | x |
| Saídas de emergência | IN 9 | x | x |
| Sinalização para abandono de local | IN 13 | - | x |
