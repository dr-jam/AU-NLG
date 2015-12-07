/** @jsx React.DOM */
// Configure require.js and set paths to modules used.

require.config({
paths: {
  // Note that the file paths omit the ".js" from the filename.
  "underscore" : "./lib/underscore-min",
  "jquery": "./lib/jquery-2.1.0",
  "util": "./lib/util",
  "log": "./lib/log",
  "jqueryUI": "./lib/jquery-ui.min",

  // CiF
  "cif": "./cif/src/CiF",
  "sfdb": "./cif/src/SFDB",
  "volition": "./cif/src/Volition",
  "ruleLibrary": "./cif/src/RuleLibrary",
  "actionLibrary": "./cif/src/ActionLibrary",
  "validate": "./cif/src/Validate",
  "test": "./cif/src/tests/Tests",

  //social practice
  "practiceManager" : "./cif/src/PracticeManager",

  //"aunlg" : "./AUNLG",
  "locutionTester" : "./LocutionTester"
}
});

// Main entry function
require(["cif", "practiceManager", "locutionTester"], function(cif, practiceManager, locutionTester){
  locutionTester.test();
});
