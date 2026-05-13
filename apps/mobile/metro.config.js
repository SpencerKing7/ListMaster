const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Redirect expo's devtools messageSocket to a no-op shim so static/embedded
// builds don't crash with "Cannot create devtools websocket connections in
// embedded environments" (bundleLoadedFromServer=false when not served by Metro).
const messageSocketShim = path.resolve(projectRoot, "shims/messageSocket.js");
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes("async-require/messageSocket")) {
    return { filePath: messageSocketShim, type: "sourceFile" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
