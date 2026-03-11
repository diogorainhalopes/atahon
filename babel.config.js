module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@db': './src/db',
            '@stores': './src/stores',
            '@queries': './src/queries',
            '@components': './src/components',
            '@reader': './src/reader',
            '@utils': './src/utils',
            '@theme': './src/theme',
          },
        },
      ],
    ],
  };
};
