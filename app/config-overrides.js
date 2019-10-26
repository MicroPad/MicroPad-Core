// TODO: Fix this for building
module.exports = function override(config, env) {
	if (env === 'production') {
		let swPlugin = config.plugins.find(p => p.constructor.name === 'SWPrecacheWebpackPlugin');
		swPlugin.options.navigateFallbackWhitelist.push(/^(?!\/\w*\.worker).*/);
	}

	// Fix for workerize-loader
	config.output.globalObject = 'this';

	return config;
};
