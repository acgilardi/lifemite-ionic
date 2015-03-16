(function() {
    'use strict';

    var dataApiService = function($http, $q, ehConstants) {

        // syncing
        var _syncToServer = function(collections) {
            var commits = [];

            _.each(collections, function(collection, collectionName) {
                _.each(collection, function(item) {
                    var method = 'POST',
                        url = ehConstants.apiUrl + collectionName;

                    if (item.active === false) {
                        method = 'DELETE';
                        url = url + '/' +
                        item.id;
                    } else if(item.modifyServerDate !==
                        '1970-01-01T00:00:00+00:00') {
                        method = 'PUT';
                        url = url + '/' +
                        item.id;
                    }
                    commits.push(_action(method, url, item));
                });
            }, commits);

            return $q.all(commits);
        };
        var _syncFromServer = function(collections) {
            var commits = {};

            _.each(collections, function(syncDate, collectionName) {
                var url = ehConstants.apiUrl + collectionName +
                    "?$filter=modifyDate gt DateTime'" + syncDate + "'";
                commits[collectionName] = _action('GET', url);
            }, commits);

            return $q.all(commits);
        };

        // generic
        //TODO: does this properly handle all success and error cases
        var _action = function(method, url, data) {
            return $http({
                method: method,
                url: url,
                timeout: 15000,
                //headers: {'Content-Type': false, 'Authorization': globalServ.make_base_auth()},
                //transformRequest: formDataObject,
                data: data
            }).then(function onSuccess(response) {
                return response.data.entity;
            }, function onError(error) {
                //TODO: Handle logging errors
                console.log(error);
            });
        };

        return {
            syncToServer: _syncToServer,
            syncFromServer: _syncFromServer
        };
    };

    angular.module('ehApp').factory('dataApiService', dataApiService);
})();
