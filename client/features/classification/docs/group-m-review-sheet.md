# Regras do Grupo M (M-1 e M-2): folha de revisão

Gerada a partir do código (`lib/rulesets/review-sheet.ts`); não edite à mão. Serve para conferir se cada nota da norma foi lida corretamente e para levar as perguntas em aberto à Moura.

## Estado

- **Todas as regras são provisórias.** Nenhuma foi aprovada por uma pessoa.
- Fonte: IN 1 parte 2, Anexo B, Tabelas 23 e 24; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º (risco). Em vigor desde 24/04/2024 (IN 1 parte 2, art. 31; IN 3, art. 14; IN 1 parte 1, art. 165).
- Cobertura: o Grupo M nas divisões M-1 (túnel) e M-2, com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".

## Perguntas para a Moura

### Gerais

1. **O que conta como pavimento.** O art. 8º tira da altura os mezaninos, casas de máquinas e alguns subsolos. O código usa o número de pavimentos informado pelo usuário e não faz essas exclusões. Como a Moura quer contar?
2. **Gás combustível (IN 8).** Aparece como exigido em todas as colunas do Grupo C. Vale para qualquer imóvel do grupo, mesmo sem instalação de gás?
3. **Carga de incêndio.** O código aceita a classe (desprezível a altíssima) ou o valor em MJ/m² e deriva a classe pelos limites da IN 3, art. 11. Quem informa esse valor para o cliente? A IN 3 tem uma tabela por atividade (Anexo B) que ainda não está carregada.
4. **Divisão M-1 e M-2.** A divisão vem da conversa e o usuário confirma. As Tabelas 23 e 24 não dependem de área nem de altura: o código não aplica a trava de exatamente 750 m² ou 12 m ao Grupo M.
5. **Faixas do túnel (M-1).** A Tabela 23 imprime "≤ 200 m", "200 ≤ 500 m", "500 ≤ 1.000 m" e "> 1.000 m". O código leu as faixas do meio como acima do limite inferior e até o superior (por exemplo, 200 m fica na primeira). Confirmar.
6. **Tipo de instalação e quantidades (M-2).** A Tabela 24 tem cinco colunas: tanques/cilindros/processos (até ou acima de 20 m³ de líquido ou 10 m³ de gás), plataforma de carregamento e produtos acondicionados (até ou acima de 20 m³ de líquido ou 12.480 kg de gás). O código pergunta um tipo de instalação e as quantidades de líquido e de gás. Se o imóvel tem mais de uma instalação, quem decide qual vale, ou valem todas?
7. **Escopo do Grupo M.** Entra: um bloco e uma só ocupação (ou outras só subsidiárias). Fora disso o resultado é "análise específica". É aceitável?
8. **Risco do Grupo M.** O Quadro 2 do Anexo A da IN 1 parte 1 não traz linha para M-1 e M-2. O código usa as regras gerais de risco I, II e V e deixa o resto no risco IV. Confirmar.
9. **Divisões M-3 a M-11.** Ainda não têm regras: respondem "análise específica".
10. **Líquidos inflamáveis e combustíveis.** A norma fala em inflamável classe I acima de 1.000 L para o risco V e em "líquido inflamável" (interno) e "inflamável/combustível" (externo) para o risco II. O código pergunta um volume só de "inflamáveis ou combustíveis" em área interna e outro em área externa. Basta, ou é preciso separar a classe?
11. **Altura no risco.** O código usa a mesma altura da exigência dos sistemas (art. 8º: térreo vale 0) também para o Quadro 2. Confirmar.
12. **Ocupação subsidiária (IN 1 parte 2, art. 10).** Quando o usuário diz que há mais de uma ocupação, o código pergunta se as outras são só subsidiárias (vinculadas e fundamentais à principal, como garagem, salão de festas ou depósito de apoio), sem reunião de público para mais de 100 pessoas (art. 10, § 4º) e sem depósito acima de 1.000 m² (IN 1 parte 1, art. 4º, IV). Se sim, valem os sistemas da ocupação predominante, com a observação da compartimentação de garagens (§§ 1º a 3º). Se não, é ocupação mista ou secundária e vai para análise específica. Quem responde essa pergunta, e os limites usados estão certos?
13. **Ainda não existe:** a camada de edificações existentes e recentes (IN 5), que rotula cada sistema como vital, indispensável ou adequável. O resultado mostra o enquadramento de risco e os sistemas exigidos.

### Por nota

- Tabela 23, nota 2: A nota exige a detecção em toda a extensão do túnel e, em conjunto, o monitoramento de CO. O código lista a detecção e mostra o monitoramento de CO como observação, sem lista própria. Confirmar.
- Tabela 24, nota 3: Nas células com mais de uma nota ("x 3_4", "x 3_7"), o código exige o sistema se qualquer uma das notas valer. A norma quer uma ou todas? Vale para "3_4" (área ≥ 750 m² ou altura > 12 m) e para "3_7".
- Tabela 24, nota 6: A nota diz "somente para líquidos inflamáveis e combustíveis conforme IN específica". O código exige o sistema quando o volume de líquidos informado é maior que zero e não consulta a IN específica.
- Tabela 24, nota 7: A nota restringe o sistema aos locais com acondicionamento de líquidos e gases. O código não avalia cada local: lista o sistema com esse escopo. Na célula com as notas 3 e 7, o sistema acaba exigido (em parte) mesmo abaixo de 750 m². Confirmar.

## Como o código lê cada nota

### Tabela 23, nota 1

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

### Tabela 23, nota 2

**Texto da norma:** Exige-se em toda a extensão do túnel, em conjunto possuir monitoramento da concentração de monóxido de carbono (CO).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se em toda a extensão do túnel, em conjunto com monitoramento da concentração de monóxido de carbono (CO).

**Perguntas:**

- A nota exige a detecção em toda a extensão do túnel e, em conjunto, o monitoramento de CO. O código lista a detecção e mostra o monitoramento de CO como observação, sem lista própria. Confirmar.

### Tabela 24, nota 1

**Texto da norma:** Dispensado quando, a partir do passeio público, o caminhão conseguir acessar o local mais distante com mangueiras de, no máximo, 60 m.

**Leitura do código:**

- Dispensado quando hose_reach_60m.

### Tabela 24, nota 2

**Texto da norma:** Exige-se brigadistas orgânicos (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos (ver IN 28).

### Tabela 24, nota 3

**Texto da norma:** Para imóveis com área igual ou superior a 750 m².

**Leitura do código:**

- Exigido quando a área é maior ou igual a 750 m².

**Valores-limite:**

- a área é maior ou igual a 750 m²: em exatamente 750 m² → sim; logo acima → sim

**Perguntas:**

- Nas células com mais de uma nota ("x 3_4", "x 3_7"), o código exige o sistema se qualquer uma das notas valer. A norma quer uma ou todas? Vale para "3_4" (área ≥ 750 m² ou altura > 12 m) e para "3_7".

### Tabela 24, nota 4

**Texto da norma:** Para imóveis com altura superior a 12 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior que 12 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior que 12 m: em exatamente 12 m → não; logo acima → sim

### Tabela 24, nota 5

**Texto da norma:** Luminárias de emergência à prova de explosão nas áreas de risco.

**Leitura do código:**

- Informação, sem efeito na exigência: Luminárias de emergência à prova de explosão nas áreas de risco.

### Tabela 24, nota 6

**Texto da norma:** Somente para líquidos inflamáveis e combustíveis conforme IN específica.

**Leitura do código:**

- Exigido quando m2_liquid_m3 é maior que 0.

**Valores-limite:**

- m2_liquid_m3 é maior que 0: em exatamente 0 → não; logo acima → sim

**Perguntas:**

- A nota diz "somente para líquidos inflamáveis e combustíveis conforme IN específica". O código exige o sistema quando o volume de líquidos informado é maior que zero e não consulta a IN específica.

### Tabela 24, nota 7

**Texto da norma:** Somente nos locais em que exista o acondicionamento de líquidos e gases combustíveis e inflamáveis.

**Leitura do código:**

- Exigido quando sempre, limitado a: somente nos locais em que exista o acondicionamento de líquidos e gases combustíveis e inflamáveis.

**Perguntas:**

- A nota restringe o sistema aos locais com acondicionamento de líquidos e gases. O código não avalia cada local: lista o sistema com esse escopo. Na célula com as notas 3 e 7, o sistema acaba exigido (em parte) mesmo abaixo de 750 m². Confirmar.

## Tabelas como estão impressas na norma

### Tabela 23: DIVISÃO M-1

| Sistema | IN | ≤ 200 m | 200 a 500 m | 500 a 1.000 m | > 1.000 m |
| --- | --- | --- | --- | --- | --- |
| Brigada de incêndio | IN 28 | - | x¹ | x¹ | x¹ |
| Controle de fumaça | IN 10 | - | - | - | - |
| Detecção automática de incêndio | IN 12 | - | - | - | x² |
| Extintores | IN 6 | - | x | x | x |
| Hidráulico preventivo | IN 7 | - | - | x | x |
| Instalações elétricas de baixa tensão | IN 19 | - | x | x | x |
| Plano de emergência | IN 31 | - | - | x | x |
| Proteção estrutural (TRRF) | IN 14 | x | x | x | x |
| Saídas de emergência (V) | IN 9 | x | x | x | x |
| Sinalização para abandono de local | IN 13 | x | x | x | x |
| Sistema de comunicação | - | - | - | x | x |
| Circuito de TV (monitoramento) | - | - | - | - | x |

### Tabela 24: DIVISÃO M-2 (INDEPENDENTE DE ÁREA OU ALTURA)

| Sistema | IN | tanques, cilindros e processos, líquidos até 20 m³ ou gases até 10 m³ | tanques, cilindros e processos, líquidos acima de 20 m³ ou gases acima de 10 m³ | plataforma de carregamento/descarregamento | produtos acondicionados, líquidos até 20 m³ ou gases até 12.480 kg | produtos acondicionados, líquidos acima de 20 m³ ou gases acima de 12.480 kg |
| --- | --- | --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x¹ | x | x | x¹ | x |
| Alarme de incêndio | IN 12 | - | x | x | - | x |
| Brigada de incêndio | IN 28 | x² | x | x | x² | x |
| Compartimentação horizontal ou de áreas | IN 14 | x³ | x³ | - | x³ | x³ |
| Compartimentação vertical | IN 14 | x 4 | x 4 | - | x 4 | x 4 |
| Controle de materiais de acabamento | IN 18 | x 3_7 | x 3_7 | - | x 3_7 | x 3_7 |
| Detecção automática de incêndio | IN 12 | - | - | - | - | x |
| Espuma | NBR 12232 | - | x 6 | x 6 | - | x 6 |
| Extintores | IN 6 | x (V) | x (V) | x | x (V) | x (V) |
| Hidráulico preventivo | IN 7 | x 3_4 | x | x 6 | x 3_4 | x |
| Iluminação de emergência | IN 11 | x 3_4 | x 3_4 | - | x 3_4 | x 3_4 |
| Plano de emergência | IN 31 | - | x | - | - | x |
| Proteção estrutural (TRRF) | IN 14 | x 7 | x 7 | x | x 7 | x 7 |
| Resfriamento | NBR 10897 NFPA 15 NFPA 750 | - | x | x 6 | - | x |
| Saídas de emergência | IN 9 | x | x | x | x | x |
| Sinalização para abandono de local | IN 13 | x | x | x | x | x |
