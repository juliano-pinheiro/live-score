# Next Score ⚽

> Aplicativo moderno de resultados e estatísticas de futebol em tempo real, desenvolvido com **React Native**, **Expo** e **TypeScript**, inspirado no padrão visual e na fluidez do Sofascore.

---

## 📱 Visão Geral

O **Next Score** é um aplicativo mobile e web para acompanhamento ao vivo de partidas de futebol em todo o mundo. A aplicação consome os serviços públicos da ESPN com um pipeline próprio de normalização de dados, deduplicação de requisições, detecção automática de países e bandeiras, e proteções avançadas de estabilidade de memória para Android.

---

## ✨ Principais Funcionalidades

### 1. Placares e Acompanhamento em Tempo Real
- **Status dinâmicos:** Partidas agendadas (`AGD`), em andamento com minutagem (`1º Tempo`, `45'`, `INT`, `2º Tempo`, `90+3'`) e finalizadas (`FIM`).
- **Placares limpos para jogos não iniciados:** Jogos antes do apito inicial mantêm o placar em branco, evitando a exibição de falsos zeros a zero (`0 - 0`).
- **Sincronização imediata:** O placar principal é atualizado em tempo real conjuntamente com a emissão do evento do gol e do autor.

### 2. Agrupamento e Normalização de Ligas
- **Detecção e Dedução de País (`inferLeagueCountry`):** Mapeamento de ligas e copas nacionais e continentais (Inglaterra, Espanha, Itália, Alemanha, França, Brasil, Argentina, etc.) associando automaticamente a bandeira do país de origem via CDN.
- **Limpeza de Nomes Redundantes (`cleanLeagueDisplayName`):** Eliminação de gentílicos duplicados (ex.: transforma `Peruvian Liga 1` sob `Peru` em `PERU • LIGA 1`, e `English Premier League` sob `Inglaterra` em `INGLATERRA • PREMIER LEAGUE`).
- **Reputação e Ordenação:** Destaque automático para os principais torneios mundiais (Champions League, Libertadores, Premier League, Brasileirão, LaLiga, Serie A, etc.) no topo da listagem.
- **Favoritos e Fixação:** Possibilidade de fixar competições preferidas no topo e recolher/expandir grupos de partidas.

### 3. Modal Completo de Detalhes da Partida
- **Resumo da Partida:** Linha do tempo visual com gols, assistências, cartões amarelos/vermelhos, substituições e intervenções do VAR.
- **Estatísticas Comparativas:** Gráficos de posse de bola, chutes a gol, faltas, escanteios, cartões e passes.
- **Escalações e Prancheta Tática:** Diagrama interativo de campo com titulares, numeração, posições, capitão e lista completa do banco de reservas e comissão técnica.
- **Tabela de Classificação:** Classificação da liga com pontos, jogos, vitórias, empates, derrotas e saldo de gols.
- **Confrontos Diretos (H2H):** Histórico de duelos entre as equipes com contagem de vitórias e empates.
- **Perfil do Clube:** Estatísticas da temporada, elenco completo, sequência de forma recente e próximos compromissos da equipe.
- **Ficha Técnica:** Informações sobre o estádio, localidade e árbitro do jogo.

### 4. Navegação e Filtros
- **Seletor de Datas:** Calendário horizontal para navegar entre partidas de dias anteriores, hoje e próximos dias.
- **Filtros de Estado:** Alternância rápida entre `Todos`, `Ao Vivo`, `Finalizados` e `Próximos`.
- **Ordenação Cronológica:** Opção de ordenar os jogos por horário de início ou mantê-los agrupados por relevância de torneio.

---

## ⚡ Otimizações de Desempenho e Estabilidade Mobile

Para evitar falhas de memória (OOM / crashes) em dispositivos Android durante longas sessões de polling ao vivo:
1. **Dirty-Check Bailout:** Comparação por hash/assinatura do payload recebido no polling. Se não houve alteração nos jogos, a renderização do React é cancelada antes de disparar re-render do estado.
2. **Controle de Concorrência de Rede:** Limite estrito de chamadas paralelas para a resolução de metadados de ligas desconhecidas (`resolveLeagueName`) e cache em memória com `ATTEMPTED_LEAGUES`.
3. **Gestão de Imagens e Bandeiras:** O componente `TeamCrest` e `CountryFlag` contam com tratamento de erro em memória (`FAILED_LOGOS` e `FAILED_FLAGS`), evitando loops de requisições de imagens quebradas.
4. **Android Large Heap:** Configuração `largeHeap: true` no `app.json` para permitir que o app utilize o limite máximo de heap alocado pelo sistema operacional Android.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Framework Mobile** | [React Native](https://reactnative.dev/) (v0.88.0) |
| **Plataforma / Runtime** | [Expo](https://expo.dev/) (SDK 58) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) |
| **Estilização** | React Native StyleSheet API (design system responsivo) |
| **Assets & Flags** | [FlagCDN](https://flagcdn.com/) (bandeiras SVG/PNG em alta resolução) |
| **Provedor de Dados** | ESPN Core & Site Summary APIs |
| **Build & Deploy** | EAS Build (Android APK) & GitHub Actions |

---

## 📁 Estrutura de Diretórios

```text
live-score/
├── .github/
│   └── workflows/
│       ├── build-apk.yml     # Pipeline de build automático do APK Android
│       └── deploy.yml        # Pipeline de deploy web e release
├── assets/                   # Ícones da aplicação, splash screen e favicon
├── src/
│   ├── components/
│   │   ├── CountryFlag.tsx        # Renderizador de bandeiras e continentes com fallback
│   │   ├── MatchCard.tsx          # Card individual de exibição do jogo na listagem
│   │   ├── MatchDetailModal.tsx   # Modal detalhado com Resumo, Stats, Escalações, etc.
│   │   └── TeamCrest.tsx          # Escudo do time com fallback para brasão e iniciais
│   ├── config/
│   │   └── api.ts                 # Configuração de URLs e polling interval
│   ├── screens/
│   │   └── HomeScreen.tsx         # Tela principal com listagem, filtros e abas
│   ├── services/
│   │   └── matchService.ts        # Serviço de ingestão, normalização, H2H e perfis
│   └── types/
│       └── match.ts               # Tipagem completa de partidas, estatísticas e escalações
├── app.json                  # Manifesto e configurações do Expo e Android
├── eas.json                  # Perfis de compilação do EAS Build (preview APK)
├── package.json              # Dependências e scripts do projeto
├── preview-android.html      # Emulador web/preview para testes de interface
└── tsconfig.json             # Configurações do compilador TypeScript
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (versão 18 ou superior recomendada)
- Gerenciador de pacotes **npm**

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/live-score.git
   cd live-score
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

4. **Execução por plataforma:**
   - **Navegador Web:** Pressione `w` no terminal ou execute `npm run web`.
   - **Dispositivo Físico:** Abra o aplicativo **Expo Go** no Android/iOS e escaneie o QR Code exibido no terminal.
   - **Emulador Android:** Pressione `a` no terminal (requer Android Studio com AVD configurado).

---

## 📦 Gerando o APK Android (Build de Produção / Preview)

O projeto está configurado para gerar APKs independentes (sem dependência do Expo Go) através do EAS Build:

1. **Instale a CLI do EAS (se ainda não possuir):**
   ```bash
   npm install -g eas-cli
   ```

2. **Faça login na sua conta Expo:**
   ```bash
   eas login
   ```

3. **Inicie a compilação do APK (perfil Preview):**
   ```bash
   eas build -p android --profile preview
   ```

O link para download do arquivo `.apk` pronto para instalação em qualquer dispositivo Android será gerado ao final do processo.

---

## 📄 Licença

Este projeto é desenvolvido para fins de estudo e uso pessoal. Todos os direitos sobre nomes de clubes, logotipos e dados estatísticos pertencem aos seus respectivos organizadores e titulares de direitos.

