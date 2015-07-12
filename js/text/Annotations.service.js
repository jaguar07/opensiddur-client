/* 
    Annotations service: keep track of and update annotations in a document
    
    Note: the "local" annotation resource has the same resourceId as the document in TextService.

    Open Siddur Project
    Copyright 2015 Efraim Feinstein, efraim@opensiddur.org
    Licensed under the GNU Lesser General Public License, version 3 or later
*/
osTextModule.factory("AnnotationsService", [
    "$http",
    "$q",
    "TextService",
    "XsltService",
    function($http, $q, TextService, XsltService) {
        /* store all the referenced annotation resources in a cache 
            resourceName : "xml"
        */
        var resources = {};    
        return {
            loadAll : function() {
                // load the content of all annotations in TextService._flatContent
                
                // find which annotation docs need to be loaded
                // load them
                    // on success:
                    // convert the existing notes to JSON+HTML
                    // find the references in TextService
                    // replace the content with the referenced content
                    // call the note loaded
            },
            reload : function(resource) {
                return $http.get("/api/data/notes/" + encodeURIComponent(resource))
                    .then(function(response) {
                        resources[resource] = response.data;
                        return resources[resource];
                    });
            },
            load : function(resource) {
                // load an annotation resource (if not already loaded)
                // return a promise
                if (resource in resources) {
                    var deferred = $q.defer();
                    deferred.resolve(resources[resource]);
                    return deferred.promise;
                }
                else {
                    return this.reload(resource);
                }
            },
            getNote : function(resource, id) {
                // get an annotation resource, with the given id
                // return the (HTML) content as a promise
                return this.load(resource)
                    .then(function(resourceContent) {
                        return XsltService.serializeToString(
                            XsltService.transformString("/js/text/Annotation.get.xsl", resourceContent, {
                                id : id
                            }) 
                        );
                    });
            },
            saveAll : function() {
                // save all the (changed) resources
                
                // isolate all of the annotations and group by resource
                var annotationsByResource =
                        XsltService.transformString("/js/text/AnnotationsIsolate.xsl", 
                            "<content xmlns='http://www.w3.org/1999/xhtml'>" + TextService._flatContent + "</content>")
                    ;
                var thiz = this;
                // for each resource,
                return $q.all(
                    $.each(annotationsByResource.getElementsByTagNameNS("http://jewishliturgy.org/ns/jlptei/flat/1.0", "annotationResource"),
                        function(idx, annotationResource) {
                            var thisResource = annotationResource.getAttribute("resource").split("/").pop();
                            // check if it exists
                            return thiz.load(thisResource)
                            .catch(function(errorResponse) {
                                // if not, create the annotation resource with idno=the id of the document, POST it
                                console.log("does not exist");
                                var title = decodeURIComponent(thisResource);
                                var idno = TextService._resource;
                                var src = TextService.sources()[0]; // big assumption!
                                var template = 
                                    "<annotationTemplate>" +
                                        "<lang>" + TextService.language().language + "</lang>" +  
                                        "<title><main>" + title + "</main><idno>" + idno + "</idno></title>" +
                                        "<license>" + TextService.license().license + "</license>" +
                                        "<sourceTitle>" + src.title  + "</sourceTitle>" +
                                        "<source>/data/sources/" + src.source + "</source>" +
                                        "<initialAnnotation>" + XsltService.serializeToString(annotationResource) + "</initialAnnotation>" +
                                    "</annotationTemplate>"
                                var templated = XsltService.serializeToStringTEINSClean(
                                    XsltService.transform("/js/text/Save.template.xsl", 
                                        XsltService.transformString("/js/text/Annotations.template.xsl", template))
                                    );
                                return $http.post("/api/data/notes", templated)
                                    .success(function() {
                                        thiz.reload(thisResource);
                                    });
                            })
                            .then(function(originalResource) {
                                // if it does exist, load it and merge the changed annotations into the resource, then PUT
                                if (originalResource) {
                                    console.log("saving to", thisResource);
                                    var mergedAnnotations = XsltService.serializeToStringTEINSClean(
                                        XsltService.transform("/js/text/Save.template.xsl", 
                                            XsltService.transformString("/js/text/AnnotationsMerge.xsl", originalResource, {
                                                annotations : annotationResource
                                            })
                                        )
                                    );
                                    return $http.put("/api/data/notes/" + thisResource, mergedAnnotations)
                                        .success(function() {
                                            // get any server-induced changes (revision history, eg)
                                            thiz.reload(thisResource);
                                        });
                                }
                            });
                        })
                    );
            },
            getResourceIdno : function(resource) {
                // get the annotation idno's of a given resource
            },
            setResourceIdno : function(resource, id) {
                // change the annotation idno(s) of a given resource (must be loaded!)
            },
            content : function(resource, id, type, content) {
                // get or set the type and/or content of a given resource/annotation
                // sync every reference to it in the TextService to have the same content
            }
        };
    }
]);