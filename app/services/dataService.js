(function () {
	angular.module('ExternalAccountsTestModule').factory('dataService', ["$http", "urlService", "MyDataHelps", function ($http, urlService, MyDataHelps) {
		function authenticate() {
			return new Promise(function (resolve, reject) {
				if (MyDataHelps.token) {
					resolve();
				}
				else {
					MyDataHelps.connect().then(function () {
						resolve();
					}).catch(function (error) {
						reject(error);
					});
				}
			});
		}

		function getRequestConfig() {
			return {
				headers: {
					"Authorization": 'Bearer ' + MyDataHelps.token.access_token
				}
			};
		}

        function getProviders(searchText, category = "provider") {
            return authenticate().then(function() {
                return $http.get(`${urlService.apiUrl}externalaccountproviders?search=${searchText ? searchText : ""}&category=${category}`, getRequestConfig());
            });
        }

		function getAccounts() {
			return authenticate().then(function() {
                return $http.get(`${urlService.apiUrl}externalaccounts`, getRequestConfig());
            });
		}

		function fetchAccountData(accountID) {
			return authenticate().then(function() {
                return $http.post(`${urlService.apiUrl}externalaccounts/refresh/${ accountID }`, null, getRequestConfig());
            });
		}
		
		function connectExternalAccount(externalAccountProviderID) {
			authenticate().then(function(){
				MyDataHelps.connectExternalAccount(externalAccountProviderID);
			});
		}

		return {
			getProviders: getProviders,
			getAccounts: getAccounts,
			fetchAccountData: fetchAccountData,
			connectExternalAccount:  connectExternalAccount
		};
	}]);
})();
