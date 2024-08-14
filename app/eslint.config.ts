import type { Linter } from 'eslint';
import react from 'eslint-plugin-react';
import globals from 'globals';
import eslintJS from '@eslint/js';
import eslintTS from 'typescript-eslint';

const config: Linter.Config[] = [
	...eslintTS.configs.recommended as Linter.Config[],
	{
		...eslintJS.configs.recommended,
		files: ['**/*.{ts,mts,tsx}'],
		ignores: ['*.js'],
		plugins: {
			react
		},
		settings: {
			react: {
				...react.configs.recommended.settings,
				version: 'detect'
			}
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true
				}
			},
			globals: {
				...globals.browser,
			}
		},
		rules: {
			...react.configs.recommended.rules,
			'no-restricted-globals': ['error'],
			'no-console': ['error', {
				allow: ['warn', 'error']
			}],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'react/prop-types': 'off',
			'react/no-unescaped-entities': 'off',
			'no-script-url': 'error',
			'no-eval': 'error',
			'quotes': [
				'error',
				'single',
				{ allowTemplateLiterals: true }
			],
			'jsx-quotes': [
				'error',
				'prefer-double',
			],
			'@typescript-eslint/prefer-ts-expect-error': 'error',
			'object-curly-spacing': [
				'error',
				'always'
			],
			'array-bracket-spacing': [
				'error',
				'never'
			],
			'eqeqeq': [
				'error',
				'smart',
			],
			'no-multi-spaces': 'error'
		}
	}
];
export default config;
