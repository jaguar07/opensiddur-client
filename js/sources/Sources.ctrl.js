/* 
 * controller for sources page 
 * Open Siddur Project
 * Copyright 2013-2015 Efraim Feinstein <efraim@opensiddur.org>
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
osSourcesModule.controller(
    'SourcesCtrl',
    ['$rootScope', '$location', '$route', '$routeParams', '$scope', 'SourceService', 'XsltService', 
    "AccessService", 'DialogService', "LanguageService", 'AuthenticationService', 'ErrorService',
    function ($rootScope, $location, $route, $routeParams, $scope, SourceService, XsltService, 
    AccessService, DialogService, LanguageService, AuthenticationService, ErrorService) {
        $scope.DialogService = DialogService;
        $scope.LanguageService = LanguageService;
        $scope.SourceService = SourceService;
        AccessService.reset();

        $scope.editor = {
            loggedIn : AuthenticationService.loggedIn,
            "supportedResponsibilities" : supportedResponsibilities,
            "monographScopes" : { 
                volume : "volume",
                issue : "issue",
                page : "pages",
                chapter : "chapters",
                part : "parts"
            },
            requiredExample : null,       // example of a required field
            newButton : function () {
                if ($location.path() == "/sources")
                    $route.reload();
                else 
                    $location.path( "/sources" );
                
            },
            newDocument : function () {
                SourceService.loadNew();
                AccessService.reset();
            },
            openDocument : function (selection) {
                $location.path( "/sources/" + decodeURIComponent(selection.split("/").pop()) );
            },
            dialogCancel : function () {},
            setDocument : function( ) {
                var toDocument = $routeParams.resource;
                if (!toDocument) {
                    this.newDocument();
                }
                else {
                    SourceService.load(toDocument)
                    .error(function(error) {
                        ErrorService.addApiError(error);
                        console.log("error loading", toDocument);
                    });
                }
            },
            saveDocument : function() {
                console.log("Save:", this);
                SourceService.save()
                .success(function() {
                    $scope.sourcesForm.$setPristine();
                })
                .error(
                    function(error) {
                        ErrorService.addApiError(error);
                        console.log("error saving ", SourceService.resource);
                    }
                );
            },
            archiveIdHelper: {
                url: "",
                error : "",
                setArchiveId : function() {
                    this.error = "";
                    if (this.url.match("books.google.com")) {
                        var m = this.url.match(/id=([A-Za-z0-9_]+)/);
                        if (m) { 
                            $scope.editor.content.biblStruct.idno._type = "books.google.com"; 
                            $scope.editor.content.biblStruct.idno.__text = m[1]; 
                        }
                    }   
                    else if (this.url.match("archive.org")) {
                        var m = this.url.match(/\/(details|stream)\/([A-Za-z0-9_]+)/);
                        if (m) { 
                            $scope.editor.content.biblStruct.idno._type = "archive.org"; 
                            $scope.editor.content.biblStruct.idno.__text = m[2]; 
                        }
                    }
                    else {
                        this.error = "Unrecognized archive URL";
                    }
                }
            }
        };            
        $scope.saveButtonText = function() {
            return this.sourcesForm.$pristine ? ((SourceService.resource == "") ? "Unsaved, No changes" : "Saved" ) : "Save";
        };

        $scope.editor.setDocument();
    }]
);