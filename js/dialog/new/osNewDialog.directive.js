/* New dialog
 *
 * Usage:
 * <os-new-dialog 
 *  resource-type="" 
 *  model="" 
 *  title="" 
 *  name=""
 *  on-ok=""
 *  on-close="" />
 * resource-type is the resource type. If empty, it becomes user-selectable
 * model is the content that will be replaced, if this is successful
 * title is the header text 
 * name is an id, title is the header text
 * on-ok runs after OK is pressed
 * on-close is a function to run when the close button is pressed
 *
 * Copyright 2014-2016 Efraim Feinstein, efraim@opensiddur.org
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
osDialogNewModule.directive(
        'osNewDialog',
        ["LanguageService", "LicensesService",
        function(LanguageService, LicensesService) {
            return {
                restrict : 'AE',
                scope : {
                    resourceType : "=",
                    model : "=",
                    name : "@",
                    title : "@",
                    onOk : "&",
                    onClose : "&"
                },
                controller: ['$scope', function ($scope) {
                    console.log("In new dialog controller");
                    $scope.LanguageService = LanguageService;
                    $scope.resourceTypes = {
                        "original" : "Original text document",
                        "outline" : "Outline document",
                        "conditionals" : "Conditional definition document",
                        "annotations" : "Annotations document",
                        "styles" : "CSS-based styling document"
                    };
                    if (!$scope.resourceType) {
                        $scope.resourceType = "texts";
                    }
                    $scope.supportedLicenses = LicensesService.supportedLicenses;

                    $scope.model = $scope.model || {
                        template : {
                            lang : "he",
                            title: {
                                main : "",
                                alt : "",
                                altLang : "en"
                            },
                            license : "http://www.creativecommons.org/publicdomain/zero/1.0",
                            source : "/exist/restxq/api/data/sources/Born%20Digital",
                            sourceTitle : "An Original Work of the Open Siddur Project"
                        }
                    };
                    $scope.OKButton = function() {
                        //$scope.model = 0;
                        // check for requirements
                        // run the template transform
                        // set the content to the result
                        if ($scope.onOk()()) {
                            $("#"+$scope.name).modal('hide');
                        }
                    }; 
                    $scope.CloseButton = function() {
                        $scope.onClose()();
                        $("#"+$scope.name).modal('hide');
                    };
                    if (!$scope.title) {
                        $scope.title = "New";
                    }
                 }],
                 link: function(scope, elem, attrs, ctrl) {
                    elem.find(".modal-title").attr("id", scope.name + "_label");
                    elem.find(".osNewDialog").attr("aria-labelledBy", scope.name + "_label");
                    elem.find(".osNewDialog").attr("id", scope.name);
                 },
                 transclude : false,
                 templateUrl : "/js/dialog/new/osNewDialog.directive.html"
             };
        }
        ]
);

