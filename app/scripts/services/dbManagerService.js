(function() {
    'use strict';

    var dbManagerService = function($q, dbConstants, dbUpgradeService) {

        this.db = {};

        var _startDb = function() {
            var deferred = $q.defer();
            var self = this;
            var options = {
                name: dbConstants.name,
                version: dbConstants.version,
                forceNew: dbConstants.forceNew,
                upgrades: dbUpgradeService.getUpgrades()
            };

            _defineEngine(options, function(error, db) {
                console.log('database loaded - forceNew:' + options.forceNew);
                self.db = db;
                deferred.resolve();
            });

            //defineEngine(options, function(error, db) {
            //    console.log('database loaded - forceNew:' + options.forceNew);
            //    self.db = db;
            //    callback();
            //});

            return deferred.promise;
        };

        var _defineEngine = function (options, callback) {

            var verifyCollections = function (upgrade, callback) {

                var addCollections = function (upgrade) {

                    var addRecords = function(store) {
                        if (!upgrade.hasOwnProperty('saves')) {
                            return;
                        }

                        // Perform all adds for collections created now
                        _.each(upgrade.saves[collection], function(record) {
                            store.add(record);
                        }, store);

                        delete upgrade.saves[collection];
                    };

                    for (var i = 0; i < options.collections.length; i += 1) {
                        var collection = options.collections[i];
                        if (!db.objectStoreNames.contains(collection)) {
                            var store = db.createObjectStore(collection,
                                {keyPath: 'id', autoIncrement:true});
                            addRecords(store);
                        }
                    }
                };

                var removeCollections = function () {
                    for (var i = 0; i < db.objectStoreNames.length; i += 1) {
                        var collection = db.objectStoreNames[i];
                        if (options.collections.indexOf(collection) === -1) {
                            db.deleteObjectStore(collection);
                        }
                    }
                };

                addCollections(upgrade);
                removeCollections();

                if (typeof callback === 'function') {
                    callback(upgrade);
                }
            };

            var prepareBrowserDbInstance = function (upgrade, callback) {

                var browserDbInstance;

                var getCollectionApiInstance = function (collection) {
                    var _transaction,
                        _store,
                        _query,
                        _sortIndex,
                        _sortOrder,
                        _limit;

                    var _operation = function (item, field, operation) {
                        /*jshint maxcomplexity:20 */
                        for (var operator in operation) {
                            if (operation.hasOwnProperty(operator)) {
                                var value = operation[operator];

                                switch (operator) {
                                    case '$gt':
                                        return item[field] > value;
                                    case '$gte':
                                        return item[field] >= value;
                                    case '$lt':
                                        return item[field] < value;
                                    case '$lte':
                                        return item[field] <= value;
                                    case '$ne':
                                        return item[field] !== value;
                                    case '$nin':
                                        return value instanceof Array &&
                                        value.indexOf(item[field]) === -1;
                                    case '$mod':
                                        return value instanceof Array &&
                                            value.length === 2 &&
                                            item[field] % value[0] ===
                                                value[1];
                                    case '$size':
                                        return item[field] instanceof Array &&
                                            item[field].length === value;
                                    case '$exists':
                                        return Boolean(item[field]) === value;
                                    case '$typeof':
                                        return typeof item[field] === value;
                                    case '$nottypeof':
                                        return typeof item[field] !== value;

                                }
                            }
                        }
                        return false;
                    };

                    var _comparison = function (item, field, value) {
                        if (item[field] instanceof  Array) {
                            return item[field].indexOf(value) !== -1;
                        }

                        return item[field] === value;
                    };

                    var _queryTest = function (query, item) {
                        for (var field in query) {
                            if (query.hasOwnProperty(field)) {

                                var value = query[field];

                                if (typeof value === 'object') {
                                    return _operation(item, field, value);
                                } else {
                                    return _comparison(item, field, value);
                                }
                            }
                        }

                        // no query passed in
                        return true;
                    };

                    var _get = function (callback) {
                        _transaction =
                            db.transaction([collection], 'readonly');
                        _store = _transaction.objectStore(collection);


                        var result = [];
                        var cursorRequest;

                        if (_sortIndex) {
                            var index = _store.index(_sortIndex);

                            // next = descending and prev = ascending
                            var order = _sortOrder === 1 ? 'prev' : 'next';
                            cursorRequest = index.openCursor(null, order);
                        } else {
                            cursorRequest = _store.openCursor();
                        }

                        cursorRequest.onerror = function (event) {
                            callback(event);
                        };
                        cursorRequest.onsuccess = function (event) {
                            var cursor = event.target.result;

                            // we have reached the end
                            if (!cursor) {
                                callback(undefined, _result(result), event);
                                return;
                            }

                            // process next item
                            var getRequest = _store.get(cursor.primaryKey);
                            getRequest.onerror = function (event) {
                                callback(event);
                            };
                            getRequest.onsuccess = function (event) {
                                var item = event.target.result;
                                if (_queryTest(_query, item)) {
                                    result.push(item);
                                }

                                // have we reaced our limit
                                if (_limit && result.length === _limit) {
                                    callback(undefined, _result(result), event);
                                    return;
                                }

                                /* jshint -W024 */
                                cursor.continue();
                            };
                        };
                    };

                    var _result = function(resultArray) {
                        // if we have no items return empty object
                        if (resultArray.length === 0) {
                            return undefined;
                        }

                        // if limit is one return one object not an array
                        var data = resultArray;
                        if (_limit === 1) {
                            data = resultArray[0];
                        }
                        return data;
                    };

                    var _save = function (item, callback) {

                        var transaction =
                            db.transaction([collection], 'readwrite');
                        var store = transaction.objectStore(collection);
                        var putRequest = store.put(item);

                        putRequest.onerror = function (event) {
                            callback(event);
                        };
                        putRequest.onsuccess = function (event) {
                            var getRequest = store.get(event.target.result);
                            getRequest.onerror = function (event) {
                                callback(event);
                            };
                            getRequest.onsuccess = function (event) {
                                callback(
                                    undefined, event.target.result, event);
                            };
                        };
                    };

                    return {
                        save: function(item, callback) {
                            if (typeof callback !== 'function') {
                                throw new Error('callback is not a function');
                            }
                            _save(item, callback);
                        },
                        remove:function () {
                            //_transaction = db.transaction([collection],
                            // "readwrite");
                            //_store = transaction.objectStore(collection);
                            //var query = (typeof arguments[0] === "object") ?
                            // arguments[0] : undefined;
                            //var callback
                            // = (typeof arguments[arguments.length - 1] ===
                            // "function") ? arguments[arguments.length - 1] :
                            // undefined;
                            //findObjectsByQuery(transaction, store, query,
                            // false, function (error, result, event) {
                            //    result.forEach(function (object) {
                            //        store.delete(object.id);
                            //    });
                            //    if (typeof callback === "function")
                            // callback(error, true, event);
                            //});
                        },

                        //TODO: We are duplicateing code in each find method
                        get: function(callback) {
                            if (typeof callback !== 'function') {
                                throw new Error('callback is not a function');
                            }
                            _get(function(error, result, event) {
                                _transaction = undefined;
                                _store = undefined;
                                _query = undefined;
                                _sortIndex = undefined;
                                _sortOrder = undefined;
                                _limit = undefined;
                                callback(error, result, event);
                            });
                        },
                        find:function () {
                            _query = (typeof arguments[0] === 'object') ?
                                arguments[0] : undefined;
                            return this;
                        },
                        sort: function () {
                            /*jshint maxcomplexity:8 */
                            var indexes = (typeof arguments[0] === 'object') ?
                                arguments[0] : undefined;

                            _sortOrder = undefined;
                            var indexCount = 0;
                            for (var indexName in indexes) {
                                if (indexes.hasOwnProperty(indexName)) {
                                    _sortIndex = indexName;
                                    _sortOrder = indexes[indexName];
                                    indexCount = indexCount + 1;
                                }
                            }

                            if (!_sortIndex) {
                                throw new Error('sort index is required');
                            }
                            if (!_sortOrder || indexCount !== 1) {
                                throw new Error('sort order is incorrect');
                            }

                            return this;
                        },
                        limit: function(count) {
                            _limit = count || undefined;
                            return this;
                        },
                        findOne:function () {
                            _query = (typeof arguments[0] === 'object') ?
                                arguments[0] : undefined;
                            _limit = 1;
                            return this;
                        },
                        findById: function (/*id, callback*/) {
                            //transaction = db.transaction([collection],
                            // "readwrite");
                            //store = transaction.objectStore(collection);
                            //var getRequest = store.get(id);
                            //getRequest.onerror = function (event) {
                            //    if (typeof callback === "function")
                            // callback(event);
                            //};
                            //getRequest.onsuccess = function (event) {
                            //    if (typeof callback === "function")
                            // callback(undefined, event.target.result, event);
                            //};
                        }
                    };
                };

                browserDbInstance = {};

                upgrade.collections.forEach(function (collection) {
                    browserDbInstance[collection] =
                        getCollectionApiInstance(collection);
                });

                browserDbInstance.remove = function (callback) {
                    var deleteRequest
                        = indexedDB.deleteDatabase(options.db);
                    deleteRequest.onError = function () {
                        if (typeof callback === 'function') {
                            callback(undefined, event);
                        }
                    };
                    deleteRequest.onSuccess = function (event) {
                        if (typeof callback === 'function') {
                            callback(undefined, event);
                        }
                    };
                };

                browserDbInstance.saveCollectionItems = function (collectionName, items) {
                    var deferred = $q.defer();

                    if (items === undefined || items.length === 0) {
                        deferred.resolve();
                    }

                    _.each(items, function(item) {
                        var transaction =
                            db.transaction(collectionName, 'readwrite');
                        var store = transaction.objectStore(collectionName);

                        transaction.oncomplete = function(event) {
                            deferred.resolve();
                        };

                        transaction.onerror = function(error) {
                            deferred.reject(error);
                        };

                        store.put(item);
                    });

                    return deferred.promise;
                };

                browserDbInstance.removeCollectionItems = function (collectionName, items) {
                    var deferred = $q.defer();

                    if (items === undefined || items.length === 0) {
                        deferred.resolve();
                    }

                    _.each(items, function(item) {
                        var transaction =
                            db.transaction(collectionName, 'readwrite');
                        var store = transaction.objectStore(collectionName);

                        transaction.oncomplete = function(event) {
                            deferred.resolve();
                        };

                        transaction.onerror = function(error) {
                            deferred.reject(error);
                        };

                        store.delete(item.id);
                    });

                    return deferred.promise;
                };

                browserDbInstance.removeAll = function(collectionsItems, callback) {
                    var deferred = $q.defer();

                    var promises = {};

                    _.each(collectionsItems, function(items, collectionName) {
                        promises[collectionName] =
                            browserDbInstance
                                .removeCollectionItems(collectionName, items);
                    });

                    $q.all(promises)
                        .then(function() {
                            deferred.resolve();
                        })
                        .catch(function() {
                            deferred.reject();
                        });

                    return deferred.promise;
                };

                browserDbInstance.saveAll = function(collectionsItems) {
                    var deferred = $q.defer();

                    var promises = {};

                    _.each(collectionsItems, function(items, collectionName) {
                        promises[collectionName] =
                            browserDbInstance
                                .saveCollectionItems(collectionName, items);
                    });

                    $q.all(promises)
                        .then(function() {
                            deferred.resolve();
                        })
                        .catch(function() {
                            deferred.reject();
                        });

                    return deferred.promise;
                };

                if (typeof callback === 'function') {
                    callback(upgrade, browserDbInstance);
                }
            };



            var indexedDB = window._indexedDB || window.indexedDB || window.webkitIndexedDB ||
                window.mozIndexedDB || window.msIndexedDB;

            var db;
            var openDbRequest;
            var openDatabase = function() {
                openDbRequest =
                    indexedDB.open(options.name, options.version);
                openDbRequest.onerror = function (/*event*/) {
                    //TODO: We should handle this
                    console.log('browserdb: error');
                };

                openDbRequest.onsuccess = function (event) {
                    db = event.target.result;
                    prepareBrowserDbInstance(_.last(options.upgrades),
                        callback);
                };

                openDbRequest.onupgradeneeded = function(event) {
                    db = event.target.result;
                    var trans = event.target.transaction;

                    var updateDb = function(upgrade/*, BrowserDb*/) {

                        // handle saves and deletes for existing collections
                        _.each(upgrade.saves,
                            function(records, collectionName) {
                            if(db.objectStoreNames.contains(collectionName)) {
                                var collection =
                                    trans.objectStore(collectionName);
                                _.each(records, function(record) {
                                    collection.add(record);
                                });
                            }
                        }, trans);

                        // handle indexes and deletes for existing collections
                        _.each(upgrade.indexes,
                            function(indexNames, collectionName) {
                            if(db.objectStoreNames.contains(collectionName)) {
                                var store = trans.objectStore(collectionName);
                                _.each(indexNames, function(indexName) {
                                    store.createIndex(indexName, indexName,
                                        { unique: false });
                                });
                            }
                        }, trans);

                        //TODO: Do all upddates here
                        //TODO: Do all deletes here

                        //callback(undefined, BrowserDb);
                    };

                    //ACG: Bug in webkit plugin Bug 136154
                    // oldVersion will have a value = 9223372036854776000
                    // if this is a new database
                    var oldVersion = 0;
                    if (event.oldVersion < 1000) {
                        oldVersion = event.oldVersion;
                    }

                    for (var ver = oldVersion + 1;
                         ver <= event.newVersion; ver += 1)
                    {
                        for(var up = 0; up < options.upgrades.length; up += 1)
                        {
                            var upgrade = options.upgrades[up];

                            if(upgrade.version === ver) {
                                options.collections = upgrade.collections;

                                // this will create collections and add any
                                // upgrade data to these new collections
                                verifyCollections(upgrade, updateDb
                                    //prepareBrowserDbInstance(upgrade,
                                    // updateDb)
                                );
                            }
                        }
                    }
                };
            };

            if(options.forceNew) {
                var reqDelete = indexedDB.deleteDatabase(options.name);
                reqDelete.onerror = function(/*event*/) {
                    //TODO: Handle this
                    console.log('error deleting database');
                };
                reqDelete.onsuccess = function() {
                    openDatabase();
                };
            } else {
                openDatabase();
            }
        };

        return {
            db: this.db,
            // TODO: Find real way to get collections
            collections: ['organization', 'incident'],
            startDb: _startDb
        };
    };

    angular.module('ehApp').factory('dbManagerService', dbManagerService);
})();
