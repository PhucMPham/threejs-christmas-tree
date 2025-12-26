// Conventional commit configuration
// Format: type(scope?): subject
// Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce lowercase type
    'type-case': [2, 'always', 'lower-case'],
    // Enforce non-empty type
    'type-empty': [2, 'never'],
    // Enforce non-empty subject
    'subject-empty': [2, 'never'],
    // Max header length
    'header-max-length': [2, 'always', 100],
    // Allowed types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting, missing semicolons, etc.
        'refactor', // Code restructuring without behavior change
        'perf',     // Performance improvement
        'test',     // Adding tests
        'build',    // Build system or dependencies
        'ci',       // CI configuration
        'chore',    // Maintenance tasks
        'revert',   // Reverting changes
      ],
    ],
  },
};
