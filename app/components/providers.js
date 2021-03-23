(function (templatePath) {
	var module = angular.module("ExternalAccountsTestModule");

	module.component('providers', {
		templateUrl: templatePath + "providers.html",
		bindings: {},
		controller: function (dataService, $scope, urlService) {
			var $ctrl = this;

			$ctrl.apiUrl = urlService.apiUrl;

			var onError = function (error) {
				$scope.$apply(function () {
					toastr.error(error);
				});
			}

			$ctrl.getProviders = function() {
				$ctrl.loading = true;
				dataService
					.getProviders($ctrl.searchText)
					.then(function(response){
						$scope.$apply(function(){
							$ctrl.providers = response.data;
							$ctrl.loading = false;
						})
					})
					.catch(onError);
			};

			$ctrl.connectExternalAccount = function(externalAccountProviderID) {
				dataService.connectExternalAccount(externalAccountProviderID);
			}

            $ctrl.$onInit = function () {
				$ctrl.getProviders();
			};
		}
	});

}(templatePath()));