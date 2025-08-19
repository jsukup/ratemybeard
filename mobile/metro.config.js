const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Add support for the shared package
config.resolver.alias = {
  '@shared': path.resolve(monorepoRoot, 'shared/dist'),
};

// 5. Ensure Metro can handle TypeScript files from shared package
config.resolver.sourceExts.push('ts', 'tsx');

// 6. Support for symlinked modules (useful for monorepos)
config.resolver.unstable_enableSymlinks = true;

module.exports = config;