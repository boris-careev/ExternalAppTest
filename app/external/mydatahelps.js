var MyDataHelps = {};
// For backwards compatibility
var RKStudioClient = {};
(function () {
	var accessTokenRenewalBufferSeconds = 120;
	var currentMessageID = 1;
	var messageHandlers = [];
	var registeredEventHandlers = {};
	var apiBasePath = 'api/v1/delegated/';

	function acceptableApplicationHost(parentOrigin) {
		var allowedApplicationHosts = [
			'localhost',
			'careevolution.com',
			'internal',
			'b3-deploys.com',
			'mydatahelps.org',
			'platform.joinallofus.org',
			'careevolution.dev',
			'ce.dev'
		];

        var sourceURL = new URL(parentOrigin);
        for (var k = 0; k < allowedApplicationHosts.length; k++) {
            if (sourceURL.hostname.endsWith(allowedApplicationHosts[k])) {
                return true;
            }
        }
        return false;
    }

	var applicationHost = document.location.ancestorOrigins[0];
	if(!!applicationHost && !acceptableApplicationHost(applicationHost)) {
		throw "Application is not hosted at an approved origin.";
	}

	var supportedActions;
	if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ResearchKit) {
		supportedActions = {
			"GetDelegatedAccessToken": function (data) { window.parent.postMessage({ name: 'GetDelegatedAccessToken', messageID: data.messageID }, applicationHost) }
		};
	}
	else {
		supportedActions = {
			"GetDelegatedAccessToken": function (data) { window.parent.postMessage({ name: 'GetDelegatedAccessToken', messageID: data.messageID }, applicationHost) },
			"StartParticipantSurvey": function (data) { window.parent.postMessage({ name: 'StartParticipantSurvey', messageID: data.messageID, surveyName: data.surveyName }, applicationHost) },
			"OpenExternalLink": function (data) { window.parent.postMessage({ name: 'OpenExternalUrl', url: data }, applicationHost) },
			"OpenEmbeddedLink": function (data) { window.parent.postMessage({ name: 'OpenEmbeddedUrl', url: data }, applicationHost) },
			"OpenExternalApplication": function (data) { window.parent.postMessage({ name: 'OpenApplication', messageID: data.messageID, url: data.url, modal: data.modal }, applicationHost) },
			"Dismiss": function () { window.parent.postMessage({ name: 'Dismiss' }, applicationHost) },
			"PopNavigation": function () { window.parent.postMessage({ name: 'Back' }, applicationHost) },
			"ShowTab": function (data) { window.parent.postMessage({ name: 'ShowTab', tabKey: data }, applicationHost) },
			"ShowParticipantDashboard": function (data) { window.parent.postMessage({ name: 'ShowParticipantDashboard', dashboardKey: data.dashboardKey, modal: data.modal }, applicationHost) },
			"ShowParticipantWebVisualization": function (data) { window.parent.postMessage({ name: 'ShowParticipantWebVisualization', visualizationKey: data.visualizationKey, parameters: data.parameters, modal: data.modal }, applicationHost) },
			"DeleteProviderAccount": function (data) { window.parent.postMessage({ name: 'DeleteProviderAccount', messageID: data.messageID, accountID: data.accountID }, applicationHost) },
			"ConnectExternalAccount": function (data) { window.parent.postMessage({ name: 'ConnectExternalAccount', messageID: data.messageID, externalAccountProviderID: data.externalAccountProviderID }, applicationHost) }
		};
	}

	var supportedEvents = ["surveyDidFinish", "applicationDidBecomeVisible"];

	function windowHasAnyActions() {
		for (var action in supportedActions) {
			if (window.webkit.messageHandlers[action]) {
				return true;
			}
		}
		return false;
	}

	if (!window.webkit || !window.webkit.messageHandlers || !windowHasAnyActions()) {
		window.webkit = {
			messageHandlers: {}
		};
	}

	for (var action in supportedActions) {
		window.webkit.messageHandlers[action] = window.webkit.messageHandlers[action] || { postMessage: supportedActions[action] };
	}

	var nextMessageID = function () {
		return currentMessageID++;
	};

	var receiveWindowMessage = function (message) {
		if(message.origin !== applicationHost) {
			throw "event.origin '" + message.origin + "' is not allowed.";
		}

		if (message.data.messageID) {
			MyDataHelps.setActionResult(message.data);
		}
		else {
			MyDataHelps.triggerEvent(message.data);
		}
	};

	window.addEventListener("message", receiveWindowMessage, false);

	MyDataHelps.setActionResult = function (data) {
		messageHandlers[data.messageID](data);
	};

	RKStudioClient.setActionResult = function (data) {
		MyDataHelps.setActionResult(data);
	};

	MyDataHelps.triggerEvent = function (event) {
		var eventName = event.type;
		if (supportedEvents.includes(eventName) && registeredEventHandlers[eventName]) {
			registeredEventHandlers[eventName].forEach(function (handler) {
				handler(event);
			});
		}
	}

	//Authorization

	var refreshTokenPromise = null;
	MyDataHelps.connect = function () {
		var refreshDelegatedAccessToken = function () {
			MyDataHelps.token = null;

			refreshTokenPromise = new Promise(function (resolve, reject) {
				var messageID = nextMessageID();
				messageHandlers[messageID] = function (tokenResponse) {
					if (tokenResponse.success) {
						MyDataHelps.tokenExpires = Date.now() + (tokenResponse.data.expires_in * 1000);
						MyDataHelps.token = tokenResponse.data;
						MyDataHelps.baseUrl = tokenResponse.baseUrl;
						window.setTimeout(refreshDelegatedAccessToken, ((tokenResponse.data.expires_in - accessTokenRenewalBufferSeconds) * 1000));
						resolve();
					} else {
						MyDataHelps.token = null;
						reject(tokenResponse.message);
					}
					messageHandlers[messageID] = null;
					refreshTokenPromise = null;
				};

				window.webkit.messageHandlers.GetDelegatedAccessToken.postMessage({ messageID: messageID });
			});
		};

		if (MyDataHelps.token && Date.now() < MyDataHelps.tokenExpires) {
			return Promise.resolve();
		}

		if (!refreshTokenPromise) {
			refreshDelegatedAccessToken();
		}

		// Re-use promise if refresh already in progress
		return refreshTokenPromise;
	};

	//Actions

	MyDataHelps.startSurvey = function (surveyName) {
		var messageID = nextMessageID();
		window.webkit.messageHandlers.StartParticipantSurvey.postMessage({ messageID: messageID, surveyName: surveyName });
	};

	MyDataHelps.openExternalUrl = function (url) {
		window.webkit.messageHandlers.OpenExternalLink.postMessage(url);
	};

	MyDataHelps.openEmbeddedUrl = function (url) {
		window.webkit.messageHandlers.OpenEmbeddedLink.postMessage(url);
	};

	MyDataHelps.openApplication = function (url, options) {
		var messageID = nextMessageID();
		window.webkit.messageHandlers.OpenExternalApplication.postMessage({ messageID: messageID, url: url, modal: options && options.modal ? true : false });
	};

	MyDataHelps.dismiss = function () {
		window.webkit.messageHandlers.Dismiss.postMessage({});
	};

	MyDataHelps.back = function () {
		window.webkit.messageHandlers.PopNavigation.postMessage({});
	};

	MyDataHelps.showTab = function (tabKey) {
		window.webkit.messageHandlers.ShowTab.postMessage(tabKey);
	};

	MyDataHelps.showDashboard = function (dashboardKey, options) {
		window.webkit.messageHandlers.ShowParticipantDashboard.postMessage({
			dashboardKey: dashboardKey,
			modal: options && options.modal ? true : false,
			title: options && options.title ? options.title : undefined
		});
	};

	MyDataHelps.showWebVisualization = function (visualizationKey, parameters, options) {
		window.webkit.messageHandlers.ShowParticipantWebVisualization.postMessage({
			visualizationKey: visualizationKey,
			parameters: parameters,
			modal: options && options.modal ? true : false,
			title: options && options.title ? options.title : undefined
		});
	};

	MyDataHelps.setStatusBarStyle = function (style) {
		if (window.webkit.messageHandlers.SetStatusBarStyle) {
			window.webkit.messageHandlers.SetStatusBarStyle.postMessage({ style: style });
		}
	};

	MyDataHelps.requestReview = function (cooldownDays) {
		if (window.webkit.messageHandlers.RequestReview) {
			window.webkit.messageHandlers.RequestReview.postMessage({ cooldownDays: cooldownDays });
		}
	};

	MyDataHelps.getDeviceInfo = function () {
		return new Promise(function (resolve, reject) {
			var messageID = nextMessageID();
			messageHandlers[messageID] = function (deviceInfoResponse) {
				resolve(deviceInfoResponse.data);
			};

			if (window.webkit.messageHandlers.GetDeviceInfo) {
				window.webkit.messageHandlers.GetDeviceInfo.postMessage({ messageID: messageID });
			} else {
				reject();
			}
		});
	};

	MyDataHelps.deleteExternalAccount = function (accountID) {
		return new Promise(function ( resolve, reject) {
			var messageID = nextMessageID();
			messageHandlers[messageID] = function (deleteProviderAccountResponse) {
				if(deleteProviderAccountResponse.message)
				{
					reject(deleteProviderAccountResponse)
				}
				else
				{
					resolve(deleteProviderAccountResponse);
				}
			};
	
			if (window.webkit.messageHandlers.DeleteProviderAccount) {
				window.webkit.messageHandlers.DeleteProviderAccount.postMessage({ messageID: messageID, accountID: accountID });
			} else {
				reject();
			}
		});
	}
	
	MyDataHelps.connectExternalAccount = function (externalAccountProviderID, redirectPath) {
		return new Promise(function(){
			var messageID = nextMessageID();
			messageHandlers[messageID] = function(connectExternalAccountResponse){
				if(connectExternalAccountResponse.message)
				{
					reject(connectExternalAccountResponse)
				}
				else
				{
					resolve(connectExternalAccountResponse)
				}
			};

			if (window.webkit.messageHandlers.ConnectExternalAccount) {
				window.webkit.messageHandlers.ConnectExternalAccount.postMessage({ messageID: messageID, externalAccountProviderID: externalAccountProviderID, redirectPath: redirectPath });
			} else {
				reject();
			}
		});
	}

	MyDataHelps.getCurrentLanguage = function () {
		var searchParams = new URLSearchParams(window.location.search);
		if (searchParams.has("lang")) {
			return searchParams.get("lang");
		}
		else {
			return navigator.language;
		}
	};

	//Events

	MyDataHelps.on = function (eventName, eventHandler) {

		if (!supportedEvents.includes(eventName)) {
			throw new Error(eventName + " is not a supported event type.");
		}

		if (!registeredEventHandlers[eventName]) {
			registeredEventHandlers[eventName] = [];
		}

		registeredEventHandlers[eventName].push(eventHandler);
	};

	//Data

	var makeRequest = function (endpoint, method, body) {
		if (!MyDataHelps.token || !MyDataHelps.token.access_token) {
			throw "No access_token available for request authorization.";
		}

		var url = MyDataHelps.baseUrl + apiBasePath + endpoint;

		var headers = new Headers();
		headers.append('Authorization', 'Bearer ' + MyDataHelps.token.access_token);
		headers.append('Accept', 'application/json, text/javascript, */*; q=0.01');
		if (!!body) {
			headers.append('Content-Type', 'application/json');
		}

		var init = {
			method: method,
			headers: headers
		};
		if (!!body) {
			init.body = JSON.stringify(body);
		}

		return fetch(url, init);
	};

	var validateResponse = function (response) {
		if (!response.ok) {
			throw response.statusText;
		}

		return response;
	};

	MyDataHelps.getParticipantInfo = function () {
		var endpoint = 'participant';

		return MyDataHelps
			.connect()
			.then(function () { return makeRequest(endpoint, 'GET', null); })
			.then(function (response) { return validateResponse(response); })
			.then(function (response) { return response.json(); });
	};

	MyDataHelps.querySurveyAnswers = function (queryParameters) {
		var queryString = new URLSearchParams(queryParameters).toString();
		var endpoint = 'surveyanswers?' + queryString;

		return MyDataHelps
			.connect()
			.then(function () { return makeRequest(endpoint, 'GET', null); })
			.then(function (response) { return validateResponse(response); })
			.then(function (response) { return response.json(); });
	};

	MyDataHelps.deleteSurveyResult = function (resultID) {
		var endpoint = 'surveyresults/' + encodeURIComponent(resultID);

		return MyDataHelps
			.connect()
			.then(function () { return makeRequest(endpoint, 'DELETE', null); })
			.then(function (response) { return validateResponse(response); })
			.then(function (response) { return; });
	};

	MyDataHelps.queryDeviceData = function (queryParameters) {
		var queryString = new URLSearchParams(queryParameters).toString();
		var endpoint = 'devicedata?' + queryString;

		return MyDataHelps
			.connect()
			.then(function () { return makeRequest(endpoint, 'GET', null); })
			.then(function (response) { return validateResponse(response); })
			.then(function (response) { return response.json(); });
	};

	MyDataHelps.persistDeviceData = function (deviceDataPoints) {
		var endpoint = 'devicedata';

		return MyDataHelps
			.connect()
			.then(function () { return makeRequest(endpoint, 'POST', deviceDataPoints); })
			.then(function (response) { return validateResponse(response); })
			.then(function (response) { return; });
	};

	MyDataHelps.querySurveyTasks = function (queryParameters) {
		var queryString = new URLSearchParams(queryParameters).toString();
		var endpoint = 'surveytasks?' + queryString;

		return MyDataHelps
			.connect()
			.then(function () { return makeRequest(endpoint, 'GET', null); })
			.then(function (response) { return validateResponse(response); })
			.then(function (response) { return response.json(); });
	};

	MyDataHelps.queryNotifications = function (queryParameters) {
		var queryString = new URLSearchParams(queryParameters).toString();
		var endpoint = 'notifications?' + queryString;

		return MyDataHelps
			.connect()
			.then(function () { return makeRequest(endpoint, 'GET', null); })
			.then(function (response) { return validateResponse(response); })
			.then(function (response) { return response.json(); });
	};
})();
