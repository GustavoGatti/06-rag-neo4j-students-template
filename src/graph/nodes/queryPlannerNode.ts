import { QueryAnalysisSchema, getSystemPrompt, getUserPromptTemplate } from '../../prompts/v1/queryAnalyzer.ts';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';

export function createQueryPlannerNode(llmClient: OpenRouterService) {

  return async (state: GraphState): Promise<Partial<GraphState>> => {

    try {

      const systemPrompt = getSystemPrompt();
      const userPrompt = getUserPromptTemplate(state.question!);
      const { data, error} = await llmClient.generateStructured(systemPrompt, userPrompt, QueryAnalysisSchema);

      if(error) {
        console.error('❌ Error analyzing query:', error);
        return {
          ...state,
          isMultiStep: true,
        };
      }

      if(data?.requiresDecomposition && !!data.subQuestions?.length) {

        const subQuestionsFormmatted = data.subQuestions.map((q:string, i:number) => `\n   ${i + 1}. ${q}`)
        .join('');

        console.log(`📝 Query requires decomposition into ${data.subQuestions.length} sub-questions:${subQuestionsFormmatted}`);

        return {
          isMultiStep: true,
          subQuestions: data.subQuestions,
          currentStep: 0,
          subQueries:[],
          subResults: []
        };
      }

      return {
        ...state,
      };
    } catch (error: any) {
      console.error('❌ Error analyzing query:', error.message);
      return {
        ...state,
        isMultiStep: false,
      };
    }
  }
}
