# Regras dos Grupos I e J: folha de revisão

Gerada a partir do código (`lib/rulesets/review-sheet.ts`); não edite à mão. Serve para conferir se cada nota da norma foi lida corretamente e para levar as perguntas em aberto à Moura.

## Estado

- **Todas as regras são provisórias.** Nenhuma foi aprovada por uma pessoa.
- Fonte: IN 1 parte 2, Anexo B, Tabelas 2 (coluna I, J e M3), 18, 19, 20 e 21; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco). Em vigor desde 24/04/2024 (IN 1 parte 2, art. 31; IN 3, art. 14; IN 1 parte 1, art. 165).
- Cobertura: os Grupos I (indústria: I-1 a I-3) e J (depósito: J-1 a J-4), com as regras de nível de risco, travas e carga de incêndio que eles compartilham com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".

## Perguntas para a Moura

### Gerais

1. **Exatamente 750 m² ou 12 m.** A Tabela 2 vale para área ≤ 750 m² e altura ≤ 12 m; as tabelas por altura valem para área ≥ 750 m² ou altura ≥ 12 m. Um imóvel com exatamente 750 m² (ou 12 m) cai nas duas. Qual vale? Enquanto isso, o sistema responde "análise específica" e não lista sistemas.
2. **Térreo e H ≤ 6.** A norma diz que edificações térreas têm altura 0 (art. 8º, V). O código usa a coluna "Térreo" só para prédios de um pavimento e "H ≤ 6" para os de mais de um pavimento. Confirmar.
3. **O que conta como pavimento.** O art. 8º tira da altura os mezaninos, casas de máquinas e alguns subsolos. O código usa o número de pavimentos informado pelo usuário e não faz essas exclusões. Como a Moura quer contar?
4. **Gás combustível (IN 8).** Aparece como exigido em todas as colunas do Grupo C. Vale para qualquer imóvel do grupo, mesmo sem instalação de gás?
5. **Carga de incêndio.** O código aceita a classe (desprezível a altíssima) ou o valor em MJ/m² e deriva a classe pelos limites da IN 3, art. 11. Quem informa esse valor para o cliente? A IN 3 tem uma tabela por atividade (Anexo B) que ainda não está carregada.
6. **Divisão I-1 a I-3 e J-1 a J-4.** A divisão vem da conversa e o usuário confirma. Quem valida a divisão final? A Tabela 18 vale para I-1 e I-2, a 19 para I-3, a 20 para J-1 e J-2 e a 21 para J-3 e J-4; a Tabela 2 tem uma coluna única "I, J e M3", que o código usa só para I e J (M-3 está fora).
7. **Escopo dos grupos I e J.** Entra: um bloco e uma só ocupação (ou outras só subsidiárias). O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Fora disso o resultado é "análise específica". É aceitável?
8. **Área de depósito (J).** As notas 2 da Tabela 20 e 6 da Tabela 21 usam a área de depósito, não a área total. O código acrescenta uma pergunta própria ("Área de depósito, em m²") e aceita "não sei". É assim que a norma quer? E a nota 5 da Tabela 20 ("área maior que 500 m²") foi lida como a área total.
9. **Brigada de J-1.** A nota 1 da Tabela 2 isenta A-1, A-2 e J-1 de brigadistas, e a Tabela 20 isenta J-1. Na coluna única "I, J e M3" o código isenta só J-1 e exige a brigada das demais divisões de I e J. Confirmar.
10. **Células com duas notas.** A Tabela 20 traz "x⁴⁻⁵" (compartimentação vertical). O código leu como as notas 4 e 5, porque assim as nove notas são citadas. Confirmar que não é um intervalo.
11. **Nível de risco (IN 1 parte 1, art. 5º e Anexo A).** O código avalia na ordem V, I, II, III e IV. A carga de incêndio é necessária mesmo para um imóvel pequeno, porque o risco V é "carga acima de 2.280 MJ/m²". Confirmar essa leitura.
12. **Risco I.** Foi reduzido a uma pergunta de sim/não ("a atividade se enquadra numa das dispensas?"). As dispensas têm detalhes (ambulante com tenda de até 50 m², residência de até 200 m² com no máximo 1 empregado…). Quem responde, e basta o sim/não?
13. **Líquidos inflamáveis e combustíveis.** A norma fala em inflamável classe I acima de 1.000 L para o risco V e em "líquido inflamável" (interno) e "inflamável/combustível" (externo) para o risco II. O código pergunta um volume só de "inflamáveis ou combustíveis" em área interna e outro em área externa. Basta, ou é preciso separar a classe?
14. **Altura no risco.** O código usa a mesma altura da exigência dos sistemas (art. 8º: térreo vale 0) também para o Quadro 2. Confirmar.
15. **Risco III dos grupos I e J.** O Quadro 2 traz: I-1 e J-1 (até 21 m e 5.000 m²), I-2 (até 12 m e 5.000 m²), I-3 e J-2 (até 6 m e 4.000 m², ou de 6 a 12 m e 3.000 m²), J-3 (até 6 m e 3.000 m²) e J-4 (até 6 m e 2.500 m²). O código as aplica como estão. Confirmar.
16. **Ocupação subsidiária (IN 1 parte 2, art. 10).** Quando o usuário diz que há mais de uma ocupação, o código pergunta se as outras são só subsidiárias (vinculadas e fundamentais à principal, como garagem, salão de festas ou depósito de apoio), sem reunião de público para mais de 100 pessoas (art. 10, § 4º) e sem depósito acima de 1.000 m² (IN 1 parte 1, art. 4º, IV). Se sim, valem os sistemas da ocupação predominante, com a observação da compartimentação de garagens (§§ 1º a 3º). Se não, é ocupação mista ou secundária e vai para análise específica. Quem responde essa pergunta, e os limites usados estão certos?
17. **Ainda não existe:** a camada de edificações existentes e recentes (IN 5), que rotula cada sistema como vital, indispensável ou adequável. O resultado mostra o enquadramento de risco e os sistemas exigidos.

### Por nota

- Tabela 2, nota 1: A nota 1 isenta A-1, A-2 e J-1 de brigadistas. Para esta coluna foi lido que a brigada é dispensada para J-1 e exigida para as demais divisões de I e J. Confirmar.
- Tabela 2, nota 2: A nota diz "área igual ou superior a 200m²". Confirmar que é a área total construída do imóvel (art. 7), não a área de um pavimento.
- Tabela 2, nota 6: "4 pavimentos ou mais": subsolos entram na contagem? O código conta os pavimentos informados pelo usuário.
- Tabela 18, nota 6: A nota 6 vale para a detecção automática e para o plano de emergência, mas a frase "em todos os locais com carga de incêndio superior a 300 MJ/m²" só faz sentido para a detecção. O código exige as duas para I-2 a partir de 5.000 m² e deixa essa frase como observação, sem limitar o local. Qual é a leitura correta?
- Tabela 19, nota 1: O brigadista particular de I-3 aparece só como observação, não como exigência própria.
- Tabela 19, nota 4: "controle de fumaça, detecção e chuveiros automáticos" foi lido como os três sistemas juntos.
- Tabela 19, nota 5: "Se altura até 12 m, exige-se se área a partir de 5.000 m²" foi lido como área maior ou igual a 5.000 m²; "se altura maior que 12 m, independente da área".
- Tabela 20, nota 1: "J-1 está isento de brigada de incêndio" foi lido como a brigada exigida só para J-2.
- Tabela 20, nota 2: A nota usa a área de depósito, não a área total: J-2 até 30 m com depósito de 750 m² ou mais, e acima de 30 m com depósito de 500 m² ou mais. O código pergunta essa área ao usuário. Confirmar a leitura.
- Tabela 20, nota 4: As células x⁴⁻⁵ foram lidas como as notas 4 e 5 (e não um intervalo), porque assim as nove notas são citadas.
- Tabela 20, nota 5: "Apenas para J-2 com área maior que 500 m²" foi lido como a área total do imóvel, não a de depósito.
- Tabela 21, nota 6: A nota usa a área de depósito, não a área total. O código pergunta essa área ao usuário.

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

### Tabela 18, nota 1

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com a população fixa (ver IN 28).

### Tabela 18, nota 2

**Texto da norma:** Dispensado para I-1. Chuveiros automáticos exigidos somente para I-2.

**Leitura do código:**

- Exigido quando a divisão é I-2.

### Tabela 18, nota 3

**Texto da norma:** Pode ser substituída por chuveiros automáticos.

**Leitura do código:**

- Pode ser substituído por Chuveiros automáticos (apenas informação, o sistema continua exigido).

### Tabela 18, nota 4

**Texto da norma:** Exigido para imóveis que possuam altura igual ou superior a 60 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 60 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 60 m: em exatamente 60 m → sim; logo acima → sim

### Tabela 18, nota 5

**Texto da norma:** Para ocupação I-1 aceita-se reservatório com volume a partir de 2.000 litros.

**Leitura do código:**

- Informação, sem efeito na exigência: Para ocupação I-1 aceita-se reservatório com volume a partir de 2.000 litros.

### Tabela 18, nota 6

**Texto da norma:** Isento para I-1. Para I-2 exigido para imóveis que possuam área igual ou superior à 5.000 m² em todos os locais com carga de incêndio superior a 300 MJ/m².

**Leitura do código:**

- Exigido quando a divisão é I-2 e a área é maior ou igual a 5.000 m².
- Informação, sem efeito na exigência: Para I-2, em todos os locais com carga de incêndio superior a 300 MJ/m² (texto da nota 6).

**Valores-limite:**

- a área é maior ou igual a 5.000 m²: em exatamente 5.000 m² → sim; logo acima → sim

**Perguntas:**

- A nota 6 vale para a detecção automática e para o plano de emergência, mas a frase "em todos os locais com carga de incêndio superior a 300 MJ/m²" só faz sentido para a detecção. O código exige as duas para I-2 a partir de 5.000 m² e deixa essa frase como observação, sem limitar o local. Qual é a leitura correta?

### Tabela 18, nota 7

**Texto da norma:** Exigido somente para I-2. Pode ser substituída por chuveiros automáticos.

**Leitura do código:**

- Exigido quando a divisão é I-2.
- Pode ser substituído por Chuveiros automáticos quando a divisão é I-2 (apenas informação, o sistema continua exigido).

### Tabela 19, nota 1

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com a população fixa. Para I-3, além de brigadista orgânico, exige-se brigadista particular (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com a população fixa. Para I-3, além de brigadista orgânico, exige-se brigadista particular (ver IN 28).

**Perguntas:**

- O brigadista particular de I-3 aparece só como observação, não como exigência própria.

### Tabela 19, nota 2

**Texto da norma:** Chuveiros automáticos exigidos para imóvel com área maior que 10.000 m².

**Leitura do código:**

- Exigido quando a área é maior que 10.000 m².

**Valores-limite:**

- a área é maior que 10.000 m²: em exatamente 10.000 m² → não; logo acima → sim

### Tabela 19, nota 3

**Texto da norma:** Pode ser substituída por chuveiros automáticos.

**Leitura do código:**

- Pode ser substituído por Chuveiros automáticos (apenas informação, o sistema continua exigido).

### Tabela 19, nota 4

**Texto da norma:** Pode ser substituída por controle de fumaça, detecção e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.

**Leitura do código:**

- Pode ser substituído por Controle de fumaça + Detecção automática de incêndio + Chuveiros automáticos (apenas informação, o sistema continua exigido).

**Perguntas:**

- "controle de fumaça, detecção e chuveiros automáticos" foi lido como os três sistemas juntos.

### Tabela 19, nota 5

**Texto da norma:** Exigido em todos os ambientes (exceto banheiros e ambiente com carga de incêndio desprezível). Se altura até 12 m, exige-se se área a partir de 5.000 m². Se altura maior que 12 m, exige-se independente da área total.

**Leitura do código:**

- Exigido quando ((o prédio é térreo (um pavimento, altura 0, art. 8º V) ou a altura é menor ou igual a 12 m) e a área é maior ou igual a 5.000 m²) ou (o número de pavimentos é maior que 1 e a altura é maior que 12 m), limitado a: todos os ambientes (exceto banheiros e ambientes com carga de incêndio desprezível).

**Valores-limite:**

- a altura é menor ou igual a 12 m: em exatamente 12 m → sim; logo abaixo → sim
- a área é maior ou igual a 5.000 m²: em exatamente 5.000 m² → sim; logo acima → sim
- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior que 12 m: em exatamente 12 m → não; logo acima → sim

**Perguntas:**

- "Se altura até 12 m, exige-se se área a partir de 5.000 m²" foi lido como área maior ou igual a 5.000 m²; "se altura maior que 12 m, independente da área".

### Tabela 19, nota 6

**Texto da norma:** Exigido para imóveis que possuam altura igual ou superior a 60 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 60 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 60 m: em exatamente 60 m → sim; logo acima → sim

### Tabela 19, nota 7

**Texto da norma:** Exigido para imóveis com área superior a 20.000 m².

**Leitura do código:**

- Exigido quando a área é maior que 20.000 m².

**Valores-limite:**

- a área é maior que 20.000 m²: em exatamente 20.000 m² → não; logo acima → sim

### Tabela 20, nota 1

**Texto da norma:** J-1 está isento de brigada de incêndio, para J-2 exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Dispensado quando a divisão é J-1.
- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com a população fixa (ver IN 28).

**Perguntas:**

- "J-1 está isento de brigada de incêndio" foi lido como a brigada exigida só para J-2.

### Tabela 20, nota 2

**Texto da norma:** Dispensado para J-1. Exigidos nas seguintes condições: J-2 com até 30 m de altura quando área de depósito for igual ou maior que 750 m²; J-2 com altura superior a 30 m quando área de depósito for igual ou maior que 500 m².

**Leitura do código:**

- Exigido quando (a divisão é J-2 e (o prédio é térreo (um pavimento, altura 0, art. 8º V) ou a altura é menor ou igual a 30 m) e storage_area_m2 é maior ou igual a 750) ou (a divisão é J-2 e (o número de pavimentos é maior que 1 e a altura é maior que 30 m) e storage_area_m2 é maior ou igual a 500).

**Valores-limite:**

- a altura é menor ou igual a 30 m: em exatamente 30 m → sim; logo abaixo → sim
- storage_area_m2 é maior ou igual a 750: em exatamente 750 → sim; logo acima → sim
- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior que 30 m: em exatamente 30 m → não; logo acima → sim
- storage_area_m2 é maior ou igual a 500: em exatamente 500 → sim; logo acima → sim

**Perguntas:**

- A nota usa a área de depósito, não a área total: J-2 até 30 m com depósito de 750 m² ou mais, e acima de 30 m com depósito de 500 m² ou mais. O código pergunta essa área ao usuário. Confirmar a leitura.

### Tabela 20, nota 3

**Texto da norma:** Exigido apenas para J-2, pode ser substituída por chuveiros automáticos.

**Leitura do código:**

- Exigido quando a divisão é J-2.
- Pode ser substituído por Chuveiros automáticos quando a divisão é J-2 (apenas informação, o sistema continua exigido).

### Tabela 20, nota 4

**Texto da norma:** Apenas para J-1 com área maior que 750 m² exige-se somente a compartimentação de fachada, shafts e dutos.

**Leitura do código:**

- Exigido quando a divisão é J-1 e a área é maior que 750 m², limitado a: somente a compartimentação de fachada, shafts e dutos.

**Valores-limite:**

- a área é maior que 750 m²: em exatamente 750 m² → não; logo acima → sim

**Perguntas:**

- As células x⁴⁻⁵ foram lidas como as notas 4 e 5 (e não um intervalo), porque assim as nove notas são citadas.

### Tabela 20, nota 5

**Texto da norma:** Apenas para J-2 com área maior que 500 m², podendo ser substituída por controle de fumaça, detecção e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.

**Leitura do código:**

- Exigido quando a divisão é J-2 e a área é maior que 500 m².
- Pode ser substituído por Controle de fumaça + Detecção automática de incêndio + Chuveiros automáticos quando a divisão é J-2 e a área é maior que 500 m² (apenas informação, o sistema continua exigido).

**Valores-limite:**

- a área é maior que 500 m²: em exatamente 500 m² → não; logo acima → sim

**Perguntas:**

- "Apenas para J-2 com área maior que 500 m²" foi lido como a área total do imóvel, não a de depósito.

### Tabela 20, nota 6

**Texto da norma:** Exigido para imóveis que possuam altura igual ou superior a 60 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 60 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 60 m: em exatamente 60 m → sim; logo acima → sim

### Tabela 20, nota 7

**Texto da norma:** Dispensado para J-1. Exigido para J-2 cujo imóvel possua área igual ou superior à 10.000 m².

**Leitura do código:**

- Exigido quando a divisão é J-2 e a área é maior ou igual a 10.000 m².

**Valores-limite:**

- a área é maior ou igual a 10.000 m²: em exatamente 10.000 m² → sim; logo acima → sim

### Tabela 20, nota 8

**Texto da norma:** Dispensado para J-1. Exigido para J-2.

**Leitura do código:**

- Exigido quando a divisão é J-2.

### Tabela 20, nota 9

**Texto da norma:** Dispensado para J-1. Para J-2 exigido em todos os ambientes (exceto banheiros e ambiente com carga de incêndio desprezível). Se altura até 12 m, exige-se para J-2 se área a partir de 5.000 m². Se altura maior que 12 m, exige-se para J-2 independente da área total.

**Leitura do código:**

- Exigido quando (a divisão é J-2 e (o prédio é térreo (um pavimento, altura 0, art. 8º V) ou a altura é menor ou igual a 12 m) e a área é maior ou igual a 5.000 m²) ou (a divisão é J-2 e (o número de pavimentos é maior que 1 e a altura é maior que 12 m)), limitado a: todos os ambientes (exceto banheiros e ambientes com carga de incêndio desprezível).

**Valores-limite:**

- a altura é menor ou igual a 12 m: em exatamente 12 m → sim; logo abaixo → sim
- a área é maior ou igual a 5.000 m²: em exatamente 5.000 m² → sim; logo acima → sim
- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior que 12 m: em exatamente 12 m → não; logo acima → sim

### Tabela 21, nota 1

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com a população fixa (ver IN 28).

### Tabela 21, nota 2

**Texto da norma:** Dispensado para J-3. Chuveiros automáticos exigidos para J-4 com área igual ou maior que 10.000 m²..

**Leitura do código:**

- Exigido quando a divisão é J-4 e a área é maior ou igual a 10.000 m².

**Valores-limite:**

- a área é maior ou igual a 10.000 m²: em exatamente 10.000 m² → sim; logo acima → sim

### Tabela 21, nota 3

**Texto da norma:** Pode ser substituída por chuveiros automáticos.

**Leitura do código:**

- Pode ser substituído por Chuveiros automáticos (apenas informação, o sistema continua exigido).

### Tabela 21, nota 4

**Texto da norma:** Pode ser substituída por controle de fumaça, detecção e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.

**Leitura do código:**

- Pode ser substituído por Controle de fumaça + Detecção automática de incêndio + Chuveiros automáticos (apenas informação, o sistema continua exigido).

### Tabela 21, nota 5

**Texto da norma:** Exigido para imóveis que possuam altura igual ou superior a 60 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 60 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 60 m: em exatamente 60 m → sim; logo acima → sim

### Tabela 21, nota 6

**Texto da norma:** Dispensado para J-4. Exigido para J-3 apenas quando a área de depósito for ≥ 500 m².

**Leitura do código:**

- Exigido quando a divisão é J-3 e storage_area_m2 é maior ou igual a 500.

**Valores-limite:**

- storage_area_m2 é maior ou igual a 500: em exatamente 500 → sim; logo acima → sim

**Perguntas:**

- A nota usa a área de depósito, não a área total. O código pergunta essa área ao usuário.

### Tabela 21, nota 7

**Texto da norma:** Exigido em todos os ambientes (exceto banheiros e ambiente com carga de incêndio desprezível).

**Leitura do código:**

- Exigido quando sempre, limitado a: todos os ambientes (exceto banheiros e ambientes com carga de incêndio desprezível).

### Tabela 21, nota 8

**Texto da norma:** Isento para J-3. Exigido para J-4 com área superior a 20.000 m².

**Leitura do código:**

- Exigido quando a divisão é J-4 e a área é maior que 20.000 m².

**Valores-limite:**

- a área é maior que 20.000 m²: em exatamente 20.000 m² → não; logo acima → sim

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

### Tabela 18: DIVISÕES I-1 e I-2 COM ÁREA ≥ 750 m² OU ALTURA ≥ 12,00 m

| Sistema | IN | Térreo | H ≤ 6 | 6 < H ≤ 12 | 12 < H ≤ 23 | 23 < H ≤ 30 | > 30 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x | x | x | x | x | x |
| Alarme de incêndio | IN 12 | x | x | x | x | x | x |
| Brigada de incêndio | IN 28 | x¹ | x¹ | x¹ | x¹ | x¹ | x¹ |
| Chuveiros automáticos | IN 15 | - | - | - | - | x² | x |
| Compartimentação horizontal ou de áreas | IN 14 | - | x 7 | x³ | x³ | x³ | x³ |
| Compartimentação vertical | IN 14 | - | - | - | x | x | x |
| Controle de materiais de acabamento | IN 18 | x | x | x | x | x | x |
| Detecção automática de incêndio | IN 12 | - | - | - | x 6 | x 6 | x 6 |
| Elevador de emergência | IN 9 | - | - | - | - | - | x 4 |
| Extintores (V) | IN 6 | x | x | x | x | x | x |
| Gás combustível | IN 8 | x | x | x | x | x | x |
| Hidráulico preventivo | IN 7 | x 5 | x 5 | x 5 | x | x | x |
| Iluminação de emergência (V) | IN 11 | x | x | x | x | x | x |
| Instalações elétricas de baixa tensão | IN 19 | x | x | x | x | x | x |
| Plano de emergência | IN 31 | x 6 | x 6 | x 6 | x | x | x |
| Proteção estrutural (TRRF) | IN 14 | x | x | x | x | x | x |
| Saídas de emergência | IN 9 | x | x | x | x | x | x |
| Sinalização para abandono de local (V) | IN 13 | x | x | x | x | x | x |

### Tabela 19: DIVISÃO I-3 COM ÁREA ≥ 750 m² OU ALTURA ≥ 12,00 m

| Sistema | IN | Térreo | H ≤ 6 | 6 < H ≤ 12 | 12 < H ≤ 23 | 23 < H ≤ 30 | > 30 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x | x | x | x | x | x |
| Alarme de incêndio | IN 12 | x | x | x | x | x | x |
| Brigada de incêndio | IN 28 | x¹ | x¹ | x¹ | x¹ | x¹ | x¹ |
| Chuveiros automáticos | IN 15 | x² | x² | x² | x | x | x |
| Compartimentação horizontal ou de áreas | IN 14 | x³ | x³ | x³ | x³ | x | x |
| Compartimentação vertical | IN 14 | - | - | - | x⁴ | x⁴ | x |
| Controle de fumaça | IN 10 | x 7 | x 7 | x 7 | x 7 | x 7 | x 7 |
| Controle de materiais de acabamento | IN 18 | x | x | x | x | x | x |
| Detecção automática de incêndio | IN 12 | x⁵ | x⁵ | x⁵ | x⁵ | x⁵ | x⁵ |
| Elevador de emergência | IN 9 | - | - | - | - | - | x⁶ |
| Extintores (V) | IN 6 | x | x | x | x | x | x |
| Gás combustível | IN 8 | x | x | x | x | x | x |
| Hidráulico preventivo | IN 7 | x | x | x | x | x | x |
| Iluminação de emergência (V) | IN 11 | x | x | x | x | x | x |
| Instalações elétricas de baixa tensão | IN 19 | x | x | x | x | x | x |
| Plano de emergência | IN 31 | x | x | x | x | x | x |
| Proteção estrutural (TRRF) | IN 14 | x | x | x | x | x | x |
| Saídas de emergência | IN 9 | x | x | x | x | x | x |
| Sinalização para abandono de local (V) | IN 13 | x | x | x | x | x | x |

### Tabela 20: DIVISÕES J-1 e J-2 COM ÁREA ≥ 750 m² OU ALTURA ≥ 12,00 m

| Sistema | IN | Térreo | H ≤ 6 | 6 < H ≤ 12 | 12 < H ≤ 23 | 23 < H ≤ 30 | > 30 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x | x | x | x | x | x |
| Alarme de incêndio | IN 12 | x | x | x | x | x | x |
| Brigada de incêndio | IN 28 | x¹ | x¹ | x¹ | x¹ | x¹ | x¹ |
| Chuveiros automáticos | IN 15 | - | - | - | - | x² | x² |
| Compartimentação horizontal ou de áreas | IN 14 | x³ | x³ | x³ | x³ | x³ | x |
| Compartimentação vertical | IN 14 | - | - | - | x⁴⁻⁵ | x⁴⁻⁵ | x |
| Controle de materiais de acabamento | IN 18 | x⁸ | x | x | x | x | x |
| Detecção automática de incêndio | IN 12 | x⁹ | x⁹ | x⁹ | x⁹ | x⁹ | x⁹ |
| Elevador de emergência | IN 9 | - | - | - | - | - | x⁶ |
| Extintores (V) | IN 6 | x | x | x | x | x | x |
| Gás combustível | IN 8 | x | x | x | x | x | x |
| Hidráulico preventivo | IN 7 | x² | x² | x² | x | x | x |
| Iluminação de emergência (V) | IN 11 | x | x | x | x | x | x |
| Instalações elétricas de baixa tensão | IN 19 | x | x | x | x | x | x |
| Plano de emergência | IN 31 | - | - | - | x⁷ | x⁷ | x⁷ |
| Proteção estrutural (TRRF) | IN 14 | x | x | x | x | x | x |
| Saídas de emergência | IN 9 | x | x | x | x | x | x |
| Sinalização para abandono de local (V) | IN 13 | x | x | x | x | x | x |

### Tabela 21: DIVISÕES J-3 e J-4 COM ÁREA ≥ 750 m² OU ALTURA ≥ 12,00 m

| Sistema | IN | Térreo | H ≤ 6 | 6 < H ≤ 12 | 12 < H ≤ 23 | 23 < H ≤ 30 | > 30 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x | x | x | x | x | x |
| Alarme de incêndio | IN 12 | x | x | x | x | x | x |
| Brigada de incêndio | IN 28 | x¹ | x¹ | x¹ | x¹ | x¹ | x¹ |
| Chuveiros automáticos | IN 15 | x² | x² | x² | x⁶ | x | x |
| Compartimentação horizontal ou de áreas | IN 14 | x³ | x³ | x³ | x³ | x³ | x |
| Compartimentação vertical | IN 14 | - | - | - | x⁴ | x⁴ | x |
| Controle de fumaça | IN 10 | x 8 | x 8 | x 8 | x 8 | x 8 | x 8 |
| Controle de materiais de acabamento | IN 18 | x | x | x | x | x | x |
| Detecção automática de incêndio | IN 12 | x⁷ | x⁷ | x⁷ | x⁷ | x⁷ | x⁷ |
| Elevador de emergência | IN 9 | - | - | - | - | - | x⁵ |
| Extintores (V) | IN 6 | x | x | x | x | x | x |
| Gás combustível | IN 8 | x | x | x | x | x | x |
| Hidráulico preventivo | IN 7 | x | x | x | x | x | x |
| Iluminação de emergência (V) | IN 11 | x | x | x | x | x | x |
| Instalações elétricas de baixa tensão | IN 19 | x | x | x | x | x | x |
| Plano de emergência | IN 31 | x | x | x | x | x | x |
| Proteção estrutural (TRRF) | IN 14 | x | x | x | x | x | x |
| Saídas de emergência | IN 9 | x | x | x | x | x | x |
| Sinalização para abandono de local (V) | IN 13 | x | x | x | x | x | x |
