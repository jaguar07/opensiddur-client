/* LanguageService: manage information related to supported languages
 * Language information can be obtained by getting a list of supported languages, which contains their
 * language name, language code, and directionality 
 *
 * Open Siddur Project
 * Copyright 2015 Efraim Feinstein, efraim@opensiddur.org
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
osGlobalDataModule.factory("LanguageService", function() {
    var Language = function(name, english, dir) {
        return { 
            "name" : name, 
            "englishName" : english, 
            "dir" : dir,
            "toString" : function() { return this.name + (this.englishName ?  (" (" + this.englishName + ")") : "") }
        }; 
    };
    return {
        supportedLanguages : {
            "en" : Language("English", "", "ltr"),
            "he" : Language("עברית",  "Hebrew", "rtl"),
            "arc" : Language("ארמית", "Aramaic", "rtl")
        },
        getDirection : function(lang) {
            return lang ? this.supportedLanguages[lang].dir : "ltr";
        },
        getCkeditorList : function() {
            // supportedLanguages as a CKEditor compatible language list
            return $.map(
                this.supportedLanguages, 
                function(desc, code) { 
                    return code + ":" + desc.toString() + ":" + desc.dir;
                }
            );
        }
    };
});
