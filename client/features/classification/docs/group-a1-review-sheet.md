# Regras do A-1: folha de revisão

Gerada a partir do código (`lib/rulesets/review-sheet.ts`); não edite à mão. Serve para conferir se cada nota da norma foi lida corretamente e para levar as perguntas em aberto à Moura.

## Estado

- **Todas as regras são provisórias.** Nenhuma foi aprovada por uma pessoa.
- Fonte: IN 1 parte 2, Anexo B, Tabela 3 (grade do A-1); IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco). Em vigor desde 24/04/2024 (IN 1 parte 2, art. 31; IN 3, art. 14; IN 1 parte 1, art. 165).
- Cobertura: a divisão A-1 (casas e condomínios horizontais), com as regras de nível de risco e carga de incêndio que ela compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".

## Perguntas para a Moura

### Gerais

1. **O que conta como pavimento.** O art. 8º tira da altura os mezaninos, casas de máquinas e alguns subsolos. O código usa o número de pavimentos informado pelo usuário e não faz essas exclusões. Como a Moura quer contar?
2. **Gás combustível (IN 8).** Aparece como exigido em todas as colunas do Grupo C. Vale para qualquer imóvel do grupo, mesmo sem instalação de gás?
3. **Carga de incêndio.** O código aceita a classe (desprezível a altíssima) ou o valor em MJ/m² e deriva a classe pelos limites da IN 3, art. 11. Quem informa esse valor para o cliente? A IN 3 tem uma tabela por atividade (Anexo B) que ainda não está carregada.
4. **Divisão A-1.** A divisão vem da conversa e o usuário confirma. A grade do A-1 não depende de área nem de altura: o código não aplica a ela a trava de exatamente 750 m² ou 12 m, nem as de vários blocos e de uso misto (um condomínio horizontal tem vários blocos, e a coluna da unifamiliar mista já trata a edificação mista).
5. **Tipo de construção.** O código pergunta se a habitação é geminada/conjugada, isolada ou unifamiliar em edificação mista, e escolhe a coluna da Tabela 3. Quem responde?
6. **Unifamiliar mista.** A coluna vale para H < 6 m. Com 6 m ou mais, a nota 13 remete à Tabela 2 ou 3 (como A-2) ou à ocupação predominante, a mais rigorosa: o código responde "análise específica".
7. **Dados novos.** O código pergunta se há abrigo compartilhado ou central de GLP (nota 12) e quantos lotes o condomínio prevê (nota 18: mais de 350 lotes). Quem responde?
8. **Risco III do A-1.** O Quadro 2 traz A-1 e A-2 juntos (até 21 m e 5.000 m²). O código aplica a linha às duas divisões. Confirmar.
9. **Líquidos inflamáveis e combustíveis.** A norma fala em inflamável classe I acima de 1.000 L para o risco V e em "líquido inflamável" (interno) e "inflamável/combustível" (externo) para o risco II. O código pergunta um volume só de "inflamáveis ou combustíveis" em área interna e outro em área externa. Basta, ou é preciso separar a classe?
10. **Altura no risco.** O código usa a mesma altura da exigência dos sistemas (art. 8º: térreo vale 0) também para o Quadro 2. Confirmar.
11. **Ocupação subsidiária (IN 1 parte 2, art. 10).** Quando o usuário diz que há mais de uma ocupação, o código pergunta se as outras são só subsidiárias (vinculadas e fundamentais à principal, como garagem, salão de festas ou depósito de apoio), sem reunião de público para mais de 100 pessoas (art. 10, § 4º) e sem depósito acima de 1.000 m² (IN 1 parte 1, art. 4º, IV). Se sim, valem os sistemas da ocupação predominante, com a observação da compartimentação de garagens (§§ 1º a 3º). Se não, é ocupação mista ou secundária e vai para análise específica. Quem responde essa pergunta, e os limites usados estão certos?
12. **Ainda não existe:** a camada de edificações existentes e recentes (IN 5), que rotula cada sistema como vital, indispensável ou adequável. O resultado mostra o enquadramento de risco e os sistemas exigidos.

### Por nota

- Tabela 3, nota 13: A nota remete, acima de 6 m, à Tabela 2 ou 3 (como A-2) ou à ocupação predominante, a mais rigorosa. O código não compara as duas: responde "análise específica" para a unidade mista acima de 6 m. Confirmar.
- Tabela 3, nota 14: A proteção estrutural da unifamiliar mista é a da ocupação predominante, que o código não consulta: o sistema fica exigido, com essa observação. Confirmar.
- Tabela 3, nota 18: A nota diz "mais de 350 lotes". O código lê como maior que 350 e usa o número de lotes previstos informado.

## Como o código lê cada nota

### Tabela 3, nota 11

**Texto da norma:** Isolamento é exigido apenas entre as unidades geminadas/conjugadas. Para as não geminadas/conjugadas é dispensado independente do afastamento entre as unidades.

**Leitura do código:**

- Informação, sem efeito na exigência: Isolamento é exigido apenas entre as unidades geminadas/conjugadas. Para as não geminadas/conjugadas é dispensado independente do afastamento entre as unidades.

### Tabela 3, nota 12

**Texto da norma:** Sempre que houver abrigo compartilhado ou central de GLP.

**Leitura do código:**

- Exigido quando shared_gas_shelter.

### Tabela 3, nota 13

**Texto da norma:** Para fins de exigência dos SMSCI, a unidade unifamiliar em edificações mistas, quando situada em altura superior a 6 m, deve atender às exigências da tabela 2 ou 3 (assemelhando-se a A-2) ou da ocupação predominante, a que for mais rigorosa.

**Leitura do código:**

- Informação, sem efeito na exigência: A unidade unifamiliar em edificação mista, situada em altura superior a 6 m, deve atender às exigências da Tabela 2 ou 3 (assemelhando-se a A-2) ou da ocupação predominante, a que for mais rigorosa.

**Perguntas:**

- A nota remete, acima de 6 m, à Tabela 2 ou 3 (como A-2) ou à ocupação predominante, a mais rigorosa. O código não compara as duas: responde "análise específica" para a unidade mista acima de 6 m. Confirmar.

### Tabela 3, nota 14

**Texto da norma:** Igual ao da ocupação predominante.

**Leitura do código:**

- Informação, sem efeito na exigência: Igual ao da ocupação predominante.

**Perguntas:**

- A proteção estrutural da unifamiliar mista é a da ocupação predominante, que o código não consulta: o sistema fica exigido, com essa observação. Confirmar.

### Tabela 3, nota 18

**Texto da norma:** Exigido para condomínios residenciais horizontais (A-1) com previsão de mais de 350 lotes

**Leitura do código:**

- Exigido quando lot_count é maior que 350.

**Valores-limite:**

- lot_count é maior que 350: em exatamente 350 → não; logo acima → sim

**Perguntas:**

- A nota diz "mais de 350 lotes". O código lê como maior que 350 e usa o número de lotes previstos informado.

## Tabelas como estão impressas na norma

### Tabela 3: IMÓVEIS DO GRUPO A

| Sistema | IN | Geminada/conjugada | Isolada | Unifamiliar mista, H < 6 m |
| --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x | x | x |
| Isolamento entre edificações | IN 14 | x¹¹ | - | - |
| Gás combustível | IN 8 | x¹² | x¹² | x |
| Proteção estrutural (TRRF) | IN 14 | x | - | x 14 |
| Hidrantes urbanos | IN 25 | x 18 | x 18 | x 18 |
