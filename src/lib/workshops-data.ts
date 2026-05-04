/**
 * Curriculum dataset for the Saúde Mental & Bem-Estar workshops landing.
 * 9 thematic blocks · 40 workshops · 1h each (mix-and-match programmes).
 */

import {
  Brain,
  Heart,
  Activity,
  Moon,
  Apple,
  Footprints,
  Users,
  Home,
  Target,
  type LucideIcon,
} from "lucide-react";

export type Workshop = {
  code: string;
  title: string;
  objective: string;
  format: "Presencial" | "Online" | "Híbrido";
};

export type WorkshopBlock = {
  number: number;
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "navy" | "gold" | "emerald" | "blue" | "purple" | "rose" | "amber";
  workshops: Workshop[];
};

export const WORKSHOP_BLOCKS: WorkshopBlock[] = [
  {
    number: 1,
    slug: "autoconhecimento-mindfulness",
    title: "Autoconhecimento & Mindfulness",
    description:
      "Reconhecer pensamentos automáticos, observar emoções sem reagir e construir uma prática quotidiana de presença.",
    icon: Brain,
    accent: "navy",
    workshops: [
      {
        code: "B1.W1",
        title: "Mindfulness para iniciantes",
        objective:
          "Aprender a respiração consciente como ferramenta de regulação imediata.",
        format: "Presencial",
      },
      {
        code: "B1.W2",
        title: "Atenção plena no trabalho",
        objective:
          "Aplicar mindfulness em reuniões, deadlines e momentos de pressão.",
        format: "Híbrido",
      },
      {
        code: "B1.W3",
        title: "Auto-observação e diário emocional",
        objective:
          "Estabelecer um ritual de 5 minutos para mapear estados emocionais.",
        format: "Online",
      },
      {
        code: "B1.W4",
        title: "Meditação no quotidiano",
        objective:
          "Integrar 10 minutos diários de prática meditativa sem fricção.",
        format: "Presencial",
      },
      {
        code: "B1.W5",
        title: "Mindfulness em equipa",
        objective:
          "Iniciar reuniões com práticas curtas de presença coletiva.",
        format: "Presencial",
      },
    ],
  },
  {
    number: 2,
    slug: "gestao-emocional",
    title: "Gestão Emocional",
    description:
      "Reconhecer, nomear e regular emoções intensas — base para conversas difíceis e decisões equilibradas.",
    icon: Heart,
    accent: "rose",
    workshops: [
      {
        code: "B2.W1",
        title: "Inteligência emocional · fundamentos",
        objective:
          "Modelo das 5 competências de Goleman aplicado ao contexto laboral.",
        format: "Presencial",
      },
      {
        code: "B2.W2",
        title: "Reconhecer emoções no trabalho",
        objective:
          "Treinar o vocabulário emocional para distinguir frustração, raiva e medo.",
        format: "Híbrido",
      },
      {
        code: "B2.W3",
        title: "Comunicação não-violenta",
        objective:
          "Aplicar o modelo OSBD (Observação · Sentimento · Necessidade · Pedido).",
        format: "Presencial",
      },
      {
        code: "B2.W4",
        title: "Conversas difíceis com calma",
        objective:
          "Conduzir feedback sensível sem perder firmeza nem empatia.",
        format: "Presencial",
      },
      {
        code: "B2.W5",
        title: "Regulação de emoções intensas",
        objective:
          "Técnicas de grounding e janela de tolerância para momentos críticos.",
        format: "Híbrido",
      },
    ],
  },
  {
    number: 3,
    slug: "stress-burnout",
    title: "Stress & Prevenção de Burnout",
    description:
      "Diagnóstico do stress crónico, mapeamento de fatores de risco e construção de planos individuais de recuperação.",
    icon: Activity,
    accent: "amber",
    workshops: [
      {
        code: "B3.W1",
        title: "Gestão de stress crónico",
        objective:
          "Distinguir stress agudo, crónico e tóxico no posto de trabalho.",
        format: "Presencial",
      },
      {
        code: "B3.W2",
        title: "Prevenção de burnout",
        objective:
          "Identificar os 12 estágios de Freudenberger antes do colapso.",
        format: "Híbrido",
      },
      {
        code: "B3.W3",
        title: "Recuperação após colapso",
        objective:
          "Plano de regresso ao trabalho gradual, com marcos de progresso.",
        format: "Presencial",
      },
      {
        code: "B3.W4",
        title: "Resiliência psicológica",
        objective:
          "Construir tolerância à adversidade através de hábitos sustentáveis.",
        format: "Online",
      },
      {
        code: "B3.W5",
        title: "Stress operacional & turnos",
        objective:
          "Workshop dirigido a equipas em ambientes de alta pressão (logística, saúde, retalho).",
        format: "Presencial",
      },
    ],
  },
  {
    number: 4,
    slug: "sono-energia",
    title: "Sono & Energia Cognitiva",
    description:
      "Otimizar a qualidade do sono e gerir a curva de energia diária para sustentar foco e decisões críticas.",
    icon: Moon,
    accent: "blue",
    workshops: [
      {
        code: "B4.W1",
        title: "Higiene do sono",
        objective:
          "Protocolo de 7 dias para recuperar a qualidade do sono profundo.",
        format: "Online",
      },
      {
        code: "B4.W2",
        title: "Recuperação cognitiva",
        objective:
          "Estratégias para recuperar foco após picos de carga mental.",
        format: "Presencial",
      },
      {
        code: "B4.W3",
        title: "Energia mental sustentada",
        objective:
          "Mapear e proteger as 3-4 horas mais produtivas do dia.",
        format: "Híbrido",
      },
      {
        code: "B4.W4",
        title: "Pausas conscientes",
        objective:
          "Implementar micro-pausas (5 min cada 90 min) baseadas em ciclos ultradianos.",
        format: "Presencial",
      },
    ],
  },
  {
    number: 5,
    slug: "nutricao-performance",
    title: "Nutrição & Performance",
    description:
      "Comer para a tarefa: relação direta entre alimentação, hidratação e desempenho cognitivo.",
    icon: Apple,
    accent: "emerald",
    workshops: [
      {
        code: "B5.W1",
        title: "Nutrição funcional no trabalho",
        objective:
          "Construir refeições que sustentam glicémia estável durante reuniões longas.",
        format: "Presencial",
      },
      {
        code: "B5.W2",
        title: "Hidratação cognitiva",
        objective:
          "Quantificar o impacto da desidratação no foco e na tomada de decisão.",
        format: "Online",
      },
      {
        code: "B5.W3",
        title: "Suplementação responsável",
        objective:
          "Distinguir suplementos com evidência clínica vs. modas de marketing.",
        format: "Presencial",
      },
      {
        code: "B5.W4",
        title: "Comida e produtividade",
        objective:
          "Workshop hands-on de planeamento alimentar para semanas exigentes.",
        format: "Híbrido",
      },
    ],
  },
  {
    number: 6,
    slug: "movimento-postura",
    title: "Movimento & Postura",
    description:
      "Combater o sedentarismo, prevenir lesões músculo-esqueléticas e reativar o corpo no posto de trabalho.",
    icon: Footprints,
    accent: "purple",
    workshops: [
      {
        code: "B6.W1",
        title: "Postura no escritório",
        objective:
          "Avaliação ergonómica individual e correção de hábitos de sentar.",
        format: "Presencial",
      },
      {
        code: "B6.W2",
        title: "Pausas de movimento",
        objective:
          "Sequência de 4 minutos para reativar o corpo a cada 2 horas.",
        format: "Híbrido",
      },
      {
        code: "B6.W3",
        title: "Mobilidade e flexibilidade",
        objective:
          "Rotinas curtas para libertar a tensão da zona cervico-lombar.",
        format: "Presencial",
      },
      {
        code: "B6.W4",
        title: "Caminhar consciente",
        objective:
          "Reuniões caminhando: produtividade, criatividade e saúde combinadas.",
        format: "Presencial",
      },
    ],
  },
  {
    number: 7,
    slug: "relacoes-pertenca",
    title: "Relações & Pertença",
    description:
      "Construir uma cultura de cuidado: confiança, vulnerabilidade saudável e sentido de pertença na equipa.",
    icon: Users,
    accent: "blue",
    workshops: [
      {
        code: "B7.W1",
        title: "Conexão social no trabalho",
        objective:
          "Rituais simples para fortalecer relações em equipas remotas e híbridas.",
        format: "Híbrido",
      },
      {
        code: "B7.W2",
        title: "Confiança em equipa",
        objective:
          "Modelo de Lencioni aplicado ao quotidiano da liderança.",
        format: "Presencial",
      },
      {
        code: "B7.W3",
        title: "Conflitos saudáveis",
        objective:
          "Transformar tensão em diálogo produtivo sem evitar o desconforto.",
        format: "Presencial",
      },
      {
        code: "B7.W4",
        title: "Pertença e propósito coletivo",
        objective:
          "Construir narrativas partilhadas que dão significado à missão.",
        format: "Híbrido",
      },
    ],
  },
  {
    number: 8,
    slug: "vida-pessoal-familiar",
    title: "Vida Pessoal & Familiar",
    description:
      "Reduzir a carga invisível: integração trabalho-família e apoio em momentos sensíveis da vida adulta.",
    icon: Home,
    accent: "rose",
    workshops: [
      {
        code: "B8.W1",
        title: "Equilíbrio trabalho-família",
        objective:
          "Desenhar fronteiras práticas entre o profissional e o pessoal.",
        format: "Online",
      },
      {
        code: "B8.W2",
        title: "Maternidade/paternidade ativas",
        objective:
          "Apoio à transição para a parentalidade e regresso ao trabalho.",
        format: "Híbrido",
      },
      {
        code: "B8.W3",
        title: "Comunicação em casal",
        objective:
          "Conversas difíceis em casa com as mesmas competências do trabalho.",
        format: "Presencial",
      },
      {
        code: "B8.W4",
        title: "Saúde sexual & bem-estar",
        objective:
          "Workshop adulto, com base científica, sobre intimidade e energia.",
        format: "Presencial",
      },
    ],
  },
  {
    number: 9,
    slug: "sentido-proposito",
    title: "Sentido & Propósito",
    description:
      "Encontrar e sustentar uma narrativa pessoal que dê significado ao trabalho — antídoto estrutural ao burnout.",
    icon: Target,
    accent: "gold",
    workshops: [
      {
        code: "B9.W1",
        title: "Encontrar sentido no trabalho",
        objective:
          "Mapear a interseção entre talentos, valores e necessidade do mundo.",
        format: "Presencial",
      },
      {
        code: "B9.W2",
        title: "Carreira & propósito",
        objective:
          "Plano de desenvolvimento profissional alinhado com sentido pessoal.",
        format: "Híbrido",
      },
      {
        code: "B9.W3",
        title: "Trabalho como vocação",
        objective:
          "Workshop reflexivo sobre o conceito de vocação na cultura contemporânea.",
        format: "Online",
      },
      {
        code: "B9.W4",
        title: "Reflexão e diário pessoal",
        objective:
          "Estrutura de journaling semanal para amadurecer aprendizagens.",
        format: "Online",
      },
      {
        code: "B9.W5",
        title: "Workshop integrador final",
        objective:
          "Sessão de fecho do programa: plano pessoal de bem-estar para os próximos 6 meses.",
        format: "Presencial",
      },
    ],
  },
];

export const WORKSHOP_TOTALS = {
  blocks: WORKSHOP_BLOCKS.length,
  workshops: WORKSHOP_BLOCKS.reduce((acc, b) => acc + b.workshops.length, 0),
  hours: WORKSHOP_BLOCKS.reduce((acc, b) => acc + b.workshops.length, 0), // 1h each
};

export const WORKSHOP_PROGRAMMES = [
  {
    name: "Pacote Essencial",
    description: "4 workshops · selecione 1 por área crítica",
    investmentPerPerson: 320,
    durationLabel: "4h totais",
    bestFor: "Equipas que iniciam programas de bem-estar.",
    blocks: 4,
  },
  {
    name: "Programa Integrado",
    description: "12 workshops · 3 blocos completos à escolha",
    investmentPerPerson: 890,
    durationLabel: "12h totais",
    bestFor: "Empresas com NR1 a cumprir e equipas operacionais.",
    blocks: 12,
    isFeatured: true,
  },
  {
    name: "Curriculum Completo",
    description: "40 workshops · 9 blocos integrados durante 6 meses",
    investmentPerPerson: 2400,
    durationLabel: "40h totais",
    bestFor: "Empresas com cultura de cuidado madura ou que querem destacar-se no setor.",
    blocks: 40,
  },
];
