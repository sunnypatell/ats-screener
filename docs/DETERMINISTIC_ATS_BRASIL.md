# Deterministic ATS Brasil

## Objetivo

Este modo analisa currículos sem LLM, sem API de IA e sem custo por documento. O pipeline é explicável: cada campo e cada nota deriva de extração de texto, OCR próprio, taxonomias locais e regras versionadas.

## Pipeline

```text
PDF/DOCX
  -> camada textual e geometria
  -> medição de qualidade
  -> OCR Tesseract por+eng somente quando necessário
  -> normalização Unicode
  -> contato, seções, experiências, formação, projetos e competências
  -> descrição da vaga estruturada
  -> pontuação por perfil ATS
  -> evidências e recomendações
```

### Extração

- PDF: `pdfjs-dist`, reconstrução por coordenadas e espaçamento adaptativo.
- DOCX: `mammoth`, preservando parágrafos/listas e detectando tabelas/imagens.
- OCR: Poppler + Tesseract `por+eng` no próprio container.
- Limites OCR: 10 MB, seis páginas e duas tarefas simultâneas.
- Idiomas: português brasileiro e inglês.

### Campos estruturados

- contato;
- resumo;
- competências;
- experiências, cargos, empresas, períodos e tópicos;
- formação, instituição, área e período;
- projetos e certificações;
- metadados de leitura e confiança.

## Pontuação

Os perfis Workday, Taleo, SuccessFactors, iCIMS, Greenhouse e Lever são simulações determinísticas baseadas em diferenças documentadas de parsing, formatação e correspondência de termos. Não são integrações oficiais nem cópias dos algoritmos proprietários.

### Gupy-like

O perfil `Gupy-like` é uma simulação transparente baseada somente nas orientações públicas da Gupy para pessoas candidatas. Ele dá mais peso a:

- experiências estruturadas;
- competências obrigatórias e desejáveis da vaga;
- tempo mínimo de experiência;
- aderência entre cargos/descrições e área da vaga;
- formação exigida.

Nome, e-mail, telefone e outros dados de contato não entram no corpus de aderência do perfil Gupy-like.

Sem descrição da vaga, a dimensão de palavras-chave é removida e os demais pesos são normalizados. Portanto, o sistema não atribui mais `100` artificial nessa dimensão.

## Confiança

A interface separa:

- qualidade da extração;
- compatibilidade de formato;
- completude das seções;
- qualidade das experiências;
- formação;
- aderência à vaga, quando uma vaga é fornecida.

## Variáveis de ambiente

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
OCR_ENABLED=true
PUBLIC_DETERMINISTIC_ONLY=true
ORIGIN=https://ats.seudominio.com
```

Não são necessárias chaves Gemini, Groq, OpenAI ou qualquer outro provedor.

## Testes

A suíte cobre:

- currículos equivalentes em PT-BR e inglês;
- títulos com emojis;
- telefone brasileiro quebrado entre linhas;
- cinco experiências, incluindo entradas compactas e datas quebradas;
- duas formações;
- competências canônicas;
- ausência de pontuação falsa sem vaga;
- sete perfis ATS;
- requisitos obrigatórios/desejáveis;
- períodos de trabalho sobrepostos sem dupla contagem;
- isolamento de nome/e-mail no Gupy-like;
- fluxo E2E por texto colado;
- build da imagem Docker com OCR.

## Limitações honestas

- OCR pode errar documentos com baixa resolução, manuscritos ou fontes decorativas.
- Os perfis de plataformas são aproximações públicas, não algoritmos internos.
- Perguntas eliminatórias configuradas pela empresa não podem ser inferidas apenas pelo currículo.
- A nota deve ser interpretada junto com as evidências, nunca como garantia de aprovação.
