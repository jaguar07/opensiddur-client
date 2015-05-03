/* Query box and list box directive
 *
 * Usage:
 * <os-search-list api="" selection="" selection-description="" />
 *
 * Copyright 2013-2014 Efraim Feinstein, efraim@opensiddur.org
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
osSearchModule.directive(
        'osSearchList',
        [
        'QueryService',
        function( QueryService ) {
            return {
                restrict : 'AE',
                scope : {
                    api : "=",
                    selection : "=",
                    selectionDescription: "=?"
                },
                controller: ['$scope', function ($scope) {
                    console.log("In search list controller");
                    $scope.query = { 
                        q : "", 
                        start : 1, 
                        'max-results' : 100 
                    };
                    $scope.inProgress = false;
                    $scope.results = [];
                    $scope.resultsEnd = true;       // force no scrolling until first load
                    if (!$scope.selectionDescription) $scope.selectionDescription = ""; // optional
                 }],
                 link: function(scope, elem, attrs, ctrl) {
                    var addResults =
                        function( searchResults ) { 
                            // searchResults is some kind of promise object 
                            // there's got to be a better way to do this:
                            for (var i=0; i < searchResults.length; i++)
                                scope.results = scope.results.concat( searchResults[i] );
                            scope.resultsEnd = searchResults.length < scope.query['max-results'];
                            scope.query.start += scope.query['max-results'];
                            scope.inProgress = false;
                            console.log("at end of addresults, query.start=", scope.query.start);
                        };
                    var newSearch = function( ) {
                        // query has changed, rerun search

                        if (scope.api && !scope.inProgress) {
                            scope.results = [];
                            scope.selection = "";
                            scope.selectionDescription = "";
                            scope.query.start = 1;
                            scope.resultsEnd = true;
      
                            scope.inProgress = true;
                            QueryService.query(scope.api, {
                                    q : scope.query.q, 
                                    start : 1, 
                                    'max-results' : 100
                                })
                            .success(addResults);
                        }
                    }
                    
                    scope.$watch("api", newSearch);

                    scope.$watch("query.q", newSearch);

                    scope.$watch("resultsEnd", function( e ) {
                        // reached end of query
                        if (scope.api && !scope.inProgress && e ) {
                            console.log("resultsEnd. query.start=", scope.query.start);

                            scope.inProgress = true;
                            QueryService.query(scope.api, {
                                q : scope.query.q, 
                                start : scope.query.start, 
                                'max-results' : scope.query['max-results']}
                            ).success(addResults);
                        } 
                    });
                 },
                 transclude : false,
                 templateUrl : "/js/search/osSearchList.directive.html"
             };
        }
        ]
);

