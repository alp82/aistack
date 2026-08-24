/**
 * Known packages that include native code and require platform-specific builds.
 *
 * These packages cannot be bundled and should be traced as external dependencies most of the time.
 */
declare const NodeNativePackages: readonly string[];
/**
 * Packages that should be fully traced (all files copied, not just NFT-detected ones).
 *
 * These packages use dynamic requires, runtime asset loading, or other patterns
 * that prevent static analysis from detecting all required files.
 * Can be passed to the plugin's `traceInclude` option to ensure they are always traced.
 */
declare const FullTracePackages: readonly ["usb", "sodium-native", "aws-crt", "youch"];
/**
 * Packages that must be externalized (traced as dependencies) rather than bundled,
 * due to bundler compatibility issues with their module format or dynamic imports.
 */
declare const NonBundleablePackages: string[];
export { FullTracePackages, NodeNativePackages, NonBundleablePackages };