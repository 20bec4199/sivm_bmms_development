import os
import re

def fix_blocks():
    path = 'src/blocks/blocks.service.ts'
    with open(path, 'r') as f:
        content = f.read()
    content = re.sub(r'\.\.\.\(buildingId \? \{ buildingId \} : \{\}\)', '...(buildingId ? { parentId: buildingId } : {}), nodeType: "TOWER"', content)
    with open(path, 'w') as f:
        f.write(content)

def fix_floors():
    path = 'src/floors/floors.service.ts'
    with open(path, 'r') as f:
        content = f.read()
    content = re.sub(r'\.\.\.\(towerId \? \{ towerId \} : \{\}\)', '...(towerId ? { parentId: towerId } : {}), nodeType: "FLOOR"', content)
    with open(path, 'w') as f:
        f.write(content)

def fix_units():
    path = 'src/units/units.service.ts'
    with open(path, 'r') as f:
        content = f.read()
    content = re.sub(r'\.\.\.\(buildingId \? \{ buildingId \} : \{\}\),\s*', '', content)
    content = re.sub(r'\.\.\.\(towerId \? \{ towerId \} : \{\}\),\s*', '', content)
    content = re.sub(r'\.\.\.\(floorId \? \{ floorId \} : \{\}\)', '...(floorId ? { parentId: floorId } : {}), nodeType: "UNIT"', content)
    content = re.sub(r'unitNumber:\s*\{', 'name: {', content)
    # also remove type and status from where clause if they break schema, but let's see
    content = re.sub(r'\.\.\.\(type \? \{ type \} : \{\}\),\s*', '', content)
    content = re.sub(r'\.\.\.\(status \? \{ status \} : \{\}\),\s*', '', content)
    with open(path, 'w') as f:
        f.write(content)

fix_blocks()
fix_floors()
fix_units()

print("Done fixing wheres")
