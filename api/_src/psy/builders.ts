/**
 * Builders puros para rows que escrevem em tabelas psy_*.
 *
 * Objectivo: centralizar a construção de rows críticas para o anonimato.
 * Qualquer adição de chave a estes objectos exige justificação e revisão
 * de segurança. Os testes em anonimato.test.ts validam que estas funções
 * NUNCA devolvem chaves de identidade (tokenId, email, ip, userAgent, etc.).
 */
import cuid from "cuid"

export type PsyResponseRow = {
  id: string
  campaignId: string
  areaId: string
  instrumentVersao: string
}

/**
 * Constrói a row de psy_responses. INVARIANTE A1 (anonimato):
 *   - SÓ os 4 campos acima.
 *   - NUNCA tokenId, dispatchTokenId, userId, traineeId, trainerId, email,
 *     nome, ip, userAgent, ou qualquer outro identificador.
 *
 * `submetidoEm` é deixado ao default da BD (now() truncado pelo trigger
 * da v11 a date_trunc('hour', ...)).
 */
export function buildPsyResponseRow(opts: {
  campaignId: string
  areaId: string
  instrumentVersao: string
}): PsyResponseRow {
  return {
    id: cuid(),
    campaignId: opts.campaignId,
    areaId: opts.areaId,
    instrumentVersao: opts.instrumentVersao,
  }
}

export type PsyAnswerRow = {
  id: string
  responseId: string
  questionId: string
  valor: number
}

/**
 * Constrói as rows de psy_answers para um conjunto de respostas. Aceita
 * `responseId` (já criado em psy_responses) + lista de respostas.
 * Valida em runtime que `valor` é inteiro 1..5.
 */
export function buildPsyAnswerRows(
  responseId: string,
  answers: Array<{ questionId: string; valor: number }>
): PsyAnswerRow[] {
  return answers.map((a) => {
    if (!Number.isInteger(a.valor) || a.valor < 1 || a.valor > 5) {
      throw new Error(
        `buildPsyAnswerRows: valor inválido para questionId=${a.questionId}: ${a.valor} (esperado inteiro 1..5)`
      )
    }
    return {
      id: cuid(),
      responseId,
      questionId: a.questionId,
      valor: a.valor,
    }
  })
}
