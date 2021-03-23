var templatePath = function () {
	let scripts = document.getElementsByTagName("script");
	let currentScriptPath = scripts[scripts.length - 1].src;
	return currentScriptPath.substring(0, currentScriptPath.lastIndexOf('/') + 1);
};

(function () {
	var module = angular.module("ExternalAccountsTestModule", ["ui.bootstrap"]);

	if (window.MyDataHelps) {
		module.value("MyDataHelps", MyDataHelps);
		module.factory('unauthorizedRequestInterceptor', ['MyDataHelps', function (MyDataHelps) {
			return {
				responseError: function (rejection) {
					if (rejection.status === 401) {
						MyDataHelps.token = null;
					}
				}
			};
		}]);
		module.config(function ($httpProvider) {
			$httpProvider.interceptors.push('unauthorizedRequestInterceptor');
		});
	}

	$(document).ready(function () {
		configureToastr();
		angular.bootstrap($(".app"), ["ExternalAccountsTestModule"]);
	});

	function configureToastr() {
		toastr.options = {
			"closeButton": false,
			"debug": false,
			"newestOnTop": false,
			"progressBar": false,
			"positionClass": "toast-top-full-width",
			"preventDuplicates": false,
			"onclick": null,
			"showDuration": "0",
			"hideDuration": "5000",
			"timeOut": "5000",
			"extendedTimeOut": "5000",
			"showEasing": "swing",
			"hideEasing": "linear",
			"showMethod": "fadeIn",
			"hideMethod": "fadeOut"
		  }
	}
})();