(function () {
    'use strict';

    var dbUpgradeService = function (dbUpgrade1Service) {

        var _getUpgrades = function() {
            this.dbUpgradeScripts = [
                dbUpgrade1Service
            ];

            // now that we know the locale build the upgrade scripts
            var upgrades = [];
            _.each(this.dbUpgradeScripts, function(script) {
                upgrades.push(script);
            });

            return upgrades;
        };

        return {
            getUpgrades: _getUpgrades
        };
    };
//
    angular.module('ehApp').factory('dbUpgradeService', dbUpgradeService);

})();
