'use strict';

var _ = require('underscore');
var Hoard = require('./backbone.hoard');

// Internal store to keep track of state of locks
// Keyed by lock name
// Stores promises indicating lock access and acquisition
var locks = {};

// Get lock with name lockName if it exists
// Create it and return it if it doesn't exist
var getLock = function (lockName) {
  var lock = locks[lockName];
  if (!lock) {
    lock = {
      accesses: {}
    };
    locks[lockName] = lock;
  }
  return lock;
};

// Return a promise that resolves when all provided promises have either passed or succeeded
// This differs from Promise.all in that it will not fail if any of the given promises fail
var allPromisesComplete = function (promises) {
  var allPromise = _.reduce(promises, function (memo, promise) {
    var nextPromise = function () {
      return promise;
    };
    return memo.then(nextPromise);
  }, Hoard.Promise.resolve());
  return allPromise;
};

// A helper function to wrap a callback with the context of lock access
// Lock access context is maintained to allow access nested within a lock call
var callWithLockContext = function (lock, isInsideLock, callback) {
  return function () {
    lock.isInsideLock = isInsideLock;
    var value = callback();
    delete lock.isInsideLock;
    return value;
  };
};

// A set of methods to
// (1) provide exclusive access to a resource
// (2) provide unbounded access to a resource in the absence of any exclusive access
// This allows normal method behavior, until mutex behavior is needed
// Resources are identified by the lockName
var Lock = {
  // Acquires lock with name lockName if lock is not already acquired or being accessed
  // Otherwise, waits until lock is available
  withLock: function (lockName, callback) {
    var lock = getLock(lockName);
    var lockLater = _.bind(this.withLock, this, lockName, callback);

    if (lock.locked) {
      return lock.locked.then(lockLater);
    } else if (!_.isEmpty(lock.accesses)) {
      return allPromisesComplete(lock.accesses).then(lockLater);
    } else {
      var acquiredLock = Hoard.Promise.resolve()
        .then(callWithLockContext(lock, true, callback))
        .then(function (value) {
          delete lock.locked;
          return value;
        });
      lock.locked = acquiredLock;
      return acquiredLock;
    }
  },

  // Accesses lock with name lockName if lock is not already acquired
  // Otherwise, waits until lock is available
  withAccess: function (lockName, callback) {
    var lock = getLock(lockName);
    if (lock.locked && !lock.isInsideLock) {
      var accessLater = _.bind(this.withAccess, this, lockName, callback);
      return lock.locked.then(accessLater);
    } else {
      var accessId = _.uniqueId('backbone.hoard.lock.access_');
      var access = Hoard.Promise.resolve()
        .then(callWithLockContext(lock, lock.isInsideLock, callback))
        .then(function (value) {
          delete lock.accesses[accessId];
          return value;
        });
      lock.accesses[accessId] = access;
      return access;
    }
  },

  // Remove a lock
  // Only to be used for testing
  __resetLock: function (lockName) {
    delete locks[lockName];
  }
};

module.exports = Lock;