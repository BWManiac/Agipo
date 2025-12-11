# Records Consolidation - Implementation Phases

## Phase 1: Folder Backend Infrastructure

### Goal
Implement folder CRUD operations and storage structure.

### File Impact
- Create: `app/api/records/types.ts`
- Create: `app/api/records/services/folders.ts` 
- Create: `app/api/records/services/migration.ts`
- Create: `app/api/records/folders/route.ts`
- Modify: `app/api/records/services/catalog.ts`

### Pseudocode
```typescript
// types.ts
export interface FolderMetadata {
  id: string;
  name: string;
  parentFolderId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemType = "table" | "document";

// folders.ts
export async function createFolder(name: string, parentId?: string) {
  const folderId = `folder_${nanoid(12)}`;
  const folderPath = parentId 
    ? `_tables/records/${parentId}/${folderId}`
    : `_tables/records/_root/${folderId}`;
  
  const metadata: FolderMetadata = {
    id: folderId,
    name,
    parentFolderId: parentId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await fs.mkdir(folderPath, { recursive: true });
  await fs.writeFile(
    path.join(folderPath, 'folder.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  return metadata;
}

// migration.ts
export async function migrateToFolders() {
  // Create root folder
  await fs.mkdir('_tables/records/_root', { recursive: true });
  
  // Move existing tables
  const tables = await fs.readdir('_tables/records');
  for (const tableId of tables) {
    if (tableId !== '_root') {
      await fs.rename(
        `_tables/records/${tableId}`,
        `_tables/records/_root/${tableId}`
      );
    }
  }
  
  // Move documents
  const docs = await fs.readdir('_tables/documents');
  for (const docId of docs) {
    await fs.rename(
      `_tables/documents/${docId}`,
      `_tables/records/_root/${docId}`
    );
  }
}
```

### Testing
```bash
# Create folder
curl -X POST /api/records/folders \
  -d '{"name": "Job Applications"}'

# Verify folder created
ls _tables/records/_root/

# List folders
curl /api/records/folders
```

---

## Phase 2: Item Operations & Movement

### Goal
Implement item movement between folders and folder contents listing.

### File Impact
- Create: `app/api/records/folders/[folderId]/items/route.ts`
- Create: `app/api/records/items/[itemId]/move/route.ts`
- Create: `app/api/records/services/folder-tree.ts`
- Modify: `app/api/records/services/io.ts`

### Pseudocode
```typescript
// folder-tree.ts
export async function getFolderContents(folderId: string) {
  const folderPath = await findFolderPath(folderId);
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  
  const folders: FolderMetadata[] = [];
  const items: FolderItem[] = [];
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const itemPath = path.join(folderPath, entry.name);
      
      // Check if it's a subfolder
      if (await fs.exists(path.join(itemPath, 'folder.json'))) {
        const metadata = await fs.readFile(
          path.join(itemPath, 'folder.json'),
          'utf-8'
        );
        folders.push(JSON.parse(metadata));
      }
      // Check if it's a table
      else if (await fs.exists(path.join(itemPath, 'schema.json'))) {
        items.push({
          id: entry.name,
          type: 'table',
          name: await getTableName(entry.name),
          folderId
        });
      }
      // Check if it's a document
      else if (await fs.exists(path.join(itemPath, 'content.md'))) {
        items.push({
          id: entry.name,
          type: 'document',
          name: await getDocName(entry.name),
          folderId
        });
      }
    }
  }
  
  return { folders, items };
}

// move/route.ts
export async function PATCH(request, { params }) {
  const { itemId } = params;
  const { targetFolderId } = await request.json();
  
  const currentPath = await findItemPath(itemId);
  const targetPath = await findFolderPath(targetFolderId);
  
  await fs.rename(
    currentPath,
    path.join(targetPath, itemId)
  );
  
  return NextResponse.json({ success: true });
}
```

### Testing
```bash
# Get folder contents
curl /api/records/folders/folder_abc123/items

# Move item to folder
curl -X PATCH /api/records/items/table_xyz/move \
  -d '{"targetFolderId": "folder_abc123"}'

# Verify item moved
ls _tables/records/_root/folder_abc123/
```

---

## Phase 3: Frontend Folder UI

### Goal
Build folder view, tree navigation, and unified item cards.

### File Impact
- Create: `store/slices/folderSlice.ts`
- Create: `components/FolderView.tsx`
- Create: `components/FolderTree.tsx`
- Create: `components/ItemCard.tsx`
- Create: `components/CreateFolderDialog.tsx`
- Modify: `app/(pages)/records/page.tsx`

### Pseudocode
```tsx
// FolderView.tsx
export function FolderView({ folderId }: { folderId?: string }) {
  const { folders, items } = useFolderContents(folderId || '_root');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  return (
    <div>
      <Header>
        <h1>{folderId ? getFolderName(folderId) : 'Records'}</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          + New
        </Button>
      </Header>
      
      <Grid>
        {folders.map(folder => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onClick={() => navigateToFolder(folder.id)}
          />
        ))}
        
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => navigateToItem(item)}
          />
        ))}
      </Grid>
      
      {showCreateDialog && (
        <CreateFolderDialog
          parentId={folderId}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}

// FolderTree.tsx
export function FolderTree({ currentFolderId }: { currentFolderId?: string }) {
  const tree = useFolderTree();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  
  const renderNode = (node: FolderNode, level: number = 0) => (
    <TreeNode key={node.id} style={{ paddingLeft: level * 16 }}>
      <ExpandIcon
        expanded={expanded.has(node.id)}
        onClick={() => toggleExpanded(node.id)}
      />
      <FolderIcon />
      <FolderName
        active={node.id === currentFolderId}
        onClick={() => navigateToFolder(node.id)}
      >
        {node.name}
      </FolderName>
      
      {expanded.has(node.id) && node.children?.map(child => 
        renderNode(child, level + 1)
      )}
    </TreeNode>
  );
  
  return (
    <Sidebar>
      <TreeNode>
        <FolderIcon />
        <FolderName onClick={() => navigateToFolder('_root')}>
          All Records
        </FolderName>
      </TreeNode>
      {tree.children.map(node => renderNode(node, 1))}
    </Sidebar>
  );
}
```

---

## Success Metrics
- Folder creation < 500ms
- Item movement < 1 second
- Tree navigation smooth (no lag)
- Migration completes < 30 seconds for 1000 items
- No data loss during migration