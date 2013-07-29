/* 
 * AngularJS controllers
 * Open Siddur Project
 * Copyright 2013 Efraim Feinstein <efraim@opensiddur.org>
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

/* controller for login status widget */
OpenSiddurClientApp.controller(
  'AuthenticationWidgetCtrl',
  ['$scope', '$location', 'AuthenticationService',
  function ($scope, $location, AuthenticationService) {
    $scope.loggedIn = false;
    $scope.userName = '';
    
    $scope.signout = function() {
      AuthenticationService.logout();
      $location.path('/signin');
    }
    
    $scope.$on('AuthenticationService.update', 
      function( event, loggedIn, userName, password ) {
        $scope.loggedIn = loggedIn;
        $scope.userName = userName;
      }
    );
  }]
);

/* controller for signin and registration page */
OpenSiddurClientApp.controller(
  'AuthenticationCtrl', 
  ['$scope', '$http', '$location', 'AuthenticationService',
  function ($scope, $http, $location, AuthenticationService){
    $http.defaults.useXDomain = true;
    
    $scope.loggedIn = false;
    $scope.userName = "";
    $scope.password = "";
    $scope.errorMessage = "";
    
    $scope.signin = function() {
      console.log("login")
      
      $http.post(
        host + "/api/login",  
        "<login><user>"+ $scope.userName + 
        "</user><password>"+$scope.password+
        "</password></login>",
        {
          headers: {
            "Content-Type" : "application/xml"
          }
        })
        .success(
            function(data, status, headers, config) {
              AuthenticationService.login($scope.userName, $scope.password);
              $scope.errorMessage = "";
              $scope.loggedIn = true;
              $location.path("/about")
            }
        )
        .error(
            function(data, status, headers, config) {
              $scope.errorMessage = getApiError(data);
            }
        );
      
      
    };
    $scope.register = function() {
      console.log("register")
      $http.post(
        host + "/api/user",  
        "<register><user>"+ $scope.userName + 
        "</user><password>"+$scope.password+
        "</password></register>",
        {
          headers: {
            "Content-Type" : "application/xml"
          }
        })
        .success(
            function(data, status, headers, config) {
              AuthenticationService.login($scope.userName, $scope.password);
              $scope.errorMessage = "";
              $scope.loggedIn = true;
              $location.path("/profile/" + $scope.userName)
            }
        )
        .error(
            function(data, status, headers, config) {
              $scope.errorMessage = getApiError(data);
            }
        );
    
    };
    $scope.signout = function() {
      console.log("sign out")
      $scope.loggedIn = false;
      AuthenticationService.logout();
    };
    $scope.$on('AuthenticationService.update', 
      function( event, loggedIn, userName, password ) {
        $scope.loggedIn = loggedIn;
        $scope.userName = userName;
        $scope.password = password;
      }
    );
    
  }
  ]
);

/* controller for about page */
OpenSiddurClientApp.controller(
  'AboutCtrl',
  ['$scope', 
  function ($scope) {
    console.log("About controller. Nothing to do here.")
  }]
);

/* controller for profile page */
OpenSiddurClientApp.controller(
  'ProfileCtrl',
  ['$scope', '$routeParams', '$http',
  function ($scope, $routeParams, $http) {
    console.log("Profile controller.")
    
    $scope.profile = {
      'errorMessage' : "",
      'userName' : $routeParams.userName,
      'get' : function () {
        $http.get(host + "/api/user/" + this.userName)
          .success(
              function(data, status, headers, config) {
                this.errorMessage = "";
                
              }
          )
          .error(
              function(data, status, headers, config) {
                this.errorMessage = getApiError(data)
              }
          )
        
      },
      'save' : function () {
        $http.put(host + "/api/user/" + this.userName,
            JsonML.toXMLText(this.object),
            {
              headers: {
                "Content-Type" : "application/xml"
              }
            }
        )
        .success(
            function(data, status, headers, config) {
              this.errorMessage = "";
            }
        )
        .error(
            function(data, status, headers, config) {
              this.errorMessage = getApiError(data);
            }  
        );
        
      }
    }
    
    $scope.profile.get()
  }
  ]
);