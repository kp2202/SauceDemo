/**
 * LLM Service Module (Phase 1: AI-Driven Test Generation)
 * Handles integration with OpenAI GPT-4 and Anthropic Claude APIs
 * Provides utilities for test scenario generation from natural language intent
 */

import OpenAI from 'openai';

export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TestScenarioPrompt {
  intent: string;
  pageContext: string;
  existingTests?: string;
}

export interface GeneratedTestScenario {
  testName: string;
  description: string;
  steps: string[];
  assertions: string[];
  testCode?: string;
}

export class LLMService {
  private config: LLMConfig;
  private client: OpenAI | null = null;

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    };

    if (this.config.provider === 'openai') {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
      });
    }
  }

  /**
   * Generate test scenarios from natural language intent
   * Leverages LLM to create structured test cases
   */
  async generateTestScenarios(prompt: TestScenarioPrompt): Promise<GeneratedTestScenario[]> {
    if (!this.client) {
      throw new Error('LLM client not initialized');
    }

    const systemPrompt = `You are an expert Playwright test automation engineer.
You generate comprehensive, maintainable test scenarios from natural language intent.
Always produce structured JSON output with test name, description, steps, assertions, and TypeScript code.
Follow Page Object Model patterns and use Playwright best practices.
Make tests independent, idempotent, and fast.`;

    const userPrompt = `
Context:
- Page being tested: ${prompt.pageContext}
- User intent: ${prompt.intent}
${prompt.existingTests ? `- Existing tests for reference:\n${prompt.existingTests}` : ''}

Generate a test scenario that:
1. Clearly matches the user's intent
2. Follows Playwright and Page Object Model best practices
3. Includes multiple assertions
4. Is independent and can run in isolation
5. Uses descriptive names and clear steps

Respond ONLY with valid JSON in this format (no markdown, no extra text):
{
  "scenarios": [
    {
      "testName": "string",
      "description": "string",
      "steps": ["string"],
      "assertions": ["string"],
      "testCode": "string (TypeScript Playwright code)"
    }
  ]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Failed to extract JSON from LLM response: ${content}`);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.scenarios || [];
    } catch (error) {
      console.error('Error generating test scenarios:', error);
      throw error;
    }
  }

  /**
   * Analyze test failure and suggest improvements
   * Uses LLM to generate root cause analysis and actionable recommendations
   */
  async analyzeTestFailure(
    testName: string,
    errorMessage: string,
    testCode: string,
    screenShotPath?: string
  ): Promise<{
    rootCause: string;
    suggestions: string[];
    fixedCode?: string;
  }> {
    if (!this.client) {
      throw new Error('LLM client not initialized');
    }

    const userPrompt = `
Test Name: ${testName}
Error: ${errorMessage}

Test Code:
\`\`\`typescript
${testCode}
\`\`\`

Analyze why this test failed and provide:
1. Root cause analysis
2. 3-5 actionable suggestions to fix it
3. Fixed test code if applicable

Respond ONLY with valid JSON (no markdown):
{
  "rootCause": "string",
  "suggestions": ["string"],
  "fixedCode": "string (optional)"
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.3, // Lower temperature for analysis
        max_tokens: this.config.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Failed to extract JSON from analysis response: ${content}`);
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing test failure:', error);
      throw error;
    }
  }

  /**
   * Generate optimal CSS selectors using LLM reasoning
   * Considers DOM structure, stability, and maintainability
   */
  async recommendOptimalSelector(
    elementDescription: string,
    domSnippet: string,
    pageContext: string
  ): Promise<{
    selector: string;
    rationale: string;
    alternatives: string[];
  }> {
    if (!this.client) {
      throw new Error('LLM client not initialized');
    }

    const userPrompt = `
Page: ${pageContext}
Target Element: ${elementDescription}

DOM Context:
\`\`\`html
${domSnippet}
\`\`\`

Recommend the MOST STABLE CSS selector for this element. Consider:
- Uniqueness
- Resistance to layout changes
- Clarity and maintainability
- Avoid data attributes that might change

Respond ONLY with valid JSON:
{
  "selector": "string (best CSS selector)",
  "rationale": "string (why this is optimal)",
  "alternatives": ["string (2-3 backup selectors)"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.2, // Low temperature for deterministic output
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Failed to extract JSON from selector recommendation: ${content}`);
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error recommending selector:', error);
      throw error;
    }
  }

  /**
   * Generate test documentation from test code
   * Creates human-readable descriptions for test reports
   */
  async generateTestDocumentation(testCode: string): Promise<{
    title: string;
    description: string;
    steps: string[];
  }> {
    if (!this.client) {
      throw new Error('LLM client not initialized');
    }

    const userPrompt = `
Analyze this Playwright test and generate clear documentation:

\`\`\`typescript
${testCode}
\`\`\`

Create documentation with:
1. Clear test title
2. High-level description of what the test validates
3. Step-by-step breakdown of what the test does

Respond ONLY with valid JSON:
{
  "title": "string",
  "description": "string",
  "steps": ["string"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Failed to extract JSON from documentation generation: ${content}`);
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating documentation:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create LLMService from environment variables
 */
export function createLLMServiceFromEnv(): LLMService {
  const provider = (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'anthropic';
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'gpt-4-turbo-preview';
  const temperature = process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : 0.7;
  const maxTokens = process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS, 10) : 2000;

  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable is required');
  }

  return new LLMService({
    provider,
    apiKey,
    model,
    temperature,
    maxTokens,
  });
}
