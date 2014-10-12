(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("backbone"), require("underscore"));
	else if(typeof define === 'function' && define.amd)
		define(["backbone", "underscore"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("backbone"), require("underscore")) : factory(root["Backbone"], root["_"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_7__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Backbone = __webpack_require__(1);
	var Hoard = __webpack_require__(2);
	Hoard.Store = __webpack_require__(3);
	Hoard.Policy = __webpack_require__(4);
	Hoard.Control = __webpack_require__(5);
	Hoard.Strategy = __webpack_require__(6);

	if (typeof Promise !== 'undefined') {
	  Hoard.Promise = Promise;
	}

	if (typeof localStorage !== 'undefined') {
	  Hoard.backend = localStorage;
	}

	var previousHoard = Backbone.Hoard;
	Backbone.Hoard = Hoard;
	Hoard.noConflict = function () {
	  Backbone.Hoard = previousHoard;
	  return Hoard;
	};

	module.exports = Hoard;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Backbone = __webpack_require__(1);

	module.exports = {
	  Promise: function () {
	    throw new TypeError('An ES6-compliant Promise implementation must be provided');
	  },

	  sync: Backbone.sync,

	  Events: Backbone.Events,

	  extend: Backbone.Model.extend,

	  defer: function () {
	    var deferred = {};
	    deferred.promise = new this.Promise(function (resolve, reject) {
	      deferred.resolve = resolve;
	      deferred.reject = reject;
	    });
	    return deferred;
	  }
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(7);
	var Hoard = __webpack_require__(2);
	var MetaStore = __webpack_require__(8);
	var StoreHelpers = __webpack_require__(9);

	var mergeOptions = ['backend', 'metaStoreClass'];

	var Store = function (options) {
	  _.extend(this, _.pick(options || {}, mergeOptions));
	  _.defaults(this, {
	    backend: Hoard.backend,
	    metaStoreClass: MetaStore
	  });
	  this.metaStore = new this.metaStoreClass(mergeOptions);
	  this.initialize.apply(this, arguments);
	};

	_.extend(Store.prototype, Hoard.Events, {
	  initialize: function () {},

	  set: function (key, item, meta, options) {
	    var storedItem = JSON.stringify(item);
	    var metaWithSize = _.extend({ size: storedItem.length }, meta);
	    var itemPromise = this._setItem(key, storedItem);
	    var metaPromise = this.metaStore.set(key, metaWithSize, options);
	    var setPromise = Hoard.Promise.all([itemPromise, metaPromise]);
	    return setPromise.then(undefined, _.bind(this.onSetError, this, key, options));
	  },

	  get: StoreHelpers.proxyGetItem,

	  invalidate: function (key, options) {
	    this.backend.removeItem(key);
	    return this.metaStore.invalidate(key, options);
	  },

	  invalidateAll: function () {
	    var dataPromise = this.getAllMetadata().then(function (metadata) {
	      _.each(_.keys(metadata), function (key) {
	        this.backend.removeItem(key);
	      }, this);
	    }.bind(this));

	    var metaPromise = this.metaStore.invalidateAll();

	    return Hoard.Promise.all([dataPromise, metaPromise]);
	  },

	  getMetadata: function (key, options) {
	    return this.metaStore.get(key, options);
	  },

	  getAllMetadata: function (options) {
	    return this.metaStore.getAll(options);
	  },

	  onSetError: function (key, options) {
	    return this.invalidateAll().then(function () {
	      return Hoard.Promise.reject();
	    });
	  },

	  _setItem: StoreHelpers.proxySetItem
	});

	Store.extend = Hoard.extend;

	module.exports = Store;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(7);
	var Hoard = __webpack_require__(2);

	var mergeOptions = ['expires', 'timeToLive'];

	var Policy = function (options) {
	  _.extend(this, _.pick(options || {}, mergeOptions));
	  this.initialize.apply(this, arguments);
	};

	_.extend(Policy.prototype, Hoard.Events, {
	  initialize: function () {},

	  // default to 5 minutes
	  timeToLive: 5 * 60 * 1000,

	  getKey: function (model, method) {
	    return _.result(model, 'url');
	  },

	  getMetadata: function (key, response, options) {
	    var meta = {};
	    var expires = this.expires;
	    if (this.timeToLive != null && expires == null) {
	      expires = Date.now() + this.timeToLive;
	    }
	    if (expires != null) {
	      meta.expires = expires;
	    }
	    return meta;
	  },

	  shouldEvictItem: function (meta) {
	    return meta.expires != null && meta.expires < Date.now();
	  }
	});

	Policy.extend = Hoard.extend;

	module.exports = Policy;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(7);

	var Hoard = __webpack_require__(2);
	var Store = __webpack_require__(3);
	var Policy = __webpack_require__(4);
	var CreateStrategyClass = __webpack_require__(10);
	var ReadStrategyClass = __webpack_require__(11);
	var UpdateStrategyClass = __webpack_require__(12);
	var PatchStrategyClass = __webpack_require__(13);
	var DeleteStrategyClass = __webpack_require__(14);

	var strategies = {
	  create: {
	    klass: CreateStrategyClass,
	    classProperty: 'createStrategyClass',
	    property: 'createStrategy'
	  },

	  read: {
	    klass: ReadStrategyClass,
	    classProperty: 'readStrategyClass',
	    property: 'readStrategy'
	  },

	  update: {
	    klass: UpdateStrategyClass,
	    classProperty: 'updateStrategyClass',
	    property: 'updateStrategy'
	  },

	  patch: {
	    klass: PatchStrategyClass,
	    classProperty: 'patchStrategyClass',
	    property: 'patchStrategy'
	  },

	  'delete': {
	    klass: DeleteStrategyClass,
	    classProperty: 'deleteStrategyClass',
	    property: 'deleteStrategy'
	  }
	};

	var mergeOptions = _.union(['storeClass', 'policyClass'],
	  _.pluck(strategies, 'classProperty'));

	var strategyClasses = {};
	_.each(strategies, function (strategy) {
	  strategyClasses[strategy.classProperty] = strategy.klass;
	});

	var Control = function (options) {
	  _.extend(this, _.pick(options || {}, mergeOptions));
	  var defaultClasses = _.extend({
	    storeClass: Store,
	    policyClass: Policy
	  }, strategyClasses);
	  _.defaults(this, defaultClasses);

	  this.store = new this.storeClass(options);
	  this.policy = new this.policyClass(options);
	  var strategyOptions = _.extend({}, options, {
	    store: this.store,
	    policy: this.policy
	  });

	  _.each(strategies, function (strategy) {
	    this[strategy.property] = new this[strategy.classProperty](strategyOptions);
	  }, this);

	  this.initialize.apply(this, arguments);
	};

	_.extend(Control.prototype, Hoard.Events, {
	  initialize: function () {},

	  sync: function (method, model, options) {
	    var strategyProperty = strategies[method].property;
	    var strategy = this[strategyProperty];
	    return strategy.execute(model, options);
	  },

	  getModelSync: function () {
	    return _.bind(this.sync, this);
	  }
	});

	Control.extend = Hoard.extend;

	module.exports = Control;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(7);
	var Hoard = __webpack_require__(2);

	var mergeOptions = ['store', 'policy'];

	var Strategy = function (options) {
	  _.extend(this, _.pick(options || {}, mergeOptions));
	  this.initialize.apply(this, arguments);
	};

	_.extend(Strategy.prototype, Hoard.Events, {
	  initialize: function () {},

	  execute: function (model, options) {
	    throw new Error("Strategy#execute must be implemented");
	  }
	});

	Strategy.extend = Hoard.extend;

	module.exports = Strategy;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_7__;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(7);
	var Hoard = __webpack_require__(2);
	var StoreHelpers = __webpack_require__(9);

	var mergeOptions = ['backend', 'key'];

	var MetaStore = function (options) {
	  _.extend(this, _.pick(options || {}, mergeOptions));
	  _.defaults(this, { backend: Hoard.backend });
	  this.initialize.apply(this, arguments);
	};


	_.extend(MetaStore.prototype, Hoard.Events, {
	  initialize: function () {},

	  key: 'backbone.hoard.metastore',

	  set: function (key, meta, options) {
	    var allMetadata = this._get();
	    allMetadata[key] = meta;
	    return this._set(this.key, allMetadata);
	  },

	  get: function (key, options) {
	    var allMetadata = this._get();
	    var meta = allMetadata[key] || {};
	    return Hoard.Promise.resolve(meta);
	  },

	  getAll: function (options) {
	    return Hoard.Promise.resolve(this._get());
	  },

	  invalidate: function (key, options) {
	    var allMetadata = this._get();
	    delete allMetadata[key];
	    this._set(this.key, allMetadata);
	    return Hoard.Promise.resolve();
	  },

	  invalidateAll: function () {
	    this.backend.removeItem(this.key);
	    return Hoard.Promise.resolve();
	  },

	  _get: function () {
	    return JSON.parse(this.backend.getItem(this.key)) || {};
	  },

	  _set: function (key, meta) {
	    return this._setItem(key, JSON.stringify(meta));
	  },

	  _setItem: StoreHelpers.proxySetItem
	});

	MetaStore.extend = Hoard.extend;
	module.exports = MetaStore;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Hoard = __webpack_require__(2);

	module.exports = {
	  proxySetItem: function (key, value) {
	    try {
	      this.backend.setItem(key, value);
	      return Hoard.Promise.resolve();
	    } catch (e) {
	      return Hoard.Promise.reject(e);
	    }
	  },

	  proxyGetItem: function (key, options) {
	    var storedValue = JSON.parse(this.backend.getItem(key));
	    if (storedValue !== null) {
	      return Hoard.Promise.resolve(storedValue);
	    } else {
	      return Hoard.Promise.reject();
	    }
	  }
	};


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PositiveWriteStrategy = __webpack_require__(16);

	module.exports = PositiveWriteStrategy.extend({ _method: 'create' });


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(7);
	var Hoard = __webpack_require__(2);
	var Strategy = __webpack_require__(6);
	var StrategyHelpers = __webpack_require__(15);

	var placeholderInvalidateWrap = function (key, fn) {
	  return function () {
	    delete this.placeholders[key];
	    fn();
	  };
	};

	var Read = Strategy.extend({
	  initialize: function (options) {
	    this.placeholders = {};
	  },

	  placeholderTimeToLive: 8 * 1000,

	  execute: function (model, options) {
	    var key = this.policy.getKey(model, 'read');

	    return this.store.get(key).then(
	      _.bind(this.onCacheHit, this, key, model, options),
	      _.bind(this.onCacheMiss, this, key, model, options)
	    );
	  },

	  onCacheHit: function (key, model, options, cachedItem) {
	    return this.store.getMetadata(key, options).then(_.bind(function (meta) {
	      if (this.policy.shouldEvictItem(meta)) {
	        return this.store.invalidate(key).then(_.bind(function () {
	          return this.onCacheMiss(key, model, options);
	        }, this));
	      } else {
	        return this._onFullCacheHit(cachedItem, options);
	      }
	    }, this));
	  },

	  onCacheMiss: function (key, model, options) {
	    if (this.placeholders[key]) {
	      if (Date.now() > this.placeholders[key].expires) {
	        delete this.placeholders[key];
	      } else {
	        return this._onPlaceholderHit(key, options);
	      }
	    }

	    var onSuccess = this._wrapSuccessWithCache('read', model, options);
	    options.success = _.bind(function () {
	      delete this.placeholders[key];
	      onSuccess.apply(null, arguments);
	    }, this);

	    var onError = this._wrapErrorWithInvalidate('read', model, options);
	    options.error = _.bind(function () {
	      delete this.placeholders[key];
	      onError.apply(null, arguments);
	    }, this);

	    this.placeholders[key] = { expires: Date.now() + this.placeholderTimeToLive };
	    return Hoard.sync('read', model, options);
	  },

	  _onPlaceholderHit: function (key, options) {
	    var deferred = Hoard.defer();
	    var successEvent = StrategyHelpers.getSyncSuccessEvent(key);
	    var errorEvent = StrategyHelpers.getSyncErrorEvent(key);

	    var onSuccess = function (response) {
	      if (options.success) {
	        options.success(response);
	      }
	      this.off(errorEvent, onError);
	      deferred.resolve(response);
	    };

	    var onError = function (response) {
	      if (options.error) {
	        options.error(response);
	      }
	      this.off(successEvent, onSuccess);
	      deferred.reject(response);
	    };

	    this.once(successEvent, onSuccess);
	    this.once(errorEvent, onError);
	    return deferred.promise;
	  },

	  _onFullCacheHit: function (item, options) {
	      var itemData = item;
	      if (options.success) {
	        options.success(itemData);
	      }
	      return itemData;
	  },

	  _wrapSuccessWithCache: StrategyHelpers.proxyWrapSuccessWithCache,
	  _wrapErrorWithInvalidate: StrategyHelpers.proxyWrapErrorWithInvalidate
	});

	module.exports = Read;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PositiveWriteStrategy = __webpack_require__(16);

	module.exports = PositiveWriteStrategy.extend({ _method: 'update' });


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PositiveWriteStrategy = __webpack_require__(16);

	module.exports = PositiveWriteStrategy.extend({ _method: 'patch' });


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Hoard = __webpack_require__(2);
	var Strategy = __webpack_require__(6);

	var Delete = Strategy.extend({
	  execute: function (model, options) {
	    var key = this.policy.getKey(model, 'delete');
	    this.store.invalidate(key);
	    return Hoard.sync('delete', model, options);
	  }
	});

	module.exports = Delete;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(7);
	var Hoard = __webpack_require__(2);

	var getSyncSuccessEvent = function (key) {
	  return 'sync:success:' + key;
	};

	var getSyncErrorEvent = function (key) {
	  return 'sync:error:' + key;
	};

	var storeResponse = function (context, key, response, options) {
	  var meta = context.policy.getMetadata(key, response, options);
	  context.store.set(key, response, meta);
	  context.trigger(getSyncSuccessEvent(key), response);
	};

	var wrapSuccessWithCache = function (context, method, model, options) {
	  var key = context.policy.getKey(model, method);
	  return _.wrap(options.success, function (onSuccess, response) {
	    if (onSuccess) {
	      onSuccess(response);
	    }
	    storeResponse(context, key, response, options);
	  });
	};

	var wrapErrorWithInvalidate = function (context, method, model, options) {
	  var key = context.policy.getKey(model, method);
	  return _.wrap(options.error, function (onError, response) {
	    if (onError) {
	      onError(response);
	    }
	    context.store.invalidate(key);
	    context.trigger(getSyncErrorEvent(key));
	  });
	};

	var cacheSuccess = function (context, method, model, options) {
	  options.success = wrapSuccessWithCache(context, method, model, options);
	  return Hoard.sync(method, model, options);
	};

	module.exports = {
	  getSyncSuccessEvent: getSyncSuccessEvent,

	  getSyncErrorEvent: getSyncErrorEvent,

	  proxyWrapSuccessWithCache: function (method, model, options) {
	    return wrapSuccessWithCache(this, method, model, options);
	  },

	  proxyWrapErrorWithInvalidate: function (method, model, options) {
	    return wrapErrorWithInvalidate(this, method, model, options);
	  },

	  proxyCacheSuccess: function (method, model, options) {
	    return cacheSuccess(this, method, model, options);
	  }
	};

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Strategy = __webpack_require__(6);
	var StrategyHelpers = __webpack_require__(15);

	module.exports = Strategy.extend({
	  execute: function (model, options) {
	    return this._cacheSuccess(this._method, model, options);
	  },

	  _cacheSuccess: StrategyHelpers.proxyCacheSuccess
	});


/***/ }
/******/ ])
});
