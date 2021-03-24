(function () {
	angular.module('ExternalAccountsTestModule').factory('urlService', ["MyDataHelps", function (MyDataHelps) {
		
		// Update based on what site you are using (b3, prod, localhost, etc.)
        
		//var hostBaseUrl = "http://localhost:64531/WebClient/";
		//var hostBaseUrl = "http://localhost/WebClientTest.Adapter1.WebClient/";
		var hostBaseUrl = "https://mdhorg.ce.dev/MyDataHelps/";
		//var hostBaseUrl = "https://rkstudio.careevolution.dev/inv/"

		var baseUrl = MyDataHelps.baseUrl;
		var apiUrl = hostBaseUrl + "api/v1/delegated/";

		return {
			hostBaseUrl: hostBaseUrl,
			baseUrl: baseUrl,
			apiUrl: apiUrl
		};
	}]);
})();
