/**
 * AI Test Generator (Phase 1: Integration Point)
 * Bridges LLM service with test-assistant functions
 * Provides both AI-powered and fallback implementations
 */

import { LLMService, GeneratedTestScenario, TestScenarioPrompt } from './llm-service';
import * as testAssistant from './test-assistant';

export interface AITestGeneratorConfig {
  useLLM: boolean; // Fall back to rule-based if LLM unavailable
  llmService?: LLMService;
}

export class AITestGenerator {
  private config: AITestGeneratorConfig;
  private llmAvailable: boolean = false;

  constructor(config: AITestGeneratorConfig) {
    this.config = config;
    this.llmAvailable = config.useLLM && !!config.llmService;
  }

  /**
   * Generate test scenarios from intent (AI-powered or fallback)
   */
  async generateTestScenarios(
    intent: string,
    pageContext: string = 'SauceDemo'
  ): Promise<GeneratedTestScenario[]> {
    if (this.llmAvailable && this.config.llmService) {
      try {
        console.log('🤖 Generating test scenarios with AI (LLM)...');
        return await this.config.llmService.generateTestScenarios({
          intent,
          pageContext,
        });
      } catch (error) {
        console.warn('⚠️ LLM generation failed, falling back to rule-based approach:', error);
        return this.generateTestScenariosWithRules(intent);
      }
    }

    return this.generateTestScenariosWithRules(intent);
  }

  /**
   * Rule-based test scenario generation (fallback)
   */
  private generateTestScenariosWithRules(intent: string): GeneratedTestScenario[] {
    const scenario = testAssistant.generateScenarioFromIntent(intent);

    return [
      {
        testName: scenario.title.replace(/\s+/g, '_').toLowerCase(),
        description: scenario.title,
        steps: scenario.steps.map((step) => `${step.action} on ${step.target}`),
        assertions: scenario.assertions,
        testCode: this.generateTestCode(scenario.title, scenario.steps, scenario.assertions),
      },
    ];
  }

  /**
   * Generate TypeScript Playwright test code
   */
  private generateTestCode(title: string, steps: testAssistant.ScenarioStep[], assertions: string[]): string {
    const testName = title.replace(/\s+/g, '_').toLowerCase();

    let stepsCode = steps
      .map((step) => `  // ${step.action} on ${step.target}`)
      .join('\n');

    let assertionsCode = assertions
      .map((assertion) => `  // expect: ${assertion}`)
      .join('\n');

    return `test('${testName}', async ({ page, loginPage, inventoryPage, cartPage, checkoutPage, logger }) => {
${stepsCode}
  // TODO: Replace comments with actual Playwright actions

${assertionsCode}
  // TODO: Replace comments with actual expect() assertions
});`;
  }

  /**
   * Analyze test failure with AI assistance
   */
  async analyzeFailure(
    testName: string,
    error: string,
    testCode?: string,
    pageName?: string
  ): Promise<testAssistant.FailureSummary> {
    if (this.llmAvailable && this.config.llmService && testCode) {
      try {
        console.log('🤖 Analyzing failure with AI...');
        const analysis = await this.config.llmService.analyzeTestFailure(testName, error, testCode);
        return {
          rootCause: analysis.rootCause,
          action: analysis.suggestions?.[0] || 'Review test code',
          buildAware: 'AI analysis completed',
        };
      } catch (error) {
        console.warn('⚠️ AI failure analysis failed, using rule-based approach:', error);
      }
    }

    // Fallback to rule-based analysis
    return testAssistant.summarizeFailure({
      testName,
      error,
      pageName: pageName || 'unknown',
    });
  }

  /**
   * Get locator recommendation with AI assistance
   */
  async recommendLocator(
    intent: string,
    pageName: string,
    failedSelector: string,
    fallbackSelectors?: string[]
  ): Promise<testAssistant.LocatorRecommendation> {
    if (this.llmAvailable && this.config.llmService) {
      try {
        console.log('🤖 Recommending selector with AI...');
        const recommendation = await this.config.llmService.recommendOptimalSelector(
          intent,
          `<selector attempt="${failedSelector}">...</selector>`,
          pageName
        );
        return {
          primary: recommendation.selector,
          reason: recommendation.rationale,
          alternatives: recommendation.alternatives,
        };
      } catch (error) {
        console.warn('⚠️ AI selector recommendation failed, using rule-based approach:', error);
      }
    }

    // Fallback to rule-based recommendation
    return testAssistant.recommendLocator({
      intent,
      pageName,
      failedSelector,
      fallbackSelectors,
    });
  }

  /**
   * Check if LLM is available
   */
  isLLMAvailable(): boolean {
    return this.llmAvailable;
  }

  /**
   * Get status information
   */
  getStatus(): {
    llmAvailable: boolean;
    fallbackMode: boolean;
    message: string;
  } {
    return {
      llmAvailable: this.llmAvailable,
      fallbackMode: !this.llmAvailable,
      message: this.llmAvailable
        ? '✅ AI Test Generator ready with LLM support'
        : '⚠️ AI Test Generator running in fallback mode (rule-based)',
    };
  }
}

/**
 * Factory function to create AITestGenerator with auto-initialization
 */
export async function createAITestGeneratorFromEnv(): Promise<AITestGenerator> {
  const useLLM = process.env.LLM_API_KEY ? true : false;
  let llmService: LLMService | undefined;

  if (useLLM) {
    try {
      const { createLLMServiceFromEnv } = await import('./llm-service');
      llmService = createLLMServiceFromEnv();
      console.log('✅ LLM Service initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize LLM service:', error);
    }
  }

  return new AITestGenerator({
    useLLM,
    llmService,
  });
}
