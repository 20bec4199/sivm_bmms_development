const { ModuleGuard } = require('./dist/auth/guards/module.guard.js');

class MockReflector {
  constructor(modules) {
    this.modules = modules;
  }
  getAllAndOverride() {
    return this.modules;
  }
}

class MockModuleAccessService {
  constructor(activeModules) {
    this.activeModules = activeModules;
  }
  async hasModules(orgId, requiredModules) {
    return requiredModules.every(m => this.activeModules.includes(m));
  }
}

function createMockContext(user) {
  return {
    getHandler: () => {},
    getClass: () => {},
    switchToHttp: () => ({
      getRequest: () => ({ user })
    })
  };
}

async function runTests() {
  console.log("=== Testing Module Guard ===");
  
  // Test 1: Module Active -> API allowed
  let guard = new ModuleGuard(new MockReflector(['SMARTI_CARE']), new MockModuleAccessService(['SMARTI_CARE', 'SMARTI_WORK']));
  let ctx = createMockContext({ organizationId: 'org-1' });
  let result = await guard.canActivate(ctx);
  console.log("Test 1 (Module Active):", result === true ? "PASSED (Allowed)" : "FAILED");

  // Test 2: Module Inactive -> API rejected
  guard = new ModuleGuard(new MockReflector(['SMARTI_CARE']), new MockModuleAccessService(['SMARTI_WORK']));
  ctx = createMockContext({ organizationId: 'org-1' });
  try {
    await guard.canActivate(ctx);
    console.log("Test 2 (Module Inactive): FAILED (Did not throw)");
  } catch (err) {
    if (err.status === 403) {
      console.log("Test 2 (Module Inactive): PASSED (Rejected with 403 Forbidden)");
    } else {
      console.log("Test 2 (Module Inactive): FAILED (Wrong error)", err);
    }
  }
}

runTests();
