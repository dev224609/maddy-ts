var config = OktaUtil.getSignInWidgetConfig();
var oktaSignIn = new OktaSignIn(config);

//Validate If User is Authenticated and Session exists.
var oktaAuthClient = oktaSignIn.authClient;
oktaSignIn.authClient.session.get()
	.then(function(session) {
		// logged in
		console.log("session: user logged in");
		
		if (session.userId != null) {
			var userInfoUrl = `https://beta.tslog.in/api/v1/users/${session.userId}`;
			redirectToDefaultOrg(userInfoUrl);
		} else {
			renderOktaWidget();
		}


	})
	.catch(function(err) {
		// not logged in
		console.log("No Session exits");

	});

//Get ClientID from Request Context
function getClientId() {
	if (!OktaUtil) return undefined;
	var requestContext = OktaUtil.getRequestContext();
	if (requestContext && requestContext.target && requestContext.target.clientId) {
		return requestContext.target.clientId;
	}
}

//Get UserInfo and redirect DefaultOrg url
function redirectToDefaultOrg(userInfoUrl) {
	console.log("userInfoUrl: " + userInfoUrl);
	const Http = new XMLHttpRequest();
	Http.open("GET", userInfoUrl, true);
	//Http.setRequestHeader('Access-Control-Allow-Origin', '*')
	Http.send();
	Http.onreadystatechange = (e) => {
		if (Http.readyState === 4 && Http.status === 200) {
			var jsonResponse = JSON.parse(Http.responseText);
			console.log("jsonResponse: " + jsonResponse);
			if (typeof jsonResponse.profile.defaultOrgUrl !== 'undefined' && jsonResponse.profile.defaultOrgUrl) {
				window.location.replace(jsonResponse.profile.defaultOrgUrl);
			}
		} else {
			console.log("Error When getting UserInfo from Session");
		}
	}
}

//Render Okta Wgidget
function renderOktaWidget() {
	//Get the clientId from Request Context
	const clientId = getClientId();
	if (clientId != null) {
		const samlConnUrl = `https://api.tslog.in/okta/v1/public/${clientId}/saml/connections`;
		updateSamlConnInConfig(samlConnUrl);
	}

	// Render the Okta Sign-In Widget
	oktaSignIn.renderEl({
		el: '#okta-login-container'
	}, OktaUtil.completeLogin, function(error) {
		// Logs errors that occur when configuring the widget.
		// Remove or replace this with your own custom error handler.
		console.log(error.message, error);
	});

	oktaSignIn.on('afterRender', function(context) {
		updateSignInWidget();
		updateForgotPwdWidget();
		updatePWDResetWidget();
	});
}

//Update SAML Connections as Secondary Auth
function updateSamlConnInConfig(samlConnUrl) {
	jQuery.ajax({
		url: samlConnUrl,
		async: false,
		cache: false,
		success: function(response) {
			if (response != null) {
				config.idps = eval(response);
				config.idpDisplay = "SECONDARY";
			}
		},
		error: function(response) {
			console.error(response);
		}
	});
}

//update Primary Auth Form
function updateSignInWidget() {
	const primeAuth = document.getElementsByClassName('primary-auth');
	if (primeAuth.length) {
		//Removes label for Username text field
		document.getElementsByClassName("okta-form-label o-form-label")[0].innerText = "";
		//Removes label for Password text field
		document.getElementsByClassName("okta-form-label o-form-label")[1].innerText = "";
		//Adds a placeholder for Username text field
		document.getElementById("okta-signin-username").placeholder = "Username";
		//Adds a placeholder for Password text field
		document.getElementById("okta-signin-password").placeholder = "Password";
	}

	//Moves the Forgot Password link when Saml Conn url displayed
	const socialAuthButton = document.getElementsByClassName('social-auth-button');
	if (socialAuthButton.length) {
		var element = document.getElementById("help-links-container");
		element.style.bottom = "144px";
	}
}

//update ForgotPWd Form
function updateForgotPwdWidget() {
	var forgotPwd = document.getElementById('account-recovery-username');
	if (forgotPwd) {
		//updates label for forgot Pws txt field
		document.getElementsByClassName("okta-form-label o-form-label")[0].innerText = "Username*";
		//Adds a placeholder for the text field
		forgotPwd.placeholder = "Username";
		//Update Text for Button
		document.querySelectorAll('[data-se="email-button"]')[0].text = "Request reset link";
		//Hide Footer links
		document.getElementsByClassName("auth-footer")[0].hidden = true;

		const forgotPwdTitle = document.createElement('div');
		forgotPwdTitle.className = "forgot-pwd-title";
		const titleText = document.createTextNode('Forgot Password?');
		forgotPwdTitle.appendChild(titleText);
		const subHeaderEle = document.createElement('p');
		const subHeaderText = document.createTextNode("We will email you a password reset link.");
		subHeaderEle.appendChild(subHeaderText);
		subHeaderEle.className = "forgot-pwd-subtitle";
		forgotPwdTitle.appendChild(subHeaderEle);
		const formContent = document.querySelectorAll('[data-se="o-form-content"]');
		formContent[0].insertBefore(forgotPwdTitle, formContent[0].firstChild);
	}
}

//Update password reset
function updatePWDResetWidget() {
	var passwordResetPage = document.getElementsByClassName("password-reset");
	if (passwordResetPage.length) {
		const containerEle = document.getElementById('okta-sign-in');
		containerEle.style.setProperty("width", "700px", "important");
		document.getElementsByClassName('auth-org-logo')[0].style.display = 'none';
		const headerWrapper = document.createElement('div');
		headerWrapper.className = "pwd-header-wrapper";
		const headerEle = document.createElement('h1');
		const eleText = document.createTextNode('Welcome to Thoughtspot');
		headerEle.appendChild(eleText);
		headerEle.className = "pwd-header-title";
		headerWrapper.appendChild(headerEle);
		const subHeaderEle = document.createElement('p');
		const subHeaderText = document.createTextNode("The first thing you'll need to do is create a secure password");
		subHeaderEle.appendChild(subHeaderText);
		subHeaderEle.className = "pwd-sub-header";
		headerWrapper.appendChild(subHeaderEle);
		const headerContainer = document.getElementsByClassName('okta-sign-in-header');
		headerContainer[0].style.backgroundImage = 'url("http://d3ljtmz6h7c6hh.cloudfront.net/ts/freetrial_header.png")';
		headerContainer[0].style.backgroundSize = 'cover';
		headerContainer[0].style.width = '100%';
		headerContainer[0].appendChild(headerWrapper);
		const inputEle = document.getElementsByTagName('input');
		for (const i in inputEle) {
			inputEle[i].addEventListener("focus", () => {
				document.getElementsByTagName('label')[i].style.setProperty("color", "#2770ef", "important");
			})
			inputEle[i].addEventListener("blur", () => {
				document.getElementsByTagName('label')[i].style.setProperty("color", "#1d232f", "important");
			})
		}
	}
}
