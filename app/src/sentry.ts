import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { isDev } from './app/util';
import { version } from '../package.json';
import { MicroPadAction } from './app/actions';
import { Failure } from 'redux-typescript-actions';
import { CaptureConsole } from '@sentry/integrations';

enum SentryEnv {
	LOCAL = 'local',
	NEXT_DEV = 'next',
	PROD = 'prod'
}

export function initSentry() {
	const envTag = getDevEnv();
	if (envTag === SentryEnv.LOCAL) return;

	Sentry.init({
		dsn: 'https://49d3ec40df254b7ebc17894456ad9d0e@o491589.ingest.sentry.io/5813252',
		integrations: [
			new Integrations.BrowserTracing(),
			new CaptureConsole({ levels: ['error'] })
		],
		tracesSampleRate: isDev() ? 1.0 : 0.2,
		environment: envTag,
		release: version
	});
}

export function createSentryReduxEnhancer() {
	return Sentry.createReduxEnhancer({
		stateTransformer: _state => null,
		actionTransformer: (action: MicroPadAction) => ({
			type: action.type,
			error: (action?.payload as Failure<unknown, unknown>)?.error
		})
	});
}

function getDevEnv(): SentryEnv {
	if (!isDev()) return SentryEnv.PROD;

	/* eslint-disable no-restricted-globals */
	return location.hostname === 'next.getmicropad.com' ? SentryEnv.NEXT_DEV : SentryEnv.LOCAL;
	/* eslint-enable no-restricted-globals */
}
