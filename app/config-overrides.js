module.exports = function override(config, env) {
	if (env === 'production') {
		let swPlugin = config.plugins.find(p => p.constructor.name === 'SWPrecacheWebpackPlugin');
		swPlugin.options.navigateFallbackWhitelist.push(/^(?!\/\w*\.worker).*/);
	}

	return config;
};
