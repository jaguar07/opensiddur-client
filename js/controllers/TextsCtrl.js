/* 
 * controller for texts page 
 * Open Siddur Project
 * Copyright 2013-2014 Efraim Feinstein <efraim@opensiddur.org>
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
OpenSiddurClientApp.controller(
    'TextsCtrl',
    ['$scope', '$location', '$routeParams', '$http', '$window', 'XsltService', 
    'AuthenticationService', 'IndexService', 'ErrorService', 'RestApi',
    function ($scope, $location, $routeParams, $http, $window, XsltService, 
        AuthenticationService, IndexService, ErrorService, RestApi) {
        console.log("Texts controller.");
        IndexService.search.enable( "/api/data/original" );
        $scope.search = IndexService.search;

        $scope.editor = {
            loggedIn : AuthenticationService.loggedIn,
            currentDocument : $routeParams.resource,
            content : "",
            access : {},
            title : "",
            isNew : 1,
            newDocument : function() {
                console.log("Start a new document");
                this.title = "New text";
                $scope.editor.isNew = 1;
                $scope.editor.content = "";
                // default access rights for a new file
                $scope.editor.access = {
                    owner : AuthenticationService.userName,
                    group : AuthenticationService.userName,
                    read : true, 
                    write : true,
                    relicense : true,
                    chmod : true
                }
                // load a new document template
                documentTemplate = "/templates/original.xml";
                $http.get(documentTemplate) 
                    .success(
                        function(data) {
                            $scope.editor.content = data; 
                            $scope.editor.title = "New text";
                            $scope.textsForm.$setPristine();
                        }
                    )
                    .error(
                        function(data) {
                            ErrorService.addApiError(data);
                            console.log("error loading", documentTemplate);
                        }
                    )
                
            },
            setDocument : function() {
                var toDocument = this.currentDocument;

                if (!toDocument) {
                    this.newDocument();
                }
                else {
                    $http.get("/api/data/original/" + toDocument) 
                        .success(
                            function(data) {
                                $scope.editor.access = RestApi["/api/data/original"].getAccess({
                                    "resource" : toDocument
                                });
                                
                                $scope.editor.content = data; 
                                $scope.editor.title = $("tei\\:title[type=main]", data).html();
                                $scope.editor.isNew = 0;
                                $scope.textsForm.$setPristine();
                            }
                        )
                        .error(
                            function(data) {
                                ErrorService.addApiError(data);
                                console.log("error loading", toDocument);
                                $scope.editor.currentDocument = "";
                            }
                        )
                }
            },
            saveDocument : function () {
                console.log("Save:", this);
                var httpOperation = (this.isNew) ? $http.post : $http.put;
                var url = "/api/data/original" + ((this.isNew) ? "" : ("/" + $scope.editor.currentDocument));
                indata = $scope.editor.content;
                httpOperation(url, indata)
                    .success(function(data, statusCode, headers) {
                        $scope.textsForm.$setPristine();
                        if ($scope.editor.isNew) {
                            // add to the search results listing
                            IndexService.search.addResult({
                                title:  $( "tei\\:title[type=main]", indata).html(), 
                                url : headers('Location'),
                                contexts : []
                            });

                            $scope.editor.isNew = 0;
                            $scope.editor.currentDocument=headers('Location');
                        };
                    })
                    .error(function(data) {
                        ErrorService.addApiError(data);
                        console.log("error saving", url);
                    });

            },
            compile : function () {
                // TODO: give this a nice loading/compiling/info interface.
                $window.open("/api/data/original/" + $scope.editor.currentDocument + "/combined?transclude=true");
            },
            loaded : function( _editor ) {
                console.log("editor loaded");
                $scope.editor.ace = {
                    editor : _editor,
                    session : _editor.getSession(),
                    renderer : _editor.renderer
                };
            }
        };
        $scope.saveButtonText = function() {
            return this.textsForm.$pristine ? (($scope.editor.isNew) ? "Unsaved, No changes" : "Saved" ) : "Save";
        };

        $scope.$watch("search.selection",
            function( selection ) { 
                var resourceName = selection.split("/").pop();
                if (resourceName && resourceName != $scope.editor.currentDocument)
                    $location.path( "/texts/" + resourceName );
            }
        );

        $scope.helper = {
            link : {
                selectedType : "/api/data/original",
                types : {
                    "/api/user" : "Contributor",
                    "/api/data/original" : "Original text",
                    "/api/data/sources" : "Source"
                },
                selection : "",
                insertable : "",
                insert : function () {
                    $scope.editor.ace.editor.insert(this.insertable);
                }
            },
            xml : {
                applyXslt : function ( xslt ) {
                    var position = $scope.editor.ace.editor.getCursorPosition();
                    var transformed = XsltService.transformString( xslt, $scope.editor.content );
                    $scope.editor.content = ((new window.XMLSerializer()).serializeToString(transformed));
                    $scope.$apply(); 
                    $scope.editor.ace.editor.moveCursorToPosition(position);
                    $scope.editor.ace.editor.clearSelection();

                },
                addIds : function () {
                    this.applyXslt( "addXmlId" );
                },
                wordify : function () {
                    this.applyXslt( "wordify" );
                }
            }
        };
        $scope.$watch("helper.link.selection", function (newSelection) {
            $scope.helper.link.insertable = newSelection.replace(/^\/exist\/restxq\/api/, "")
        });

        $scope.editor.setDocument();

    }]
);
