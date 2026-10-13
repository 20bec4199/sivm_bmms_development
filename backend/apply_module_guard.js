const fs = require('fs');
const path = require('path');

const targetControllers = {
  'src/complaints/complaints.controller.ts': 'SMARTI_CARE',
  'src/complaints/complaint-categories.controller.ts': 'SMARTI_CARE',
  'src/facilities/facilities.controller.ts': 'SMARTI_FACILITY',
  'src/facilities/facility-bookings.controller.ts': 'SMARTI_FACILITY',
  'src/maintenance/work-orders.controller.ts': 'SMARTI_WORK',
  'src/maintenance/maintenance-plans.controller.ts': 'SMARTI_WORK',
  'src/technicians/technicians.controller.ts': 'TECHNICIAN',
  'src/assets/assets.controller.ts': 'SMARTI_ASSET',
  'src/assets/asset-categories.controller.ts': 'SMARTI_ASSET',
  'src/assets/asset-documents.controller.ts': 'SMARTI_ASSET',
  'src/parking/parking.controller.ts': 'SMARTI_PARK',
  'src/visitors/visitors.controller.ts': 'SMARTI_VISIT',
  'src/visitors/visitor-registrations.controller.ts': 'SMARTI_VISIT',
  'src/documents/documents.controller.ts': 'DOCUMENT',
  'src/documents/document-categories.controller.ts': 'DOCUMENT',
};

for (const [relPath, moduleCode] of Object.entries(targetControllers)) {
  const absPath = path.join(__dirname, relPath);
  if (!fs.existsSync(absPath)) {
    console.log(`Skipping ${relPath}, file not found`);
    continue;
  }
  
  let content = fs.readFileSync(absPath, 'utf8');

  // Add imports
  if (!content.includes('ModuleGuard')) {
    content = content.replace(/import { JwtAuthGuard } from '([\.a-zA-Z0-9-/]+jwt-auth.guard)';/, 
      `import { JwtAuthGuard } from '$1';\nimport { ModuleGuard } from '../auth/guards/module.guard';\nimport { RequireModule } from '../auth/decorators/require-module.decorator';`);
  }
  
  // Add ModuleGuard to UseGuards
  content = content.replace(/@UseGuards\((.*?)\)/, (match, p1) => {
    if (p1.includes('ModuleGuard')) return match;
    return `@UseGuards(${p1}, ModuleGuard)`;
  });

  // Add RequireModule above Controller
  if (!content.includes('@RequireModule')) {
    content = content.replace(/@Controller\((.*?)\)/, `@RequireModule('${moduleCode}')\n@Controller($1)`);
  }

  fs.writeFileSync(absPath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}
