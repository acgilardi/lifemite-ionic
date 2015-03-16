(function() {
    'use strict';

    var dataSyncService =
        function($rootScope, $q, $http, dbConstants, dataLocalService,
                 dataApiService, localStorageService) {

            // managements
            var _getManagements = function() {
                var deferred = $q.defer();

                // is it time to sync
                if (!_syncStale()) {
                    dataLocalService.getManagements()
                        .then(function(managements) {
                            deferred.resolve(managements);
                        });
                } else {
                    _sync()
                        .then(dataLocalService.getManagements)
                        .then(function(managements) {
                            console.log('get local managements: count=' +
                            managements.length);

                            // set sync date
                            localStorageService.set('sync', { date: moment() });

                            deferred.resolve(managements);
                        })
                        .catch(function(error) {
                            console.log('a fail');
                            deferred.reject(error);
                        }
                    );
                }

                return deferred.promise;
            };

            // organizations
            var _getOrganizations = function() {
                var deferred = $q.defer();

                // is it time to sync
                if (!_syncStale()) {
                    dataLocalService.getOrganizations().then(
                        function (organizations) {
                            deferred.resolve(organizations);
                        }
                    );
                } else {
                    _sync()
                        .then(dataLocalService.getOrganizations)
                        .then(function(organizations) {
                            console.log('get local organizations: count=' +
                            organizations.length);

                            // set sync date
                            localStorageService.set('sync', { date: moment() });

                            deferred.resolve(organizations);
                        })
                        .catch(function(error) {
                            console.log('a fail');
                            deferred.reject(error);
                        }
                    );
                }

                return deferred.promise;
            };

            // Incidents
            var _getIncidents = function() {
                var deferred = $q.defer();

                // is it time to sync
                if (!_syncStale()) {
                    //return dataLocalService.getIncidents();
                    dataLocalService.getIncidents().then(function (incidents) {
                        var cnt = 0;
                        if (incidents) {
                            cnt = incidents.length;
                        }
                        console.log('get local incidents: count=' + cnt);

                        deferred.resolve(incidents);
                    });
                } else {
                    _sync()
                        .then(dataLocalService.getIncidents)
                        .then(function(incidents) {

                            var cnt = 0;
                            if (incidents) {
                                cnt = incidents.length;
                            }
                            console.log('sync/get local incidents: count=' + cnt);

                            // set sync date
                            localStorageService.set('sync', { date: moment() });

                            deferred.resolve(incidents);
                        })
                        .catch(function(error) {
                            console.log('a fail');
                            deferred.reject(error);
                        }
                    );
                }



                return deferred.promise;
            };
            var _saveIncident = function (incident) {
                var deferred = $q.defer();

                // if data is not stale just save local
                if (!_syncStale()) {
                    dataLocalService.saveIncident(incident)
                        .then(function(incident) {
                            deferred.resolve(incident);
                        });
                } else {
                    // data must be stale so save local and then sync
                    dataLocalService.saveIncident(incident)
                        .then(_sync)
                        .then(function(incident) {
                            console.log('saved incident');

                            // set sync date
                            localStorageService.set('sync', { date: moment() });

                            deferred.resolve(incident);
                        })
                        .catch(function(error) {
                            console.log('failed save incident');
                            deferred.reject(error);
                        }
                    );
                }

                return deferred.promise;
            };

            // Syncing
            var _sync = function() {
                console.log(arguments);
                console.log('sync - START');
                var deferred = $q.defer();

                // if good connection
                if ($rootScope.online) {
                    // sync stuff out to the server first
                    _syncToServer()
                        .then(_syncFromServer)
                        .then(function () {
                            deferred.resolve();
                        })
                        .catch(function(error) {
                            deferred.reject(error);
                        })
                        .finally(function() {
                            console.log('sync - END');
                        }
                    );
                } else {
                    console.log('SYNC: No sync offline');
                    deferred.resolve();
                }

                return deferred.promise;
            };
            var _syncToServer = function() {
                console.log('start - sync to server');
                var deferred = $q.defer();
                var actions = {};

                _.each(dbConstants.syncBoth, function(collectionName) {
                    actions[collectionName] =
                        dataLocalService.getSyncItems(collectionName);
                });

                $q.all(actions)
                    .then(dataApiService.syncToServer)
                    .then(dataLocalService.syncCleanup)
                    .then(function() {
                        console.log('end - sync to server');
                        deferred.resolve();
                    })
                    .catch(function(error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };
            var _syncFromServer = function() {
                console.log('start - sync from server');
                var deferred = $q.defer();
                var actions = {};

                // add all collections that have two way sync
                _.each(dbConstants.syncBoth, function(collectionName) {
                    actions[collectionName] =
                        dataLocalService.getSyncDate(collectionName);
                });

                // add all collections that have only fetch sync
                _.each(dbConstants.syncFetch, function(collectionName) {
                    actions[collectionName] =
                        dataLocalService.getSyncDate(collectionName);
                });

                $q.all(actions)
                    .then(dataApiService.syncFromServer)
                    .then(dataLocalService.saveAll)
                    .then(
                    function(error) {
                        if (error) {
                            console.log('error - sync to server');
                        }
                        console.log('end - sync to server');
                        deferred.resolve();
                    })
                    .catch(function(error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };
            var _syncStale = function() {
                var lastSync = localStorageService.get('sync');
                if (lastSync) {
                    var secondsDiff = moment().diff(lastSync.date, 'seconds');
                    console.log('sync in ' +
                        (dbConstants.syncAfterSecs - secondsDiff) + ' secs');
                    return secondsDiff > dbConstants.syncAfterSecs;
                }

                return true;
            };

            return {
                sync: _sync,

                // incident
                getIncidents: _getIncidents,
                saveIncident: _saveIncident,

                // organization
                getOrganizations: _getOrganizations,

                // management
                getManagements: _getManagements
            };
        };

    angular.module('ehApp').factory('dataSyncService', dataSyncService);

})();
