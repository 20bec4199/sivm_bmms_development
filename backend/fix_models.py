import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacements for missing Prisma methods
    content = re.sub(r'this\.prisma\.building\.', 'this.prisma.propertyNode.', content)
    content = re.sub(r'this\.prisma\.tower\.', 'this.prisma.propertyNode.', content)
    content = re.sub(r'this\.prisma\.floor\.', 'this.prisma.propertyNode.', content)
    content = re.sub(r'this\.prisma\.unit\.', 'this.prisma.propertyNode.', content)

    # Replace unitId with propertyNodeId
    content = re.sub(r'\bunitId\b', 'propertyNodeId', content)
    
    # Replace include: { unit: true } with include: { propertyNode: true }
    content = re.sub(r'unit:\s*true', 'propertyNode: true', content)
    content = re.sub(r'unit:\s*\{', 'propertyNode: {', content)
    
    # Remove include towers and units from properties.service.ts
    content = re.sub(r'towers:\s*true,?', '', content)
    content = re.sub(r'units:\s*true,?', '', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

base_dir = 'src'
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.ts'):
            fix_file(os.path.join(root, file))

print("Done fixing files")
