import { ModuleGuard } from './src/auth/guards/module.guard';
import { Reflector } from '@nestjs/core';
import { ModuleAccessService } from './src/auth/services/module-access.service';
import { PrismaService } from './src/prisma/prisma.service';

class MockReflector {
  constructor(private modules: string[]) {}
  getAllAndOverride() { return this.modules; }
}

class MockModuleAccessService {
  constructor(private activeModules: string[]) {}
  async hasModules(orgId: string, requiredModules: string[]) {
    return requiredModules.every(m => this.activeModules.includes(m));
  }
}

function createMockContext(user: any) {
  return {
    getHandler: () => {},
    getClass: () => {},
    switchToHttp: () => ({
      getRequest: () => ({ user })
    })
  } as any;
}

async function runTests() {
  console.log("=== Testing Module Guard ===");
  
  // Test 1
  let guard = new ModuleGuard(new MockReflector(['SMARTI_CARE']) as unknown as Reflector, new MockModuleAccessService(['SMARTI_CARE', 'SMARTI_WORK']) as unknown as ModuleAccessService);
  let ctx = createMockContext({ organizationId: 'org-1' });
  let result = await guard.canActivate(ctx);
  console.log("Test 1 (Module Active):", result === true ? "PASSED (Allowed)" : "FAILED");

  // Test 2
  guard = new ModuleGuard(new MockReflector(['SMARTI_CARE']) as unknown as Reflector, new MockModuleAccessService(['SMARTI_WORK']) as unknown as ModuleAccessService);
  ctx = createMockContext({ organizationId: 'org-1' });
  try {
    await guard.canActivate(ctx);
    console.log("Test 2 (Module Inactive): FAILED (Did not throw)");
  } catch (err: any) {
    if (err.status === 403) {
      console.log("Test 2 (Module Inactive): PASSED (Rejected with 403 Forbidden)");
    } else {
      console.log("Test 2 (Module Inactive): FAILED (Wrong error)", err);
    }
  }
}

runTests();
