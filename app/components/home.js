(function (templatePath) {
	var module = angular.module("ExternalAccountsTestModule");

	module.component('home', {
		templateUrl: templatePath + "home.html",
		bindings: {},
		controller: function (MyDataHelps) {
			var $ctrl = this;

			$ctrl.dismiss = function() {
				MyDataHelps.dismiss();
			}
			
			$ctrl.back = function() {
				MyDataHelps.back();
			}
			
            $ctrl.$onInit = function () {
                //
			};
		}
	});

}(templatePath()));