const {
  withAppBuildGradle,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

module.exports = function withAndroidBuild(config) {
  config = withAppBuildGradle(config, (config) => {
    let source = config.modResults.contents;
    const staging =
      'buildStagingDirectory file(System.getProperty("os.name").startsWith("Windows") ? "${System.getProperty(\'java.io.tmpdir\')}/fc/${Integer.toHexString(rootDir.absolutePath.hashCode())}" : "$rootDir/../.cxx")';
    source = source.replace(
      'buildStagingDirectory file("$rootDir/../.cxx")',
      staging,
    );
    if (!source.includes(staging)) {
      source = source.replace(
        /android\s*\{/,
        `android {\n    externalNativeBuild { cmake { ${staging} } }`,
      );
    }
    if (!source.includes('"-DCMAKE_OBJECT_PATH_MAX=250"')) {
      source = source.replace(
        /defaultConfig\s*\{/,
        'defaultConfig {\n        externalNativeBuild { cmake { arguments "-DCMAKE_OBJECT_PATH_MAX=250" } }',
      );
    }
    config.modResults.contents = source;
    return config;
  });
  return withDangerousMod(config, [
    "android",
    async (config) => {
      if (process.platform === "win32") {
        const destination = path.join(
          config.modRequest.platformProjectRoot,
          "gradle",
          "gradle-daemon-jvm.properties",
        );
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(
          destination,
          "# Android utiliza el JDK 17 instalado.\ntoolchainVersion=17\n",
        );
      }
      return config;
    },
  ]);
};
