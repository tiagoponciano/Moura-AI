# Regras do Grupo K: folha de revisão

Gerada a partir do código (`lib/rulesets/review-sheet.ts`); não edite à mão. Serve para conferir se cada nota da norma foi lida corretamente e para levar as perguntas em aberto à Moura.

## Estado

- **Todas as regras são provisórias.** Nenhuma foi aprovada por uma pessoa.
- Fonte: IN 1 parte 2, Anexo B, Tabela 22; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º (risco). Em vigor desde 24/04/2024 (IN 1 parte 2, art. 31; IN 3, art. 14; IN 1 parte 1, art. 165).
- Cobertura: o Grupo K (energia: K-1 e K-2), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".

## Perguntas para a Moura

### Gerais

1. **O que conta como pavimento.** O art. 8º tira da altura os mezaninos, casas de máquinas e alguns subsolos. O código usa o número de pavimentos informado pelo usuário e não faz essas exclusões. Como a Moura quer contar?
2. **Gás combustível (IN 8).** Aparece como exigido em todas as colunas do Grupo C. Vale para qualquer imóvel do grupo, mesmo sem instalação de gás?
3. **Carga de incêndio.** O código aceita a classe (desprezível a altíssima) ou o valor em MJ/m² e deriva a classe pelos limites da IN 3, art. 11. Quem informa esse valor para o cliente? A IN 3 tem uma tabela por atividade (Anexo B) que ainda não está carregada.
4. **Divisão K-1 e K-2.** A divisão vem da conversa e o usuário confirma. A Tabela 22 não depende de área nem de altura: o código não aplica a trava de exatamente 750 m² ou 12 m ao Grupo K.
5. **Colunas.** K-1 divide por volume de líquido combustível (até 20 m³ ou acima) e K-2 por tipo de usina (hidroelétrica ou termoelétrica). O código pergunta os dois dados novos. Quem responde, e o volume vale por imóvel ou por equipamento?
6. **Escopo do Grupo K.** Entra: um bloco e uma só ocupação (ou outras só subsidiárias). Fora disso o resultado é "análise específica". É aceitável?
7. **Risco do Grupo K.** O Quadro 2 do Anexo A da IN 1 parte 1 não traz linha para K. O código usa as regras gerais de risco I, II e V e deixa o resto no risco IV. Confirmar.
8. **Líquidos inflamáveis e combustíveis.** A norma fala em inflamável classe I acima de 1.000 L para o risco V e em "líquido inflamável" (interno) e "inflamável/combustível" (externo) para o risco II. O código pergunta um volume só de "inflamáveis ou combustíveis" em área interna e outro em área externa. Basta, ou é preciso separar a classe?
9. **Altura no risco.** O código usa a mesma altura da exigência dos sistemas (art. 8º: térreo vale 0) também para o Quadro 2. Confirmar.
10. **Ocupação subsidiária (IN 1 parte 2, art. 10).** Quando o usuário diz que há mais de uma ocupação, o código pergunta se as outras são só subsidiárias (vinculadas e fundamentais à principal, como garagem, salão de festas ou depósito de apoio), sem reunião de público para mais de 100 pessoas (art. 10, § 4º) e sem depósito acima de 1.000 m² (IN 1 parte 1, art. 4º, IV). Se sim, valem os sistemas da ocupação predominante, com a observação da compartimentação de garagens (§§ 1º a 3º). Se não, é ocupação mista ou secundária e vai para análise específica. Quem responde essa pergunta, e os limites usados estão certos?
11. **Ainda não existe:** a camada de edificações existentes e recentes (IN 5), que rotula cada sistema como vital, indispensável ou adequável. O resultado mostra o enquadramento de risco e os sistemas exigidos.

### Por nota

- Tabela 22, nota 2: A nota exige o sistema só para armazenamento de combustíveis sólidos acima de 750 m². Para líquidos, remete a uma norma específica, que o código não consulta. Confirmar a leitura.
- Tabela 22, nota 5: A nota vale só para as áreas edificadas de K-2, nos ambientes com carga de incêndio maior que 1.200 MJ/m², nos locais de armazenamento de combustíveis e na casa de máquinas e caldeiras. O código lista o sistema com esse escopo e não avalia cada ambiente.
- Tabela 22, nota 7: A nota 7 aparece na Espuma (K-2 termoelétrica) e também em todas as colunas de Proteção estrutural. O código aplica "se houver local de armazenamento de líquidos combustíveis" às duas; para Proteção estrutural isso pode ser uma nota deslocada no PDF. Qual vale?
- Tabela 22, nota 8: A nota 8 aparece na Espuma e no Resfriamento de K-1 acima de 20 m³ e diz só "pode ser substituído". O código vale a substituição para os dois. Confirmar.
- Tabela 22, nota 9: A nota fala em locais, não no imóvel inteiro. O código exige o sistema quando a carga de incêndio informada é alta ou altíssima e mostra o texto como escopo. Confirmar a leitura.
- Tabela 22, nota 9: A célula cita as notas 2 e 9 ("x²⁻ 9"); o código leu como as duas notas, e o sistema é exigido se qualquer uma valer. Era uma lista ou um intervalo?
- Tabela 22, nota 10: A nota fala em locais, não no imóvel inteiro. O código exige o sistema quando a carga de incêndio informada é alta ou altíssima e mostra o texto como escopo. Confirmar a leitura.

## Como o código lê cada nota

### Tabela 22, nota 1

**Texto da norma:** Dispensado quando houver acesso a partir do passeio público com caminhamento máximo de 50 m.

**Leitura do código:**

- Dispensado quando public_road_within_50m.

### Tabela 22, nota 2

**Texto da norma:** Exige-se para imóvel que armazena combustíveis sólidos cuja área para tal armazenamento seja superior a 750 m². Para imóvel que armazena combustíveis líquidos, consultar norma específica.

**Leitura do código:**

- Exigido quando solid_fuel_storage_m2 é maior que 750.
- Informação, sem efeito na exigência: Para imóvel que armazena combustíveis líquidos, consultar norma específica.

**Valores-limite:**

- solid_fuel_storage_m2 é maior que 750: em exatamente 750 → não; logo acima → sim

**Perguntas:**

- A nota exige o sistema só para armazenamento de combustíveis sólidos acima de 750 m². Para líquidos, remete a uma norma específica, que o código não consulta. Confirmar a leitura.

### Tabela 22, nota 3

**Texto da norma:** Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

**Leitura do código:**

- Informação, sem efeito na exigência: Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).

### Tabela 22, nota 4

**Texto da norma:** Chuveiros automáticos são exigidos para imóveis que possuam altura igual ou superior a 60 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 60 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 60 m: em exatamente 60 m → sim; logo acima → sim

### Tabela 22, nota 5

**Texto da norma:** Exige-se apenas para as áreas edificadas de K-2 nos ambientes com carga de incêndio maior que 1.200 MJ/m² e nos locais de armazenamento de combustíveis e casa de máquinas, caldeiras.

**Leitura do código:**

- Exigido quando sempre, limitado a: somente locais com carga de incêndio maior que 1.200 MJ/m², locais de armazenamento de combustíveis, casa de máquinas e caldeiras.

**Perguntas:**

- A nota vale só para as áreas edificadas de K-2, nos ambientes com carga de incêndio maior que 1.200 MJ/m², nos locais de armazenamento de combustíveis e na casa de máquinas e caldeiras. O código lista o sistema com esse escopo e não avalia cada ambiente.

### Tabela 22, nota 6

**Texto da norma:** Exigido para imóveis que possuam altura igual ou superior a 40 m.

**Leitura do código:**

- Exigido quando o número de pavimentos é maior que 1 e a altura é maior ou igual a 40 m.

**Valores-limite:**

- o número de pavimentos é maior que 1: em exatamente 1 → não; logo acima → sim
- a altura é maior ou igual a 40 m: em exatamente 40 m → sim; logo acima → sim

### Tabela 22, nota 7

**Texto da norma:** Se houver local de armazenamento de líquidos combustíveis.

**Leitura do código:**

- Exigido quando combustible_liquid_storage.

**Perguntas:**

- A nota 7 aparece na Espuma (K-2 termoelétrica) e também em todas as colunas de Proteção estrutural. O código aplica "se houver local de armazenamento de líquidos combustíveis" às duas; para Proteção estrutural isso pode ser uma nota deslocada no PDF. Qual vale?

### Tabela 22, nota 8

**Texto da norma:** Na ocupação K-1 pode ser substituído por sistema fixo automatizado para transformadores e reatores de potência conforme NBR 13231.

**Leitura do código:**

- Pode ser substituído por Sistema fixo automatizado para transformadores e reatores de potência (NBR 13231) (apenas informação, o sistema continua exigido).

**Perguntas:**

- A nota 8 aparece na Espuma e no Resfriamento de K-1 acima de 20 m³ e diz só "pode ser substituído". O código vale a substituição para os dois. Confirmar.

### Tabela 22, nota 9

**Texto da norma:** SHP exigido em locais com carga de incêndio maior que 1.200 MJ/m²; em locais de armazenamento de combustíveis, em casa de máquinas e em caldeiras.

**Leitura do código:**

- Exigido quando a classe de carga de incêndio é alta ou altíssima, limitado a: somente locais com carga de incêndio maior que 1.200 MJ/m², locais de armazenamento de combustíveis, casa de máquinas e caldeiras.

**Perguntas:**

- A nota fala em locais, não no imóvel inteiro. O código exige o sistema quando a carga de incêndio informada é alta ou altíssima e mostra o texto como escopo. Confirmar a leitura.
- A célula cita as notas 2 e 9 ("x²⁻ 9"); o código leu como as duas notas, e o sistema é exigido se qualquer uma valer. Era uma lista ou um intervalo?

### Tabela 22, nota 10

**Texto da norma:** Exigido em locais com carga de incêndio maior que 1.200 MJ/m²; em locais de armazenamento de combustíveis, em casa de máquinas e em caldeira.

**Leitura do código:**

- Exigido quando a classe de carga de incêndio é alta ou altíssima, limitado a: somente locais com carga de incêndio maior que 1.200 MJ/m², locais de armazenamento de combustíveis, casa de máquinas e caldeiras.

**Perguntas:**

- A nota fala em locais, não no imóvel inteiro. O código exige o sistema quando a carga de incêndio informada é alta ou altíssima e mostra o texto como escopo. Confirmar a leitura.

## Tabelas como estão impressas na norma

### Tabela 22: DIVISÕES K-1 e K-2

| Sistema | IN | K-1, líquido combustível ≤ 20 m³ | K-1, líquido combustível > 20 m³ | K-2, hidroelétrica | K-2, termoelétrica |
| --- | --- | --- | --- | --- | --- |
| Acesso de viaturas | IN 35 | x¹ | x | x | x |
| Alarme de incêndio | IN 12 | x² | x² | x² | x² |
| Brigada de incêndio | IN 28 | x³ | x | x | x |
| Compartimentação horizontal ou de áreas | IN 14 | x² | x² | - | - |
| Compartimentação vertical | IN 14 | x 10 | x 10 | x 10 | x 10 |
| Chuveiros automáticos | IN 15 | - | - | - | x⁴ |
| Detecção automática de incêndio | IN 12 | - | - | x⁵ | x⁵ |
| Elevador de emergência | IN 9 | - | - | x⁶ | x⁶ |
| Espuma | NBR 12232 | - | x⁸ | - | x 7 |
| Extintores (V) | IN 6 | x | x | x | x |
| Gás combustível | IN 8 | - | - | x | x |
| Hidráulico preventivo | IN 7 | - | - | x²⁻ 9 | x²⁻ 9 |
| Iluminação de emergência (V) | IN 11 | x | x | x | x |
| Instalações elétricas de baixa tensão | IN 19 | - | - | x | x |
| Plano de emergência | IN 31 | - | x | x | x |
| Proteção estrutural (TRRF) | IN 14 | x 7 | x 7 | x 7 | x 7 |
| Saídas de emergência | IN 9 | x | x | x | x |
| Sinalização para abandono de local (V) | IN 13 | x | x | x | x |
| Resfriamento | NBR 10897 NFPA 15 NFPA 750 | - | x⁸ | - | - |
