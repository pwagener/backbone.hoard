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

	// Adapt a common interface to a desired storage mechanism (e.g. localStorage, sessionStorage)
	// The interface is asynchronous, to support the use of asynchronous backends (e.g. IndexedDB)
	var Store = function (options) {
	  _.extend(this, _.pick(options || {}, mergeOptions));
	  _.defaults(this, {
	    backend: Hoard.backend,
	    metaStoreClass: MetaStore
	  });
	  this.metaStore = new this.metaStoreClass(options);
	  this.initialize.apply(this, arguments);
	};

	_.extend(Store.prototype, Hoard.Events, {
	  initialize: function () {},

	  // Store an item and its metadata, handling errors with `onSetError`
	  set: function (key, item, meta, options) {
	    var storedItem = JSON.stringify(item);
	    var metaWithSize = _.extend({ size: storedItem.length }, meta);
	    var itemPromise = this._setItem(key, storedItem);
	    var metaPromise = this.metaStore.set(key, metaWithSize, options);
	    var setPromise = Hoard.Promise.all([itemPromise, metaPromise]);
	    return setPromise.then(undefined, _.bind(this.onSetError, this, key, options));
	  },

	  // Retrieve an item from the cache
	  // Returns a promise that resolves with the found cache item
	  // or rejects if an item is not found in the cache
	  get: StoreHelpers.proxyGetItem,

	  // Remove an item and its metadata from the cache
	  invalidate: function (key, options) {
	    this.backend.removeItem(key);
	    return this.metaStore.invalidate(key, options);
	  },

	  // Remove all items listed by store metadata then remove all metadata.
	  invalidateAll: function () {
	    var dataPromise = this.getAllMetadata().then(function (metadata) {
	      _.each(_.keys(metadata), function (key) {
	        this.backend.removeItem(key);
	      }, this);
	    }.bind(this));

	    var metaPromise = this.metaStore.invalidateAll();

	    return Hoard.Promise.all([dataPromise, metaPromise]);
	  },

	  // Get the metadata associated with the given key
	  getMetadata: function (key, options) {
	    return this.metaStore.get(key, options);
	  },

	  // Get all the metadata
	  getAllMetadata: function (options) {
	    return this.metaStore.getAll(options);
	  },

	  // SUBJECT TO CHANGE
	  // Invalidate the entire cache
	  // In the future, the Policy will decide how to respond to a Store set error
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

	// A Policy determines key generation and cache eviction
	var Policy = function (options) {
	  _.extend(this, _.pick(options || {}, mergeOptions));
	  this.initialize.apply(this, arguments);
	};

	_.extend(Policy.prototype, Hoard.Events, {
	  initialize: function () {},

	  // How long, in milliseconds, should a cached item be considered 'fresh'?
	  // Superceded by the `expires` option, which determines at what time the cache item becomes stale
	  timeToLive: 5 * 60 * 1000,

	  // Generate a key for the given model
	  // The key will be used to determine uniqueness in the store
	  getKey: function (model, method) {
	    return _.result(model, 'url');
	  },

	  // Generate metadata
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

	  // Return true if the item associated with the given metadata should be evicted.
	  // Return false otherwise.
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

	// Configuration information to ease the creation of Strategy classes
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

	// A Control is the entry point for caching behavior.
	// It serves as a means of grouping the configured Store, Policy, and Strategies,
	// all of which contain the main caching logic
	var Control = function (options) {
	  _.extend(this, _.pick(options || {}, mergeOptions));
	  var defaultClasses = _.extend({
	    storeClass: Store,
	    policyClass: Policy
	  }, strategyClasses);
	  _.defaults(this, defaultClasses);

	  // Create and assign a store and policy
	  this.store = new this.storeClass(options);
	  this.policy = new this.policyClass(options);

	  // For each sync method, create and assign a strategy to this Control
	  // Each strategy has access to this Control's store and policy
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

	  // For the given sync method, execute the matching Strategy
	  sync: function (method, model, options) {
	    var strategyProperty = strategies[method].property;
	    var strategy = this[strategyProperty];
	    return strategy.execute(model, options);
	  },

	  // The main use of Hoard
	  // Return a sync method fully configured for the cache behavior of this Control
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

	// A Strategy is tied to a particular sync method on a Control
	// The execute method will be called by the Control with the model and options being synced.
	// It is abstract by default, and it's implementations get access to the Store and Policy
	// provided by the Controller
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

	// The meta store stores all metadata about items in a single entry in the backend.
	// A single entry is used so we can easily iterate over managed keys
	// This API should currently be considered private
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

	// Convenience methods for stores
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

	var PositiveWriteStrategy = __webpack_require__(15);

	module.exports = PositiveWriteStrategy.extend({
	  _method: 'create',

	  // In standard REST APIs, the id is not available until the response returns.
	  // Therefore, use the response when determining how to cache.
	  cacheOptions: {
	    generateKeyFromResponse: true
	  }
	});


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(7);
	var Hoard = __webpack_require__(2);
	var Strategy = __webpack_require__(6);
	var StrategyHelpers = __webpack_require__(16);

	// The `Read` Strategy keeps a hash, `this.placeholders` of cache keys for which it is currently retrieving data.
	// Only one request, the 'live' request, for a given key will actually go through to retrieve the data from its source,
	// be it a cache hit (read from storage), or a cache miss (read from the server).
	// The remaining requests, the 'placeholder' requests', will receive the data once the live request responds.
	var Read = Strategy.extend({
	  initialize: function (options) {
	    this.placeholders = {};
	  },

	  execute: function (model, options) {
	    var key = this.policy.getKey(model, 'read');

	    // If a placeholder is hit, then a request has already been made for this key
	    // Resolve when that request has returned
	    if (this.placeholders[key]) {
	      return this._onPlaceholderHit(key, options);
	    } else {
	      // If a placeholder is not found, then check the store for that key
	      // If the key is found in
	      var executionPromise = this.store.get(key).then(
	        _.bind(this.onCacheHit, this, key, model, options),
	        _.bind(this.onCacheMiss, this, key, model, options)
	      );

	      // This is the first access, add a placeholder to signify that this key is in the process of being fetched
	      // `accesses` refers to the number of current live requests for this key
	      // `promise` will be resolved with the key's data if the retrieval is successful,
	      // or rejected with an error otherwise
	      this.placeholders[key] = {
	        accesses: 1,
	        promise: executionPromise
	      };

	      return executionPromise;
	    }
	  },

	  // On a cache hit, first check to see if the cached item should be evicted (e.g. the cache has expired).
	  // If the item should be evicted, do so, and proceed as a cache miss.
	  // Otherwise, remove this request from the placeholder access and resolve the promise with the cached item
	  onCacheHit: function (key, model, options, cachedItem) {
	    return this.store.getMetadata(key, options).then(_.bind(function (meta) {
	      if (this.policy.shouldEvictItem(meta)) {
	        return this.store.invalidate(key).then(_.bind(function () {
	          return this.onCacheMiss(key, model, options);
	        }, this));
	      } else {
	        this._decreasePlaceholderAccess(key);
	        if (options.success) {
	          options.success(cachedItem);
	        }
	        return cachedItem;
	      }
	    }, this));
	  },

	  // On a cache miss, fetch the data using `Hoard.sync` and cache it on success/invalidate on failure.
	  // Clears it's placeholder access only after storing or invalidating the response
	  onCacheMiss: function (key, model, options) {
	    var onStoreAction = _.bind(this._decreasePlaceholderAccess, this, key);
	    var cacheOptions = _.extend({ onStoreAction: onStoreAction }, options);
	    var onSuccess = this._wrapSuccessWithCache('read', model, cacheOptions);
	    var onError = this._wrapErrorWithInvalidate('read', model, cacheOptions);
	    var deferred = Hoard.defer();

	    options.success = this._responseHandler(deferred.resolve, onSuccess);
	    options.error = this._responseHandler(deferred.reject, onError);
	    Hoard.sync('read', model, options);
	    return deferred.promise;
	  },

	  // On a placeholder hit, wait for the live request to go through,
	  // then resolve or reject with the response from the live request
	  _onPlaceholderHit: function (key, options) {
	    var deferred = Hoard.defer();
	    var onSuccess = this._responseHandler(deferred.resolve, options.success, key);
	    var onError = this._responseHandler(deferred.reject, options.error, key);

	    this.placeholders[key].accesses += 1;
	    this.placeholders[key].promise.then(onSuccess, onError);
	    return deferred.promise;
	  },

	  // A convenience method for creating handlers for cache misses and placeholder hits
	  _responseHandler: function (promiseFactory, originalHandler, key) {
	    return _.bind(function (response) {
	      if (originalHandler) {
	        originalHandler(response);
	      }
	      if (key) {
	        this._decreasePlaceholderAccess(key);
	      }
	      promiseFactory(response);
	    }, this);
	  },

	  // A convenience method for decrementing the count for a placeholder
	  // and deleting the placeholder if nothing is currently accessing it
	  _decreasePlaceholderAccess: function (key) {
	    this.placeholders[key].accesses -= 1;
	    if (!this.placeholders[key].accesses) {
	      delete this.placeholders[key];
	    }
	  },

	  _wrapSuccessWithCache: StrategyHelpers.proxyWrapSuccessWithCache,
	  _wrapErrorWithInvalidate: StrategyHelpers.proxyWrapErrorWithInvalidate
	});

	module.exports = Read;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PositiveWriteStrategy = __webpack_require__(15);

	module.exports = PositiveWriteStrategy.extend({ _method: 'update' });


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var PositiveWriteStrategy = __webpack_require__(15);

	module.exports = PositiveWriteStrategy.extend({ _method: 'patch' });


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Hoard = __webpack_require__(2);
	var Strategy = __webpack_require__(6);

	// The Delete Strategy clears aggressively clears a cached item
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
	var Strategy = __webpack_require__(6);
	var StrategyHelpers = __webpack_require__(16);

	// A strategy for caching a successful response. Subclasses declare a sync method to adhere use
	module.exports = Strategy.extend({
	  // Cache the response.
	  // If cacheOptions.generateKeyFromResponse is true,
	  // cache using the key from the response, rather than the request
	  execute: function (model, options) {
	    var cacheOptions = _.extend({}, options, _.result(this, 'cacheOptions'));
	    options.success = this._wrapSuccessWithCache(this._method, model, cacheOptions);
	    return Hoard.sync(this._method, model, options);
	  },

	  cacheOptions: {},

	  _wrapSuccessWithCache: StrategyHelpers.proxyWrapSuccessWithCache
	});


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(7);
	var Hoard = __webpack_require__(2);

	var getStoreActionResponse = function (options) {
	  return function () {
	    if (options.onStoreAction) {
	      options.onStoreAction();
	    }
	  }
	};

	var storeResponse = function (context, key, response, options) {
	  var meta = context.policy.getMetadata(key, response, options);
	  var onStoreComplete = getStoreActionResponse(options);
	  context.store.set(key, response, meta).then(onStoreComplete, onStoreComplete);
	};

	var invalidateResponse = function (context, key, response, options) {
	  var onStoreComplete = getStoreActionResponse(options);
	  context.store.invalidate(key).then(onStoreComplete, onStoreComplete);
	};

	var wrapMethod = function (context, method, model, options) {
	  var key = context.policy.getKey(model, method);
	  return _.wrap(options[options.targetMethod], function (targetMethod, response) {
	    if (targetMethod) {
	      targetMethod(response);
	    }
	    if (options.generateKeyFromResponse) {
	      key = context.policy.getKey(model, method);
	    }
	    if (options.responseHandler) {
	      options.responseHandler(context, key, response, options);
	    }
	  });
	};

	// Convenience methods for strategies
	var helpers = {
	  proxyWrapSuccessWithCache: function (method, model, options) {
	    return wrapMethod(this, method, model, _.extend({
	      targetMethod: 'success',
	      responseHandler: storeResponse
	    }, options));
	  },

	  proxyWrapErrorWithInvalidate: function (method, model, options) {
	    return wrapMethod(this, method, model, _.extend({
	      targetMethod: 'error',
	      responseHandler: invalidateResponse
	    }, options));
	  }
	};

	module.exports = helpers;

/***/ }
/******/ ])
});
