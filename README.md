[![Build Status](https://travis-ci.org/cmaher/backbone.hoard.svg?branch=master)](https://travis-ci.org/cmaher/backbone.hoard)

backbone.hoard
--------------

Configurable caching for Backbone. 

#Example
```js
var cacheControl = new Backbone.Hoard.Control();
var MyModel = Backbone.Model.extend({
    url: function () {
        return '/my-models/' + this.id;
    },
    
    sync: cacheControl.getModelSync()
});

var model1 = new MyModel({ id: 1 });
var model2 = new MyModel({ id: 1 });

var fetches = [model1.fetch(), model2.fetch()];

Promise.all(fetches).then(function () {
    // model1 and model2 have the same attributes, returned from the endpoint
    // Only one ajax request has been made
    doStuff();
});
```

#Requirements
 - Backbone >= 1.0.0 
 - underscore >= 1.4.0
 - `localStorage`
 - An es6-compliant `Promise`
 
#API

##Control

The `Control` is the entry point for all Hoard behavior. 
It's primary purpose is to assemble a `Strategy` for each method accepted by Backbone.sync.

###new Control(options)

Creates a `Control` and overwrites the following default options, if provided

- storeClass: the type of `Store` to create and assign to `store`, passed to all strategies
- policyClass: the type of `Policy` to create and assign to `policy`, passed to all strategies
- createStrategyClass: the type of `Strategy` to create and assign to `createStrategy`, used when `sync` is called with method `create`
- readStrategyClass: the type of `Strategy` to create and assign to `readStrategy`, used when `sync` is called with method `read`
- updateStrategyClass: the type of `Strategy` to create and assign to `updateStrategy`, used when `sync` is called with method `update`
- deleteStrategyClass: the type of `Strategy` to create and assign to `deleteStrategy`, used when `sync` is called with method `delete`
- patchStrategyClass: the type of `Strategy` to create and assign to `patchStrategy`, used when `sync` is called with method `patch`

###Control#sync(method, model, options)

Delegates to a strategy determined by `method`. Calls `Strategy#execute` with the provided `model` and `options`.

Returns a `Promise` that resolves if the sync action is successful or rejects if it fails.

###Control#getModelSync

Returns a method that can be assigned `sync` on a `Backbone.Model` or a `Backbone.Controller`. 
The returned method has all of the same properties as the control's `sync` method.

##Policy

###Policy#timeToLive
###Policy#getKey
###Policy#shouldEvictItem
###Policy#getMetadata

##Strategy

###Strategy#execute

##Store

The `Store` encapsulates all interaction with the backing persistence API. 
Even though the default implementation uses `localStorage` for persistence, 
all interactions with `Store` are asynchronous. 
This behavior makes it possible to use other types of client-side storage, such as IndexedDB or WebSQL

###Store#get(key, [options])

Returns a `Promise` that resolves with the cached item associated with the given `key` if it exists, 
or a rejected `Promise` if the item is not in the cache.

`options` are provided for custom implementations.


###Store#set(key, item, meta, [options])

Store the given `item` in the cache under the given `key`. 
Additionally, store the provided `metadata` containing information that Hoard needs to manage the cached item.

Returns a `Promise` that resolves when the given item and metadata are stored
or rejects if an error occurs when storing either value.

`options` are provided for custom implementations.

###Store#invalidate(key, [options])

Remove the item and metadata associated with the given `key` from the cache.

Returns a `Promise` that resolves when the item is removed from the cache.

`options` are provided for custom implementations.

###Store#getMetadata(key, [options])

Returns a `Promise` that resolves with either the metadata associated with the given `key` 
or an empty object if no metadata is found.

`options` are provided for custom implementations.

#Configuration

Hoard uses reasonable defaults for it's external dependencies, but they can be configured, if desired.

##Hoard.Promise

Hoard will use the native Promise (`window.Promise`) implementation, if it exists. 
If no Promise implementation is provided, Hoard will wrap jQuery.Deferred, but it is recommended to use a fully 
[Promises/A+](https://promisesaplus.com/) compliant implementation.
Optionally, Hoard can be configured with any Promise implementation providing es6-compliant implementations of:

 - `new Promise(resolve, reject)`
 - `Promise.resolve(r)`
 - `Promise.reject(r)`
 - `Promise.all([promises...])`
 
##Hoard.backend

By default, Hoard will use `localStorage` to cache data and metadata.
If support for older browsers is desired, be sure to use a polyfill. 
`Hoard.backend` can also be set to `sessionStorage`, or anything matching a `localStorage` API supporting:

 - `backend.setItem`
 - `backend.getItem`
 - `backend.removeItem`
