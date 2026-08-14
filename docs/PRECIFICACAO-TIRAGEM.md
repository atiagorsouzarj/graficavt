# Proposta — Precificação por Tiragem / Kit

> **Status: documento de decisão.** A lógica atual de produto não será alterada
> até que esta proposta seja aprovada. O motor existente de custo unitário
> continua funcionando normalmente.

## Objetivo

Permitir produtos gráficos vendidos por **quantidade, kit ou tiragem**, onde uma
folha contém várias unidades aproveitáveis: cartões, tags, mini cartões,
lembrancinhas, adesivos e similares.

A regra será configurada **dentro do editor de Produto**, em uma nova seção
futura chamada **“Tiragens e aproveitamento”**. Não ficará na categoria da
impressora, porque cada produto ocupa a folha de forma diferente.

---

## Campos propostos no Produto

| Campo | Exemplo Cartão | Exemplo Tag | Função |
|---|---:|---:|---|
| Formato de impressão | A4 | A3 | Define custo de impressão conforme impressora/categoria |
| Material | Couché A4 300g | Kraft A3 240g | Custo por folha |
| Unidades por folha | 10 | 24 | Aproveitamento real depois de sangria/corte |
| Faces impressas | 2 | 1 | Frente/verso |
| Perda de produção | 5% | 8% | Refugo, prova, ajuste de corte |
| Acabamentos | Corte | Furo + corte | Custo por unidade ou por lote |
| Tiragens comerciais | 100, 250, 500, 1000 | Kit 10, 20, 50, 100 | Preços exibidos para venda |

---

## Fórmula base

### 1. Folhas necessárias para uma tiragem

```text
folhas_base = teto(quantidade_vendida ÷ unidades_por_folha)
folhas_com_perda = teto(folhas_base × (1 + perda_percentual))
```

### 2. Custo de impressão

```text
custo_impressao_lote =
  custo_da_impressao_por_folha(formato, cobertura, faces)
  × folhas_com_perda
```

> A função `custo_da_impressao_por_folha` continua usando exatamente o motor
> atual: consumíveis da categoria + fator da impressora + formato + cobertura.

### 3. Custo do material

```text
custo_material_lote = custo_material_por_folha × folhas_com_perda
```

### 4. Acabamentos

```text
custo_acabamento_lote =
  soma(acabamento_por_unidade × quantidade_vendida)
  + soma(acabamento_por_lote)
```

### 5. Custo total e preço de venda

```text
custo_producao =
  custo_impressao_lote
  + custo_material_lote
  + custo_acabamento_lote
  + outros_insumos

preco_sem_taxas = custo_producao ÷ (1 - margem_lucro)
imposto = preco_sem_taxas × percentual_imposto
maquininha = preco_sem_taxas × percentual_maquininha
preco_final_da_tiragem = preco_sem_taxas + imposto + maquininha
preco_por_unidade = preco_final_da_tiragem ÷ quantidade_vendida
```

---

## Exemplo A — Cartão de Visita, 100 unidades

**Configuração:** Konica C284-e · Laser colorido · Couché A4 · frente e verso ·
10 cartões aproveitáveis por folha · 5% de perda.

```text
quantidade_vendida = 100 cartões
unidades_por_folha = 10
folhas_base = teto(100 ÷ 10) = 10 folhas
folhas_com_perda = teto(10 × 1,05) = 11 folhas

custo_impressao_lote = custo_laser_colorido_A4_frente_verso × 11
custo_material_lote = custo_couche_A4 × 11
custo_corte_lote = custo_corte_por_cartao × 100

custo_producao = impressão + couché + corte
preço_final = (custo_producao ÷ (1 - margem)) + imposto + maquininha
```

O produto poderá ter tiragens prontas: **100 / 250 / 500 / 1000 unidades**.
Cada uma recalcula folhas, perda, corte, margem, impostos e taxa de cartão.

---

## Exemplo B — Tags de bolsinha em Kraft, kits 10/20/50/100

**Configuração:** Konica C284-e · Laser · Kraft A3 · impressão frente ·
24 tags aproveitáveis por folha · 8% de perda · furo + corte por tag.

```text
Para o kit de 50:
folhas_base = teto(50 ÷ 24) = 3
folhas_com_perda = teto(3 × 1,08) = 4 folhas A3

custo_impressao = custo_laser_A3 × 4
custo_kraft = custo_kraft_A3 × 4
custo_furo = custo_furo_por_tag × 50
custo_corte = custo_corte_por_tag × 50

preço_kit_50 =
  ((impressão + kraft + furo + corte) ÷ (1 - margem))
  + imposto + maquininha
```

> O kit de 10 também precisa de uma folha inteira se 10 não couber em um
> aproveitamento menor. Por isso **não se deve multiplicar simplesmente o preço
> unitário**: cada tiragem recalcula o número de folhas.

---

## Decisões recomendadas antes de implementar

1. **Variação por tiragem:** uma tiragem fica fixa no produto (100/250/500) ou
   o atendente pode digitar quantidade livre no orçamento?
2. **Folha mínima:** confirma que sempre arredondamos para cima (nunca fraciona
   folha)? Recomendação: **sim**.
3. **Corte:** será cobrado por unidade, por folha ou por lote? O módulo aceita
   os três modos, mas a regra precisa ser definida para cada acabamento.
4. **Margem:** margem por produto ou margem por faixa de tiragem? Recomendação:
   margem maior em tiragens pequenas e menor em grandes.
5. **Preço comercial:** deseja arredondamento final (ex.: R$ 39,87 → R$ 39,90
   ou R$ 40,00)? Recomendação: regra configurável no Painel de Controle.

---

## Onde entra no sistema

```text
Produto
 ├── Informações
 ├── Impressão / Material / Acabamentos / Serviço        [já existe]
 ├── Tiragens e Aproveitamento                           [futuro, após aprovação]
 │    ├── unidades por folha
 │    ├── faces
 │    ├── perda
 │    ├── tiragens comerciais
 │    └── tabela de preços por kit
 └── Calculadora final                                   [já existe]
```

Essa separação preserva o motor atual de impressora e evita confundir o custo
por folha da Konica com a regra comercial de venda em kits.
