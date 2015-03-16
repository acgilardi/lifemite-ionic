(function () {
    'use strict';

    var authService = function (
        $rootScope,
        $http,
        $q,
        localStorageService,
        dataLocalService,
        ehConstants)
    {
        var authServiceFactory = {};
        var _authentication = {
            isAuth: false,
            userName: '',
            roles: []
        };
        var _login = function (loginData) {
            if($rootScope.online) {
                return _logInOnline(loginData);
            } else {
                return _logInOffline(loginData);
            }
        };
        var _logInOffline = function (loginData) {
            var deferred = $q.defer();

            dataLocalService.getUser(loginData.userName)
                .then(function (user) {
                    if (!user) {
                        console.log('SIGNIN OFFLINE: error');
                        deferred.reject();
                        return;
                    }
                    var decPassword = alphac(
                        user.password, user.token, md5(user.token), 0);

                    if (decPassword === loginData.password) {

                        // set current user in local storage
                        _setLocalStorage(
                            user.token, loginData.userName, user.roles);

                        console.log('SIGNIN OFFLINE: success');
                        deferred.resolve();
                    } else {
                        console.log('SIGNIN OFFLINE: error');
                        deferred.reject();
                    }
                })
                .catch(function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };
        var _logInOnline = function (loginData) {
            var data = 'grant_type=password&username=' + loginData.userName +
                '&password=' + loginData.password;
            var deferred = $q.defer();

            $http.post(ehConstants.baseUrl + 'token', data, { headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }})
                .success(function (response) {
                    var roles = response.roles || '';
                    var rolesArray = roles.split(',');

                    // set current user in local storage
                    _setLocalStorage(
                        response.access_token, loginData.userName, rolesArray);

                    // add users to database
                    dataLocalService.addUpdateUser({
                        token: response.access_token,
                        userName: loginData.userName,
                        roles: rolesArray,
                        password: alphac(loginData.password,
                            response.access_token,
                            md5(response.access_token), 1)
                    }).then(function() {
                        console.log('SIGNIN ONLINE: success');
                        deferred.resolve();
                    }).catch(function(error) {
                        console.log('SIGNIN ONLINE: error');
                        authServiceFactory.logOut();
                        deferred.reject(error);
                    });
                }
            ).error(function (err) {
                    authServiceFactory.logOut();
                    deferred.reject(err);
                }
            );

            return deferred.promise;
        };
        var _setLocalStorage = function (token, userName, roles) {
            // set current user in local storage
            localStorageService.set('authorizationData',
                {
                    token: token,
                    userName: userName,
                    roles: roles
                }
            );
            _authentication.isAuth = true;
            _authentication.userName = userName;
            _authentication.roles = roles;
        };

        var _logOut = function () {
            localStorageService.remove('authorizationData');
            _authentication.isAuth = false;
            _authentication.userName = '';
            _authentication.roles = [];
        };
        var _fillAuthData = function () {
            var authData = localStorageService.get('authorizationData');
            if (authData) {
                _authentication.isAuth = true;
                _authentication.userName = authData.userName;
                _authentication.roles = authData.roles;
            }
        };

        authServiceFactory.login = _login;
        authServiceFactory.logOut = _logOut;
        authServiceFactory.fillAuthData = _fillAuthData;
        authServiceFactory.authentication = _authentication;

        return authServiceFactory;
    };

    angular.module('ehApp').factory('authService', authService);

})();
