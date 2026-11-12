# Gerar o modelo anatômico 3D real (BodyParts3D)

O app já vem com um modelo **provisório** (formas simples) para testar giro, toque e seleção.
Os passos abaixo geram o corpo anatômico real. Rode no **seu computador** (precisa de internet e Node 18+).

## 1. Baixar

Na página oficial do BodyParts3D (Database Center for Life Science, DBCLS), baixe:

- `BodyParts3D_3.0_obj_99.zip` (~127 MB, malhas simplificadas, **recomendado para celular**)
- `parts_list_e.txt` (nomes das partes)

A versão `_95` (~521 MB) tem ~5x mais triângulos e deixa o app pesado.

Descompacte o zip em uma pasta, por exemplo `~/bp3d/obj`. Cada arquivo é `<ID>.obj`.

## 2. Conferir os nomes (opcional)

```bash
node tools/build-anatomy-model.mjs --parts-list ~/bp3d/parts_list_e.txt --grep "deltoid"
node tools/build-anatomy-model.mjs --parts-list ~/bp3d/parts_list_e.txt --grep "pectoralis"
```

Mostra as partes reais que existem. Se algum músculo não for reconhecido, ajuste as expressões em
`tools/muscle-rules.mjs` (cada regra liga um nome do modelo a um id do catálogo).

## 3. Gerar

```bash
node tools/build-anatomy-model.mjs --obj-dir ~/bp3d/obj --parts-list ~/bp3d/parts_list_e.txt
node tools/verify-glb.mjs assets/models/anatomy.glb
```

Isso cria `assets/models/anatomy.glb` e `src/data/anatomy/model-manifest.json`, e imprime um relatório
(também salvo em `tools/last-report.txt`) com:

- quais músculos do catálogo têm malha e quais não têm;
- quais malhas representam várias porções (o modelo não as separa);
- a orientação detectada (cima/frente) e avisos, se houver.

**Me envie esse relatório** se algo parecer errado. Eu ajusto as regras sem você precisar mexer no código.

## 4. Rodar

```bash
npx expo start -c
```

## Licença e atribuição (importante)

O BodyParts3D usa **CC BY-SA 2.1 Japão**:

- A atribuição é obrigatória. O app mostra automaticamente, na tela Anatomia:
  "BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan".
- "Share-alike": obras derivadas (inclusive o `.glb` gerado) devem ser distribuídas sob a mesma licença.
  Se você pretende publicar ou vender o app, **revise isso com cuidado antes**. Não sou advogado.

## Limitações conhecidas

- O BodyParts3D costuma modelar o músculo inteiro. Se não houver malhas separadas para porções (ex.: peitoral
  clavicular/esternocostal/inferior), o app destaca o músculo todo e avisa na tela.
- Músculos sem equivalente no catálogo (ex.: serrátil) entram em cinza escuro, sem interação.
- A estética é de "écorché" (músculos sem pele), não a de um corpo coberto como na sua imagem de referência.
