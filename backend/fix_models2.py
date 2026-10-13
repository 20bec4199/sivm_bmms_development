import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "properties.service.ts" in filepath:
        content = re.sub(r'(\.\.\.createPropertyDto,\s*organizationId,)', r'\1 nodeType: "BUILDING",', content)
        
    if "blocks.service.ts" in filepath:
        content = re.sub(r'buildingId:\s*createBlockDto\.buildingId', 'parentId: createBlockDto.buildingId, nodeType: "BLOCK"', content)
        content = re.sub(r'include:\s*\{\s*building:\s*true\s*\}', 'include: { parent: true }', content)
        content = re.sub(r'building:\s*true,?', 'parent: true,', content)

    if "floors.service.ts" in filepath:
        content = re.sub(r'towerId:\s*createFloorDto\.towerId', 'parentId: createFloorDto.towerId, nodeType: "FLOOR"', content)
        content = re.sub(r'level:\s*createFloorDto\.level', 'metadata: { level: createFloorDto.level }', content)
        content = re.sub(r'include:\s*\{\s*tower:\s*true\s*\}', 'include: { parent: true }', content)
        content = re.sub(r'tower:\s*true,?', 'parent: true,', content)
        content = re.sub(r'orderBy:\s*\{\s*level:\s*\'asc\'\s*\},?', 'orderBy: { createdAt: "asc" },', content)

    if "units.service.ts" in filepath:
        content = re.sub(r'buildingId.*?type\s*\?\s*:\s*UnitType;\s*status\s*\?\s*:\s*UnitStatus;\s*\},?', '', content, flags=re.DOTALL)
        content = re.sub(r'(\.\.\.createUnitDto,)', r'\1 nodeType: "UNIT", name: createUnitDto.unitNumber, parentId: createUnitDto.floorId || createUnitDto.towerId || createUnitDto.buildingId, metadata: { category: createUnitDto.category, type: createUnitDto.type },', content)
        content = re.sub(r'include:\s*\{\s*building:\s*true,\s*tower:\s*true,\s*floor:\s*true\s*\}', 'include: { parent: { include: { parent: { include: { parent: true } } } } }', content)
        content = re.sub(r'building:\s*true,?', '', content)
        content = re.sub(r'tower:\s*true,?', '', content)
        content = re.sub(r'floor:\s*true,?', '', content)
        content = re.sub(r'orderBy:\s*\{\s*unitNumber:\s*\'asc\'\s*\},?', 'orderBy: { name: "asc" },', content)

    if "owners.service.ts" in filepath or "tenants.service.ts" in filepath or "transfers.service.ts" in filepath:
        content = re.sub(r'include:\s*\{\s*propertyNode:\s*\{\s*include:\s*\{\s*building:\s*true\s*\}\s*\}\s*\}', 'include: { propertyNode: true }', content)

    with open(filepath, 'w') as f:
        f.write(content)

base_dir = 'src'
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.ts'):
            fix_file(os.path.join(root, file))

print("Done fixing Phase 2")
