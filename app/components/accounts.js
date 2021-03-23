(function (templatePath) {
	var module = angular.module("ExternalAccountsTestModule");

	module.component('accounts', {
		templateUrl: templatePath + "accounts.html",
		bindings: {},
		controller: function (dataService, $scope, urlService, MyDataHelps) {
			var $ctrl = this;

			$ctrl.apiUrl = urlService.apiUrl;

			var onError = function (error) {
				$scope.$apply(function () {
					toastr.error(error);
				});
			}

			$ctrl.getAccounts = function() {
				$ctrl.loading = true;
				 dataService
				 	.getAccounts()
				 	.then(function(response){
				 		$scope.$apply(function(){
				 			$ctrl.accounts = response.data;
				 			$ctrl.loading = false;
						});
					})
					.catch(onError);
			};

			$ctrl.fetchAccountData = function(account) {
				dataService
					.fetchAccountData(account.id)
					.then(function(response){
						$scope.$apply(function(){
							toastr.info("Account data refresh requested!")
					   });
				   })
				   .catch(onError);
			}

			$ctrl.deleteAccount = function(accountID) {
				MyDataHelps.deleteExternalAccount(accountID)
				 	.then(function(response){
						if(response.success)
						{
							alert("External account deleted successfully!");
							$ctrl.getAccounts();
						}
					})
					.catch(function(response){
						toastr.error(`Could not delete external account. Error: ${response.message}`);
				   });
			};

			$ctrl.connectExternalAccount = function(externalAccountProviderID) {
				MyDataHelps.connectExternalAccount({externalAccountProviderID: externalAccountProviderID})
			}

            $ctrl.$onInit = function () {
				$ctrl.getAccounts();
			};
		}
	});

}(templatePath()));