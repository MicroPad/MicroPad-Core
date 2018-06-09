module.exports = function override(config, env) {
	if (env === 'production') {
		let swPlugin = config.plugins.find(p => p.constructor.name === 'SWPrecacheWebpackPlugin');
		swPlugin.options.navigateFallbackWhitelist.push(/^(?!\/[a-zA-Z0-9]*\.worker).*/);
	}

	return config;
};
