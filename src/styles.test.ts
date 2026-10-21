// The library has no Node type definitions (they don't parse under TS 4.9), so the
// few Node APIs this test needs are typed here and loaded through Jest.
interface DirEntry { name: string; isDirectory: () => boolean }
interface NodeFs {
  readdirSync: (dir: string, options: { withFileTypes: true }) => DirEntry[];
  readFileSync: (file: string, encoding: 'utf8') => string;
}
interface NodePath {
  join: (...parts: string[]) => string;
  relative: (from: string, to: string) => string;
}
interface NodeProcess { cwd: () => string }

const fs = jest.requireActual<NodeFs>('fs');
const path = jest.requireActual<NodePath>('path');

// Jest runs from the repo root.
const SRC_DIR = path.join(jest.requireActual<NodeProcess>('process').cwd(), 'src');
const BREAKPOINT_QUERY = '(--pgn-size-breakpoint';
const BREAKPOINTS_IMPORT = '@openedx/paragon/styles/css/core/custom-media-breakpoints';

const findScssFiles = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = path.join(dir, entry.name);
  if (entry.isDirectory()) { return findScssFiles(fullPath); }
  return entry.name.endsWith('.scss') ? [fullPath] : [];
});

// frontend-build resolves custom media queries per file, so each stylesheet that
// uses a Paragon breakpoint must import the definitions itself, or the rule never matches.
describe('stylesheets', () => {
  const filesUsingBreakpoints = findScssFiles(SRC_DIR)
    .filter((file) => fs.readFileSync(file, 'utf8').includes(BREAKPOINT_QUERY));

  it.each(filesUsingBreakpoints.map((file) => path.relative(SRC_DIR, file)))(
    '%s imports the Paragon breakpoint definitions',
    (relativePath) => {
      expect(fs.readFileSync(path.join(SRC_DIR, relativePath), 'utf8')).toContain(BREAKPOINTS_IMPORT);
    },
  );
});

export {};
