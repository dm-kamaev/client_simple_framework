module.exports = {
  'env': {
    browser: true,
    node: false,
    mocha: false,
    jquery: false,
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'ecmaVersion': 5,
  },
  'globals': {
    'getByID': true,
    'W': true,
    'getTarget': true,
    'rebuildArray': true,
    'MODULES': true,
    'cleanInput': true,
    'removeElArray': true,
    '_ajx': true,
    'D': true,
    'W': true
  },
  'rules': {
    "no-restricted-syntax": ["error", "WithStatement", "BinaryExpression[operator='in']"],
    "max-len": [ 2, {
      "code": 200, "tabWidth": 2, 'ignoreComments': true, "ignoreUrls": true } ],
    'indent': [
      'error',
      2,
      {'SwitchCase': 1}
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'no-use-before-define': [
      'error',
      { "functions": false, "classes": false }
    ],
    'no-multi-spaces': [ 'error' ],
    'array-callback-return': [ 'error' ],
    'block-scoped-var': [ 'error' ],
    'curly': [ 'error' ],
    'no-throw-literal': [ 'error' ],
    'no-useless-catch': [ 'error' ],
    'guard-for-in': [ 'error' ],
    'no-extend-native': [ 'error' ],

    "eqeqeq": ["error", "always"],
    'no-extra-boolean-cast': ['off'],
    'no-console': ['off'],
    'no-useless-escape': ['off']
  }
};