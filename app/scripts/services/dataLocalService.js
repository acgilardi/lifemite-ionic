(function() {
    'use strict';

    var dataLocalService = function(
        $q, dbManagerService, dbConstants, moment, uuidService) {

        var _collections = function() {
            return dbManagerService.collections;
        };

        // syncing
        var _getSyncItems = function (collectionName) {
            var deferred = $q.defer();

            dbManagerService.db[collectionName]
                .find({synced: false})
                .get(function(error, items) {
                    if (error) {
                        //TODO: Log error
                        console.log('ERROR: _getSyncItems ' + collectionName);
                        deferred.reject();
                    } else {
                        deferred.resolve(items);
                    }
                }
            );

            return deferred.promise;
        };
        var _getDeletedItems = function (collectionName) {
            var deferred = $q.defer();

            dbManagerService.db[collectionName]
                .find({active: false})
                .get(function(error, items) {
                    if (error) {
                        //TODO: Log error
                        console.log('ERROR: _getDeletedItems ' +
                            collectionName);
                        deferred.reject();
                    } else {
                        deferred.resolve(items);
                    }
                }
            );

            return deferred.promise;
        };
        var _getSyncDate = function (collectionName) {
            var deferred = $q.defer();

            dbManagerService.db[collectionName]
                .find()
                .sort({modifyServerDate: 1})
                .limit(1)
                .get(function (error, item) {
                    if (error) {
                        //TODO: log error
                        console.log('ERROR: _getSyncDate ' + collectionName);
                        deferred.reject();
                    } else {
                        /* jshint -W055 */
                        var modifyServerDate = (new moment(
                            { year :1970, month :1, day :1 })).format();

                        if (item && item.modifyServerDate) {
                            modifyServerDate = item.modifyServerDate;
                        }
                        deferred.resolve(modifyServerDate);
                    }
                }
            );

            return deferred.promise;
        };
        var _syncCleanup = function (collections) {
            var deferred = $q.defer();

            _setSyncTrue()
                .then(_removeDeleted)
                .then(function() {
                    return deferred.resolve();
                });

            return deferred.promise;
        };
        var _setSyncTrue = function() {
            var deferred = $q.defer();

            // update synced to true
            var actions = {};
            _.each(dbConstants.syncBoth, function(collectionName) {
                actions[collectionName] =
                    _getSyncItems(collectionName);
            });
            $q.all(actions)
                .then(function(syncedItems) {
                    _.each(syncedItems, function(collection) {
                        _.each(collection, function(item) {
                            item.synced = true;
                            item.modifyServerDate = item.modifyDate;
                        });
                    });

                    return syncedItems;
                })
                .then(function(items) {
                    _saveAll(items);
                })
                .then(function() {
                    return deferred.resolve();
                })
                .catch(function(error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };
        var _removeDeleted = function() {
            var deferred = $q.defer();
            var actions = {};
            _.each(dbConstants.syncBoth, function(collectionName) {
                actions[collectionName] =
                    _getDeletedItems(collectionName);
            });
            $q.all(actions)
                .then(function(items) {
                    _removeAll(items);
                })
                .then(function() {
                    return deferred.resolve();
                })
                .catch(function(error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        // generic
        var _saveAll = function(collections) {
            var deferred = $q.defer();

            dbManagerService.db.saveAll(collections)
                .then(function() {
                    console.log('dataLocalService.saveAll');
                    deferred.resolve();
                })
                .catch(function() {
                    //TODO: log error
                    console.log('ERROR: _saveAll');
                    deferred.reject();
                })
;
            return deferred.promise;
        };
        var _removeAll = function(collections) {
            var deferred = $q.defer();

            dbManagerService.db.removeAll(collections)
                .then(function() {
                    console.log('dataLocalService.removeAll');
                    deferred.resolve();
                })
                .catch(function() {
                    //TODO: log error
                    console.log('ERROR: _removeAll');
                    deferred.reject();
                });

            return deferred.promise;
        };

        // managements
        var _getManagements = function() {
            var deferred = $q.defer();
            dbManagerService.db.management
                .find()
                //.sort({name: 1})
                .get(function(error, managements) {
                    if (error) {
                        //TODO: log error
                        console.log('ERROR: _getManagements');
                        deferred.reject();
                    } else {
                        deferred.resolve(managements);
                    }
                }
            );
            return deferred.promise;
        };

        // organizations
        var _getOrganizations = function() {
            var deferred = $q.defer();
            dbManagerService.db.organization
                .find()
                //.sort({name: 1})
                .get(function(error, organizations) {
                    if (error) {
                        //TODO: log error
                        console.log('ERROR: _getOrganizations');
                        deferred.reject();
                    } else {
                        deferred.resolve(organizations);
                    }
                }
            );
            return deferred.promise;
        };

        // incidents
        var _getIncidents = function() {
            var deferred = $q.defer();
            dbManagerService.db.incident
                .find({active: true})
                .sort({modifyServerDate: 1})
                .get(function(error, incidents) {
                    if (error) {
                        //TODO: log error
                        console.log('ERROR: _getIncidents');
                        deferred.reject();
                    } else {
                        deferred.resolve(incidents);
                    }
                }
            );
            return deferred.promise;
        };
        var _saveIncident = function(incident) {
            var deferred = $q.defer();
            console.log('SAVE INCIDENT: Start');

            dbManagerService.db.incident.save(incident,
                function(error, incident) {
                    if (error) {
                        //TODO: log error
                        console.log('ERROR: _saveIncident');
                        deferred.reject();
                    } else {
                        console.log('SAVE INCIDENT: Complete');
                        deferred.resolve(incident);
                    }
                }
            );

            return deferred.promise;
        };
        var _newIncident = function () {
            return {
                active: true,
                city: null,
                complexityLevel: null,
                cost: null,
                costTotal: null,
                county: null,
                createDate: null,
                createUserId: null,
                description: null,
                endDate: null,
                hazmat: null,
                id: uuidService.newuuid(),
                identifier: null,
                landSurvey: null,
                latitude: null,
                locationDescription: null,
                longitude: null,
                managementId: null,
                modifyDate: null,
                modifyServerDate: moment.utc('1970-01-01T00:00:00').format(),
                modifyUserId: null,
                name: null,
                organizationId: null,
                percentContained: null,
                size: null,
                sizeUnit: null,
                startDate: null,
                state: null,
                synced: false,
                weather: null
            };
        };

        // users
        var _addUpdateUser = function(user, encPassword) {
            var deferred = $q.defer();
            console.log("ADD USER: Start");

            // does user exist
            _getUser(user.email)
                .then(function(existingUser) {
                    if(existingUser) {
                        user.token = existingUser.token;
                        user.userName = existingUser.userName;
                        user.roles = existingUser.roles;
                        user.password = existingUser.password;
                    }

                    dbManagerService.db.user.save(user, function(error, user) {
                        if (error) {
                            //TODO: log error
                            console.log('ERROR: _addUser');
                            deferred.reject();
                        } else {
                            console.log('ADD USER: Complete');
                            deferred.resolve(user);
                        }
                    });
                }
            );

            return deferred.promise;
        };
        var _getUser = function(userName) {
            var deferred = $q.defer();
            dbManagerService.db.user
                .findOne({userName: userName})
                .get(function(error, user) {
                    if (error) {
                        //TODO: log error
                        console.log('ERROR: _getIncidents');
                        deferred.reject();
                    } else {
                        deferred.resolve(user);
                    }
                });
            return deferred.promise;
        };
        var _removeUser = function(email) {

        };

        return {
            // sync
            collections: _collections,
            getSyncItems: _getSyncItems,
            getSyncDate: _getSyncDate,
            syncCleanup: _syncCleanup,

            // managements
            getManagements: _getManagements,

            // organizations
            getOrganizations: _getOrganizations,

            // incidents
            getIncidents: _getIncidents,
            saveIncident: _saveIncident,
            newIncident: _newIncident,

            // user
            addUpdateUser: _addUpdateUser,
            getUser: _getUser,
            removeUser: _removeUser,

            // misc
            saveAll: _saveAll
        };
    };

    angular.module('ehApp').factory('dataLocalService', dataLocalService);

})();
