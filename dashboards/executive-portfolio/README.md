# Executive Portfolio Analytics

Dashboard de seguros demonstrativo, responsivo e interativo, parte do portfólio de Ewerton Vieira.

## Como visualizar

Abra o arquivo index.html no navegador ou acesse o dashboard pelo card **Executive Portfolio Analytics** na seção Projetos do portfólio publicado. Não há build, credenciais ou backend. Os gráficos dependem do **Apache ECharts 5.6.0** carregado via CDN, enquanto filtros, KPIs, tabela e exportação CSV continuam operando se a biblioteca gráfica não carregar.

## Recursos

- Filtros de período, produto, região e canal, combináveis entre si.
- Indicadores de prêmios emitidos, sinistralidade, índice combinado, resultado técnico e crescimento YoY.
- Visualização temporal de prêmios ganhos, sinistros e índice combinado.
- Mix de produtos, índice combinado por produto, produção por região e por canal.
- Clique nas categorias dos gráficos ou no nome do produto na tabela para aplicar/remover o filtro.
- Exportação CSV dos registros filtrados em UTF-8 BOM com separador ponto e vírgula e decimal vírgula para facilitar abertura em Excel PT-BR.
- Layout adaptativo e respeito à preferência de movimento reduzido.

## Dicionário de métricas

| Indicador | Fórmula |
| --- | --- |
| Prêmios emitidos | Soma das emissões sintéticas do período |
| Prêmios ganhos | Soma do prêmio ganho sintético |
| Sinistralidade | Sinistros incorridos ÷ prêmios ganhos |
| Índice combinado | (Sinistros + despesas administrativas + comissões) ÷ prêmios ganhos |
| Resultado técnico | Prêmios ganhos − sinistros − despesas administrativas − comissões |
| Crescimento YoY | Prêmios emitidos na janela selecionada ÷ prêmios emitidos na mesma janela do ano anterior − 1 |

Os indicadores são agregados por **razão entre somatórios** (nunca média simples das razões individuais).

A comparação YoY é intencionalmente indisponível para 2024 (sem observações de 2023) e para "Todo o histórico" (não existe janela anterior completa no conjunto).

## Sobre os dados

**Todos os dados são sintéticos e fictícios.** O script gera registros por competência, produto, região e canal (2024-01 a 2026-09) com gerador pseudoaleatório de semente fixa. Produto, canal, região e sazonalidade alteram volume e indicadores para permitir comparações plausíveis. A mesma versão do código gera sempre a mesma base, sem consultas a APIs, cookies analíticos ou conexão com empresas reais.

Os dados **não representam a Zurich, outras seguradoras, clientes ou informações confidenciais**. Não usar em análises, decisões comerciais ou financeiras reais.

## Arquivos

- index.html: estrutura semântica e controles.
- dashboard.css: identidade visual, responsividade e acessibilidade.
- dashboard.js: criação da base, transformação, filtros, indicadores, ECharts e exportação.

## Teste manual mínimo

1. Abra o dashboard e confirme que aparecem cinco KPIs e cinco gráficos.
2. Escolha "2025 completo" e valide que a janela e os totais mudam.
3. Selecione um produto e uma região; a tabela, métricas e todos os gráficos devem atualizar.
4. Clique em um produto no gráfico e depois no mesmo novamente para ativar/desativar o filtro.
5. Exporte o CSV e verifique que contém apenas registros do período/filtros atuais.
6. Use "Limpar" para voltar ao padrão dos últimos 12 meses.
7. Teste em uma tela estreita e navegue com teclado.
