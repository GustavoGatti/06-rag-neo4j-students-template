import { config } from '../../config.ts';
import { Neo4jService } from '../../services/neo4jService.ts';
import type { GraphState } from '../graph.ts';


async function executeCypherQuery(neo4jService: Neo4jService, query: string) {
  try {
    const isValid = await neo4jService.validateQuery(query);
    if (!isValid) {
      return {
        results: null,
        error: 'Query validation failed - syntax error or invalid structure',
      }
    }
    const results = await neo4jService.query(query);
    if (!results.length) {
      return {
        results: null,
        error: 'No results returned'
      }
    }
    console.log('Results retrieved successfully:');
    return {
      results,
      error: null
    };
  } catch (error: any) {
    console.error('Error executing Cypher query:', error instanceof Error ? error.message : error);
    return {
      results: null,
      error: error?.message ?? 'Unknown error occurred during query execution',
    };
  }

}

function hasMoreSteps(state: GraphState): boolean {
  if (!state.isMultiStep || !state.subQuestions?.length || state.currentStep === undefined) {
    return false;
  }
  return state.currentStep < state.subQuestions.length;
}

function handleMultiStepProgression(state: GraphState, results: any[]) {
  const updatedSubResults = [
    ...(state.subResults ?? []),
    results
  ];

  const nextStep = (state.currentStep ?? 0) + 1;
  const multiStepState = {
    dbResults: results,
    subResults: updatedSubResults,
    currentStep: nextStep,
    needsCorrection: false,
  }

  const totalSetps = state.subQuestions?.length ?? 0;
  console.log('Step completed successfully. Progressing to next step:', `Step ${nextStep}/${totalSetps}`);

  if (hasMoreSteps({ ...state, ...multiStepState })) {
    console.log(`Moving to next step ${nextStep}...`);
    return multiStepState;
  }
  console.log(`All ${totalSetps} steps completed successfully. Finalizing multi-step process...`);
  return multiStepState;
}


export function createCypherExecutorNode(neo4jService: Neo4jService) {

  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {

      const { results, error } = await executeCypherQuery(neo4jService, state.query!)
      if (error && results === null) {
        const nextAttempt = (state.correctionAttempts ?? 0) + 1;

        if (nextAttempt <= config.maxCorrectionAttempts) {
          console.log(`🔍 Will attempt to auto-correct query... Attempt ${nextAttempt}/${config.maxCorrectionAttempts}`);
          return {
            ...state,
            validationError: error,
            originalQuery: state.originalQuery ?? state.query,
            needsCorrection: true,
            correctionAttempts: nextAttempt,
          };
        }

        return {
          ...state,
          error: 'Invalid Cypher query - correction failed',
        };
      }


      if (state.isMultiStep && state.subQuestions?.length && state.currentStep !== undefined) {
        const multiStepState = handleMultiStepProgression(state, results!)
        return {
          ...multiStepState,
        }
      }

      if (!results?.length) {
        return {
          dbResults: [],
          error: 'No results found'
        }
      }

      return {
        ...state,
        dbResults: results,
        needsCorrection: false,
      };
    } catch (error) {
      console.error('Error executing Cypher query:', error instanceof Error ? error.message : error);

      return {
        ...state,
        error: 'Invalid Cypher query - correction failed',
      };
    }

  }
};

