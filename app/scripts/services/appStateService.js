(function () {
    'use strict';

    var appStateService = function ($q, dataSyncService) {

        this.selectedIncident = {};
        this.organizations = {};
        this.managements = {};
        this.user = {};

        var _initializeData = function () {
            var deferred = $q.defer();

            var self = this;
            console.log('appStateService _initializeData');
            dataSyncService.getOrganizations()
                .then(function (organizations) {
                    self.organizations = organizations;

                    dataSyncService.getManagements()
                        .then(function (managements) {
                            self.managements = managements;
                            deferred.resolve();
                        });
                });

            return deferred.promise;
        };

        return {
            selectedIncident: this.selectedIncident,
            organizations: this.organizations,
            managements: this.managements,
            initializeData: _initializeData,
            user: this.user
        };
    };

    angular.module('ehApp').factory('appStateService', appStateService);

})();
