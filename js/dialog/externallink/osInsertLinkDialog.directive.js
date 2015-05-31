/* Insert link dialog
 *
 * Usage:
 * <os-insert-link-dialog on-ok="" on-close="" title="" name=""/>
 * on-ok runs when the OK button is pressed, on-close runs when the dialog is canceled
 * name is an id, title is the header text
 *
 * Copyright 2014 Efraim Feinstein, efraim@opensiddur.org
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
osDialogExternalLinkModule.directive(
        'osInsertLinkDialog',
        [
        'GetAnyService', 'ErrorService',
        function( GetAnyService, ErrorService ) {
            return {
                restrict : 'AE',
                scope : {
                    onOk : "&",
                    onClose : "&",
                    name : "@",
                    title : "@"
                },
                controller: ['$scope', function ($scope) {
                    console.log("In insert link dialog controller");

                    $scope.typesWithAllowedRanges = ["/api/data/original"];
                    $scope.typesWithAllowedFragments = [
                            "/api/data/notes",
                            "/api/data/original",
                            "/api/data/conditionals"
                    ];


                    $scope.links = {
                        selectedType : "/api/data/original",
                        types : {
                            "/api/data/notes" : "Annotations",
                            "/api/user" : "Contributor",
                            "/api/data/original" : "Original text",
                            "/api/data/sources" : "Source",
                            "/api/data/conditionals" : "Conditional"
                        },
                        content : "",
                        selection : "",
                        selectedFile : "",
                        composedFragment : "",
                        allowedFragment : false,    // set by a watch on selectedType
                        allowedRange : false,       // set by a watch on selectedType
                        selectFile : function () {
                            var newSelection =  this.selection.replace(/^\/exist\/restxq\/api/, '');

                            if (this.selectedFile != newSelection) { // reset the content
                                this.content = "";
                                this.composedFragment = "";
                            }
                            // set the selected file
                            this.selectedFile = newSelection;                            
                            // if a fragment is allowed, load the content
                            if ($scope.typesWithAllowedFragments.indexOf(this.selectedType) >= 0) {
                                GetAnyService.get(this.selectedType, 
                                    decodeURI(this.selection.replace("\/exist\/restxq" + this.selectedType + "/", ""))                                      )
                                    .success(
                                    function(content) {
                                        $scope.links.content = content;
                                    } );
                            } 
                            this.composeLink();
                        },
                        composeLink : function() {
                            this.composedLink = this.selectedFile + (this.composedFragment || "");
                            return this.composedLink;
                        }
                    };                    

                    $scope.OKButton = function () {
                        $scope.links.composeLink();
                        $scope.onOk()($scope.links.composedLink);
                        $("#"+$scope.name).modal('hide');
                    };
                    $scope.CloseButton = function () {
                        $scope.onClose()();
                        $("#"+$scope.name).modal('hide');
                    };
                    if (!$scope.title) {
                        $scope.title = "Insert Link";
                    }
                 }],
                 link: function(scope, elem, attrs, ctrl) {
                    elem.find(".modal-header h4").attr("id", scope.name + "_label");
                    elem.find(".osInsertLinkDialog").attr("aria-labelledBy", scope.name + "_label");
                    elem.find(".osInsertLinkDialog").attr("id", scope.name);

                    elem.on("shown.bs.modal", function() {
                        scope.links.selection = "";
                    });

                    scope.$watch("links.selectedType", function (type) {
                        scope.allowedRange = scope.typesWithAllowedRanges.indexOf(type) >= 0;
                        scope.allowedFragment = scope.typesWithAllowedFragments.indexOf(type) >= 0;
                        if (type != scope.links.selectedType) {
                            scope.links.selection = "";
                        }
                    });
                    scope.$watch("links.selection", function (s) {
                        if (s == "") {
                            scope.links.content = "";
                            scope.links.selectedFile = "";                            
                            scope.links.composedFragment = "";
                            scope.links.composeLink();
                        }
                    });
                    scope.$watch("links.composedFragment", function (fragment) {
                        scope.links.composeLink();
                    });

                 },
                 transclude : false,
                 templateUrl : "/js/dialog/externallink/osInsertLinkDialog.directive.html"
             };
        }
        ]
);


