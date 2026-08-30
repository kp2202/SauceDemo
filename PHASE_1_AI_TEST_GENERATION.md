# Phase 1: AI-Driven Test Generation

## Overview

Phase 1 integrates Large Language Models (LLMs) into your Playwright testing framework, enabling **natural language-driven test scenario generation**. This phase provides infrastructure for:

1. **Test Scenario Generation from Intent** - Generate test cases by describing what you want to test
2. **AI-Powered Failure Analysis** - Get intelligent suggestions on why tests fail
3. **Smart Selector Recommendations** - Get LLM-recommended stable CSS selectors
4. **Test Documentation** - Auto-generate human-readable test descriptions

## Architecture

### Components

```
framework/ai/
├── llm-service.ts           # LLM API integration (OpenAI, Claude)
├── ai-test-generator.ts     # Bridges LLM with test-assistant (hybrid approach)
├── test-assistant.ts        # Existing rule-based fallback functions
```

### Key Design Pattern: Graceful Degradation

All AI features fall back to rule-based implementations if:
- LLM API keys are not configured
- LLM service is unavailable
- API rate limits are exceeded
- Network issues occur

```typescript
if (LLMAvailable) {
  // Use AI-powered approach
} else {
  // Fall back to rule-based logic
}
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure LLM API Keys

Create a `.env` file in the project root:

```env
# Copy from .env.example
LLM_PROVIDER=openai
LLM_API_KEY=sk-...your-openai-key...
LLM_MODEL=gpt-4-turbo-preview
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000
```

**Supported Providers:**
- **OpenAI** (recommended for Phase 1)
  - Get API key: https://platform.openai.com/api-keys
  - Use model: `gpt-4-turbo-preview` or `gpt-4o`
  
- **Anthropic Claude** (coming in Phase 2)
  - Get API key: https://console.anthropic.com

### 3. Generate Tests from Natural Language

```bash
# Basic usage - generates to console
npm run ai:generate-tests -- --intent "user should be able to add items to cart and checkout"

# Save to file
npm run ai:generate-tests -- \
  --intent "user logs in and views inventory" \
  --page "SauceDemo" \
  --output "tests/generated.spec.ts"

# Verify generation in fallback mode (no LLM)
unset LLM_API_KEY  # Remove API key
npm run ai:generate-tests -- --intent "your intent"
```

### 4. Review and Complete Generated Tests

Generated tests are templates that require:
1. ✏️ Review the test structure
2. 🔧 Replace TODO comments with actual Playwright actions
3. ✔️ Add specific assertions
4. ▶️ Run and validate

Example generated output:
```typescript
test('checkout_flow', async ({ page, loginPage, inventoryPage, cartPage, checkoutPage, logger }) => {
  logger.info('🧪 Test: checkout_flow');
  
  // Steps:
  // - Login as a standard user on login page
  // - Add an item to the cart on inventory page
  // - Open the cart and proceed to checkout on cart page
  // - Fill customer information on checkout form
  
  // TODO: Implement the following steps using page objects and Playwright actions
  // Example:
  // await loginPage.goto();
  // await loginPage.login('standard_user', 'secret_sauce');
  
  // Assertions:
  // - cart badge shows 1
  // - checkout step loads
  // - order confirmation appears
});
```

## Usage Examples

### Example 1: Generate E2E Flow Test

```bash
npm run ai:generate-tests -- \
  --intent "user completes a purchase with 3 items" \
  --page "SauceDemo" \
  --output "tests/e2e.purchase.spec.ts"
```

**Generated Scenario:**
- Steps: Login → Add items → Checkout → Payment
- Assertions: Cart count, order confirmation, success message

### Example 2: Generate Login Validation Test

```bash
npm run ai:generate-tests -- \
  --intent "verify login fails with invalid credentials" \
  --page "LoginPage" \
  --output "tests/login.validation.spec.ts"
```

### Example 3: Fallback Mode (No LLM)

```bash
# Remove LLM_API_KEY from .env or environment
npm run ai:generate-tests -- --intent "user can add items to cart"

# Generates using rule-based logic (no LLM call)
```

## API Reference

### `AITestGenerator` Class

```typescript
import { AITestGenerator, createAITestGeneratorFromEnv } from './framework/ai/ai-test-generator';

// Auto-initialize from environment
const generator = await createAITestGeneratorFromEnv();

// Generate test scenarios
const scenarios = await generator.generateTestScenarios(
  'user should login and view inventory',
  'SauceDemo'
);

// Get status
const status = generator.getStatus();
// { llmAvailable: true, fallbackMode: false, message: "✅ AI Test Generator ready with LLM support" }
```

### `LLMService` Class

```typescript
import { LLMService } from './framework/ai/llm-service';

const llmService = new LLMService({
  provider: 'openai',
  apiKey: process.env.LLM_API_KEY,
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 2000,
});

// Generate scenarios
const scenarios = await llmService.generateTestScenarios({
  intent: 'user adds items to cart',
  pageContext: 'SauceDemo',
});

// Analyze failure
const analysis = await llmService.analyzeTestFailure(
  'test_name',
  'Element not found: button[type="submit"]',
  'test code here'
);

// Get selector recommendation
const recommendation = await llmService.recommendOptimalSelector(
  'Login button on checkout page',
  '<button>Checkout</button>',
  'CheckoutPage'
);
```

## Integration with Existing Test Suite

### Current Test Files

Existing tests continue to work unchanged:
- `tests/login.spec.ts` - Existing manual tests
- `tests/cart.checkout.spec.ts` - Existing manual tests
- `tests/ai.spec.ts` - Unit tests for AI functions
- `tests/ai.failure.demo.spec.ts` - Failure demo

### Adding AI-Generated Tests

1. Generate a new test file:
   ```bash
   npm run ai:generate-tests -- --intent "..." --output "tests/generated.new-flow.spec.ts"
   ```

2. Complete the test implementation (replace TODOs)

3. Run all tests:
   ```bash
   npm test
   ```

## Best Practices

### ✅ Do

- **Be specific in intent**: "user adds 2 items to cart and completes checkout" (good) vs "test checkout" (vague)
- **Specify page context**: Use `--page "CheckoutPage"` for better targeting
- **Review generated code**: Always review AI output before using in CI/CD
- **Validate with fallback**: Test with `LLM_API_KEY` unset to ensure fallback works
- **Keep intents focused**: One logical flow per intent
- **Add detailed assertions**: Replace TODO comments with specific Playwright assertions

### ❌ Don't

- **Don't rely on AI alone**: Generated tests are templates requiring developer review
- **Don't ignore fallback mode**: Always test with LLM unavailable
- **Don't use generic intents**: "test everything" will produce generic tests
- **Don't skip error handling**: Add `try/catch` around AI operations in production
- **Don't hardcode API keys**: Use `.env` files and environment variables

## Troubleshooting

### Issue: "LLM_API_KEY environment variable is required"

**Solution:** Set your API key in `.env`:
```env
LLM_API_KEY=sk-your-openai-key
```

### Issue: "Failed to extract JSON from LLM response"

**Solution:** LLM returned invalid JSON. Try:
1. Check LLM_MODEL is correct (use `gpt-4-turbo-preview`)
2. Lower LLM_TEMPERATURE to 0.3
3. Simplify your intent description

### Issue: "Test generation takes too long"

**Solution:** LLM API latency. Try:
1. Check network connection
2. Reduce LLM_MAX_TOKENS to 1500
3. Use faster model (e.g., `gpt-4o` instead of `gpt-4-turbo-preview`)

### Issue: Fallback mode producing generic tests

**Solution:** This is expected. Fallback uses rule-based logic. For better results:
1. Set LLM_API_KEY and use LLM
2. Provide more specific intent
3. Specify `--page` context

## Future Work (Phase 2+)

- [ ] Support for Anthropic Claude as LLM provider
- [ ] Test code execution and validation
- [ ] Intelligent retry strategies based on flaky pattern detection
- [ ] Feature flag-aware test generation
- [ ] Multi-language support (Portuguese, Spanish, French, etc.)
- [ ] Dashboard for test generation history and metrics
- [ ] Integration with GitHub Issues for auto-test-generation

## References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Playwright Documentation](https://playwright.dev)
- [LangChain Documentation](https://js.langchain.com)
- Framework AI Assistant: [test-assistant.ts](../framework/ai/test-assistant.ts)
