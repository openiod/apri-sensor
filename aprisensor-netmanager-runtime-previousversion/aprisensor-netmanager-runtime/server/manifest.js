const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		entry: {"file":"_app/immutable/start-7776a44d.js","imports":["_app/immutable/start-7776a44d.js","_app/immutable/chunks/index-e2c7dba6.js","_app/immutable/chunks/singletons-59c630ba.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('./chunks/0-e092598e.js'),
			() => import('./chunks/1-d312dad3.js'),
			() => import('./chunks/2-0f87d87b.js')
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0], errors: [1], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};

export { manifest };
//# sourceMappingURL=manifest.js.map
