import { AIMessage } from 'langchain';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';

function formatResultsForAnswer(results: any[] | undefined) {
  if (!results?.length) {
    return 'No results found for this query.';
  }

  const firstRow = results[0];
  const keys = Object.keys(firstRow ?? {});

  if (!keys.length) {
    return 'Query returned data successfully.';
  }

  const sampleValues = results
    .slice(0, 5)
    .map((row) => {
      const values = Object.values(row ?? {})
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value));

      return values.length ? values.join(' | ') : '—';
    })
    .join('; ');

  return `I found ${results.length} result(s). Details: ${sampleValues}`;
}

function buildFollowUpQuestions(question?: string) {
  const base = [
    'Would you like a breakdown by course?',
    'Would you like to compare this against other periods?',
    'Would you like more details by student or payment method?',
  ];

  if (!question) return base.slice(0, 2);

  const normalized = question.toLowerCase();

  if (normalized.includes('course')) {
    return [
      'Which course has the highest revenue?',
      'How do course sales compare by month?',
    ];
  }

  if (normalized.includes('student')) {
    return [
      'Which students are most engaged?',
      'Show me the students with the lowest progress.',
    ];
  }

  if (normalized.includes('payment')) {
    return [
      'Which payment method is most used?',
      'What is the revenue split by payment type?',
    ];
  }

  return base;
}

export function createAnalyticalResponseNode(llmClient: OpenRouterService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {
      const question = state.question ?? state.originalQuery ?? 'sales analysis';
      const baseAnswer = formatResultsForAnswer(state.dbResults ?? state.subResults?.flat() ?? undefined);

      const answer = `${baseAnswer} This response is based on the query: "${question}".`;

      return {
        ...state,
        answer,
        followUpQuestions: buildFollowUpQuestions(question),
        messages: [new AIMessage(answer)],
      };
    } catch (error: any) {
      console.error('Error generating analytical response:', error.message);
      return {
        ...state,
        error: `Response generation failed: ${error.message}`,
        answer: 'No answer generated',
        followUpQuestions: [],
      };
    }
  };
}
