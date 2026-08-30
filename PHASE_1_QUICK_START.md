# 🚀 Phase 1 Quick Start Guide

## 30-Second Setup

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add your OpenAI API key to .env
# LLM_API_KEY=sk-your-key-here

# 3. Install dependencies (already done)
# npm install

# 4. Generate your first test
npm run ai:generate-tests -- --intent "user logs in and views products"
```

## Your First AI-Generated Test

### Command
```bash
npm run ai:generate-tests -- \
  --intent "user can add 2 items to cart and proceed to checkout" \
  --output "tests/generated.my-first-test.spec.ts"
```

### What Happens
1. ✅ CLI reads your intent
2. ✅ Sends to OpenAI GPT-4 API
3. ✅ LLM generates test scenarios
4. ✅ Writes complete test file
5. ✅ Prints success message

### Expected Output
```
🚀 AI Test Generator
══════════════════════════════════════════════════
Intent: user can add 2 items to cart and proceed to checkout
Page Context: SauceDemo
Output: tests/generated.my-first-test.spec.ts
══════════════════════════════════════════════════

✅ LLM Service initialized
⏳ Generating test scenarios...

✅ Generated 1 test scenario(s)

📋 Scenario 1: user_can_add_2_items_to_cart_and_proceed_to_checkout
   Description: User adds 2 items to cart and proceeds to checkout
   Steps: 4
     1. Login to the application
     2. Browse inventory and select 2 items
     3. Add selected items to shopping cart
     4. Proceed to checkout
   Assertions: 3
     • Cart contains 2 items
     • Checkout page loads
     • Cart total is calculated correctly

📝 Test file written to: tests/generated.my-first-test.spec.ts

🎉 Next steps:
   1. Review the generated tests: tests/generated.my-first-test.spec.ts
   2. Install dependencies: npm install
   3. Run tests: npm test
```

### Review Generated Test
```typescript
// tests/generated.my-first-test.spec.ts

test('user_can_add_2_items_to_cart_and_proceed_to_checkout', async ({ page, loginPage, inventoryPage, cartPage, checkoutPage, logger }) => {
  logger.info('🧪 Test: user_can_add_2_items_to_cart_and_proceed_to_checkout');
  logger.info('📝 Description: User adds 2 items to cart and proceeds to checkout');

  // Steps:
  // - Login to the application on login page
  // - Browse inventory and select 2 items on inventory page
  // - Add selected items to shopping cart on cart page
  // - Proceed to checkout on checkout page

  // TODO: Implement the following steps using page objects and Playwright actions
  // Example:
  // await loginPage.goto();
  // await loginPage.login('standard_user', 'secret_sauce');
  // await inventoryPage.addItem('Sauce Labs Backpack');
  // await inventoryPage.addItem('Sauce Labs Bike Light');
  
  // Assertions:
  // - Cart contains 2 items
  // - Checkout page loads
  // - Cart total is calculated correctly

  // TODO: Replace with actual expect() assertions
  // Example:
  // await expect(page.locator('[data-test="cart-badge"]')).toContainText('2');
  // await expect(page.locator('.checkout-button')).toBeVisible();
});
```

### Complete the Test
Replace TODO comments with actual code:

```typescript
test('user_can_add_2_items_to_cart_and_proceed_to_checkout', async ({ loginPage, inventoryPage, cartPage, logger }) => {
  logger.info('🧪 Adding items to cart');
  
  // Step 1: Login
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');
  
  // Step 2: Browse and select items
  await inventoryPage.addItem('Sauce Labs Backpack');
  await inventoryPage.addItem('Sauce Labs Bike Light');
  
  // Step 3: Verify cart count
  await expect(page.locator('[data-test="cart-badge"]')).toContainText('2');
  
  // Step 4: Proceed to checkout
  await cartPage.goto();
  await cartPage.checkout();
  
  // Assertions
  await expect(page).toHaveTitle(/Checkout/);
  await expect(page.locator('[data-test="checkout-button"]')).toBeVisible();
});
```

### Run the Test
```bash
npm test
```

---

## Common Commands

### Generate and Save Test
```bash
npm run ai:generate-tests -- \
  --intent "user can complete purchase flow" \
  --output "tests/generated.purchase.spec.ts"
```

### Generate for Specific Page
```bash
npm run ai:generate-tests -- \
  --intent "verify all products are displayed with prices" \
  --page "InventoryPage" \
  --output "tests/generated.inventory.spec.ts"
```

### Preview Before Saving
```bash
npm run ai:generate-tests -- --intent "user logout functionality"
# Prints to console, doesn't save file
```

### Test Fallback Mode (No LLM)
```bash
# Remove API key from environment
unset LLM_API_KEY

# Still generates test, using rule-based logic
npm run ai:generate-tests -- --intent "test login"
```

---

## Troubleshooting

### ❌ "LLM_API_KEY environment variable is required"
**Fix**: Add to `.env` file:
```env
LLM_API_KEY=sk-your-openai-api-key
```

### ❌ "Failed to extract JSON from LLM response"
**Fix**: Try:
1. Check your intent is clear: `--intent "be specific about what to test"`
2. Lower temperature: Add `LLM_TEMPERATURE=0.3` to `.env`
3. Check internet connection

### ❌ "Test generation takes too long"
**Fix**: 
1. Check network (LLM API call is slow)
2. Use simpler intent description
3. Set `LLM_MAX_TOKENS=1500` in `.env` for faster response

### ✅ Still stuck?
See [PHASE_1_AI_TEST_GENERATION.md](PHASE_1_AI_TEST_GENERATION.md) for full troubleshooting guide.

---

## How It Works Under the Hood

```
Your Intent
    ↓
npm run ai:generate-tests
    ↓
Is LLM_API_KEY set? 
    ├→ YES: Use OpenAI GPT-4 (AI-powered)
    └→ NO: Use rule-based fallback
    ↓
Generate Test Scenarios
    ↓
Create TypeScript Test File
    ↓
Display to console or save to file
    ↓
✅ Ready for your review and completion
```

---

## What's Generated

✅ **Always includes**:
- Test name matching your intent
- Page object imports
- Logger integration
- Clear step comments
- Assertion placeholders

🤖 **AI-Generated** (with LLM):
- Contextual test scenarios
- Specific step sequences
- Domain-aware assertions
- Detailed descriptions

⚙️ **Fallback Generated** (without LLM):
- Generic but valid templates
- Standard step patterns
- Basic assertions
- Still fully functional

---

## Next Steps

1. **✅ Complete Generated Tests**
   - Replace TODO comments with Playwright actions
   - Add specific expect() assertions
   - Test locally

2. **📈 Generate More Tests**
   - Try different intents
   - Experiment with specific vs generic descriptions
   - Build a test suite

3. **🚀 Ready for Phase 2?**
   - See [PHASE_1_AI_TEST_GENERATION.md](PHASE_1_AI_TEST_GENERATION.md) for full feature list
   - Next phase: CI Optimization with test metrics

---

## Files to Read

| File | Purpose |
|------|---------|
| [PHASE_1_QUICK_START.md](PHASE_1_QUICK_START.md) | You are here! Quick setup |
| [PHASE_1_AI_TEST_GENERATION.md](PHASE_1_AI_TEST_GENERATION.md) | Comprehensive guide |
| [PHASE_1_IMPLEMENTATION_SUMMARY.md](PHASE_1_IMPLEMENTATION_SUMMARY.md) | Technical details |
| [PHASE_1_DEMO.md](PHASE_1_DEMO.md) | Architecture & examples |

---

**Ready? Run your first command:**
```bash
npm run ai:generate-tests -- --intent "user can login and see products"
```

🎉 You're now using AI-powered test generation!
