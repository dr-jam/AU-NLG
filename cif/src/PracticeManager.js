/* jshint -W033 */

/*
This may be better named as SocialPracticeManager. It could contain high-level
functions dealing with social practices like: get choices, select actions,
apply effects and stage transition. Having it be the control point for using
social practices could be good. It would be like an add-on component to cif.js.
*/

define(["ruleLibrary","util","jquery","sfdb"], function(ruleLibrary, util, $, sfdb){

	var practices = [];

	var currentPractice = {};

	var currentRoleBindings = {};

	var currentStage = {};

	var currentCast;

	var currentAction = {};

	var possibleActions = [];

	var scoredActionsInfo = [];
	var scoredMTInfo = {};

	var addPractice = function(rawPractice) {
		practices.push(rawPractice.practice);
	}

	var removePractice = function(practice) {
		var index = practices.indexOf(practice);
		if (index !== -1) {
			practices.splice(index, 1);
			return;
		}
	//	console.log("removePractice() - Tried to remove a practice that was not in practices.");
	}

	var setCast = function(cast) {
		currentCast = cast;
	}

	var getPractices = function() {return practices;}
	var setPractices = function(value) {practices = value;}

	var getCurrentPractice = function() {return currentPractice;}
	var getPracticeByName = function(practiceName)
	{
		var practices = getPractices();
		for (var practiceCount = 0; practiceCount < practices.length; practiceCount++) {
			if (practiceName === practices[practiceCount].label) {
				return practices[practiceCount];
			}
		}
	}

	var setCurrentPractice = function(value) {
		if (typeof value === "string") {
			currentPractice = getPracticeByName(value);
		}
		else {
			currentPractice = value;
		}
	}

	var getCurrentStage = function() {return currentStage;}
	var setCurrentStage = function(value) {
		var practice = getCurrentPractice();
		if ($.isEmptyObject(practice)) {
	//		console.log("setCurrentStage(" + value + "): currentPractice not set.");
		}
		else if (typeof value === "string") {
			var stages = practice.stages;
			for (var stageCount = 0; stageCount < stages.length; stageCount++) {
				if (value === stages[stageCount].label) {
					currentStage = stages[stageCount];
					return;
				}
			}
			if (value === undefined) {
				currentStage = value;
			}
			//console.log("setCurrentStage(" + value + "): Stage by name " + value + " was not found in the current practices stages.");
		}
		else {
			currentStage = value;
		}
	}

	var getPossibleActions = function() { return possibleActions; }

	var getCurrentAction = function() {return currentAction;}
	//It is assumed that we always get current action based on the current stage
	var setCurrentAction = function(value) {
		var stage = getCurrentStage();
		if ($.isEmptyObject(stage)) {
	//		console.log("setCurrentAction(" + value + "): currentStage not set.");
		}
		else if (stage === undefined) {

		}
		else if (typeof value === "string") {
			var actions = getPossibleActions();
			for (var actionCount = 0; actionCount < actions.length; actionCount++) {
				if (value === actions[actionCount].label) {
					currentAction = actions[actionCount];
					return;
				}
			}
	//		console.log("setCurrentAction(" + value + "): Action by name " + value + " was not found in the current stage of the current practice.");
		}
		else {
			currentAction = value;
		}
	}

	var getCurrentRoleBindings = function() {
		return currentRoleBindings;
	}

	var launchStage = function(stage, x, y) {
		currentRoleBindings.x = x;
		currentRoleBindings.y = y;
		setCurrentStage(stage);
	}


	// practiceManager.getActions({"x":lars, "y":katrina})
	var generateActions = function(considerEventStages) {
		var roleBindings = currentRoleBindings;
		var cast = currentCast;

		var actionList = [];
		var ruleResult = {};
		var actionCount = 0;
		var stageActions = [];
		var actionToPush = {};

		//get all actions from currentPractice's next stages
		var stage = getCurrentStage();
		var nextStages;
		if (stage === undefined) {
			//If we don't have a currentStage, assume we are at the beginning of a
			//practice and set nextStages to the currentPractice's entryStages.
			nextStages = getCurrentPractice().entryStages;
		} else {
			nextStages = stage.nextStages;
		}

		for (var stageCount = 0; stageCount < nextStages.length; stageCount++) {
			var nextStage = getStageByLabel(nextStages[stageCount]);
			stageActions = nextStage.actions;
			for (actionCount = 0; actionCount < stageActions.length; actionCount++) {
				//if the precondition for the action is true
				ruleResult = evaluateRule(stageActions[actionCount].preconditions, roleBindings, cast);
				if(ruleResult.success) {
					//NOTE: we are adding a element to this particular list of actions. This element is not part of the action class.
					actionToPush = util.clone(stageActions[actionCount]);
					actionToPush.possibleRoleBindings = ruleResult.possibleRoleBindings;
					actionList.push(actionToPush);
				}
			}
		}

		if (considerEventStages) {
			//get all actions from eventStages
			var eventStages = currentPractice.eventStages;
			for (var eventCount = 0; eventCount < eventStages.length; eventCount++){
				stageActions = eventStages[eventCount].actions;
				for (actionCount = 0; actionCount < stageActions.length; actionCount++) {
					ruleResult = evaluateRule(stageActions[actionCount].preconditions, roleBindings, cast);
					if(ruleResult.success) {
						//NOTE: we are adding a element to this particular list of actions. This element is not part of the action class.
						actionToPush = util.clone(stageActions[actionCount]);
						actionToPush.possibleRoleBindings = ruleResult.possibleRoleBindings;
						actionList.push(actionToPush);
					}
				}
			}
		}


		possibleActions = actionList;
	};

	/*
	A context {practice, stage, action, roleBindings}
	*/

	var getActionByName = function(actionName) {
			var actionList = getPossibleActions();

			for (var i=0; i<actionList.length; i++)
			{
				if (actionList[i].label === actionName)
					return actionList[i];
			}

			return;
	}

	var selectAction = function(cast, actionList) {
		if (typeof actionList === undefined) {
			actionList = getPossibleActions();
		}

		//Clear our scoredInfo objects used for logging (for now)
		scoredActionsInfo = [];
		scoredMTInfo = {};

		var selectedAction;
		var maxScore;
		var x = currentRoleBindings.x;//currentContext.roleBindings.x;
		var y = currentRoleBindings.y;//currentContext.roleBindings.y;
		var previousX = currentRoleBindings.y//previousContext.roleBindings.x;
		var previousY = currentRoleBindings.x//previousContext.roleBindings.y;
		var mtCache = {};


		for(var actionIndex = 0; actionIndex < actionList.length; ++actionIndex) {
			var score = 0;
			var mtScore = 0;
			var nowScore = 0;
			var carryScore = 0;

			var action = actionList[actionIndex];

			var actionInfo = {};
			scoredActionsInfo.push(actionInfo);
			actionInfo.label = action.label;
			actionInfo.intent = action.intent;

			//run the mt of the intent of the action if it has not been already scored for x and y
			//microtheory rules
			//run the microtheory associated with the intent of the action.
			var intent = action.intent;
			if(mtCache[intent] === undefined) {
				scoredMTInfo[intent] = {rules:[]};
				mtCache[intent] = 0;

				var mt = ruleLibrary.getRuleSet(intent);
				for (var ruleIndex = 0; ruleIndex < mt.length; ruleIndex++) {
					var result = evaluateRule(mt[ruleIndex].conditions, {"x":x, "y":y}, cast, false);
					var scoredRuleInfo = util.clone(mt[ruleIndex]);
					scoredRuleInfo.result = result;
					scoredMTInfo[intent].rules.push(scoredRuleInfo);
					scoredRuleInfo.score = 0;
					if(result.success) {
						/* Adding support for each predicate in the effects to have a weight. */
						var currentMTRuleScore = 0;
						for (var mtRuleEffectIndex = 0; mtRuleEffectIndex < mt[ruleIndex].effects.length; mtRuleEffectIndex++) {
							currentMTRuleScore += mt[ruleIndex].effects[mtRuleEffectIndex].weight;
						//	console.log("WEIGHTCHECK: " + mt[ruleIndex].effects[mtRuleEffectIndex].weight);
						}
						mtCache[intent] += currentMTRuleScore;
						scoredRuleInfo.score = currentMTRuleScore;
					}
				}
				scoredMTInfo[intent].score = mtCache[intent];
			}

			mtScore += mtCache[intent];

			//3. now rules
			var maxNowRuleScore = undefined;
			var nowRoleBinding = {};
			for (var roleBindingIndex = 0; roleBindingIndex < action.possibleRoleBindings.length; roleBindingIndex++){
				roleBinding = action.possibleRoleBindings[roleBindingIndex];
				var nowScore = 0;

				actionInfo.nowRules = [];
				for(var nowIndex = 0; nowIndex < action.nowRules.length; nowIndex++) {
					var nowRule = action.nowRules[nowIndex];

					var nowRuleResult = evaluateRule(nowRule.conditions, roleBinding, cast, false);

					if(nowRuleResult.success){
						var currentNowRuleScore = 0;
						for (var nowEffectIndex = 0; nowEffectIndex < nowRule.effects.length; nowEffectIndex++){
							currentNowRuleScore += nowRule.effects[nowEffectIndex].weight;
						}
						nowScore += currentNowRuleScore;
						roleBinding = $.extend({}, roleBinding, nowRuleResult.possibleRoleBindings[0]);

						var nowRuleInfo = util.clone(nowRuleInfo);
						nowRuleInfo.result = nowRuleResult;
						nowRuleInfo.score = currentNowRuleScore;
						actionInfo.nowRules.push(nowRuleInfo);
					}
				}

				if(maxNowRuleScore === undefined) {
					maxNowRuleScore = nowScore;
					nowRoleBinding = roleBinding;
				}

				//found a new action with the highest score so far
				if(nowScore > maxNowRuleScore) {
					maxNowRuleScore = nowScore;
					nowRoleBinding = roleBinding;
				}
			}

			if(maxNowRuleScore === undefined) {
				maxNowRuleScore = 0
			}
			nowScore += maxNowRuleScore;

			//4. carry rules
			actionInfo.carryRules = [];
			for(var carryIndex = 0; carryIndex < action.carryRules.length; carryIndex++) {
				var carryRule = action.carryRules[carryIndex];
				var carryRuleResult = evaluateRule(carryRule.conditions, {"x":previousX, "y":previousY}, cast, false);
				if(carryRuleResult.success) {
					/* Adding support for each predicate in the effects to have a weight. */
					for (var carryEffectIndex = 0; carryEffectIndex < carryRule.effects.length; carryEffectIndex++){
						carryScore += carryRule.effects[carryEffectIndex].weight;
					}

					var carryRuleInfo = util.clone(carryRuleInfo);
					carryRuleInfo.result = carryRuleResult;
					actionInfo.carryRules.push(carryRuleInfo);
				}
			}

			score = action.defaultWeight + mtScore + nowScore + carryScore;

			actionInfo.defaultWeight = action.defaultWeight;
			actionInfo.mtScore = mtScore;
			actionInfo.nowScore = nowScore;
			actionInfo.carryScore = carryScore;
			actionInfo.score = score;

		//	console.log("Action " + action.label + " with intent " + action.intent + " has a score of " + score + " <" + action.defaultWeight + ", " + mtScore + ", " + nowScore + ", " + carryScore + ">");

			/*The first action scored should become the current selection and
			 set the max score.*/
			if(maxScore === undefined) {
				maxScore=score;
				selectedAction = action;
			}

			//found a new action with the highest score so far
			if(score > maxScore) {
				maxScore = score;
				selectedAction = action;
			}
		}

		//return the selected action;
		//TODO: add the nowRoleBinding to what this function returns
		selectedAction.chosenRoleBindings = nowRoleBinding;

		// console.log(x + " chose the following action: " + selectedAction.label)
		//
		// console.dir(scoredMTInfo);
		// console.dir(scoredActionsInfo);

		return selectedAction;
	};

	var setBestRoleBindingForAction = function(action, cast) {
		var action = selectAction(cast, [action]);
		setCurrentAction(action);
		currentRoleBindings = action.chosenRoleBindings;
	}

	var applyEffects = function() {
		var action = getCurrentAction();
		var effects = getCloneOfBoundPredicates(action.effects, currentRoleBindings);
		for (var effectCount = 0; effectCount < effects.length; effectCount++) {
			sfdb.set(effects[effectCount]);
		}
		sfdb.setupNextTimeStep();
	//	console.log("Current time: " + sfdb.getCurrentTimeStep());
		sfdb.dumpSFDB();
	};

	var getCloneOfBoundPredicates = function(preds, bindings) {
		var boundPreds = util.clone(preds);
		for (var predCount = 0; predCount < boundPreds.length; predCount++) {
			var pred = boundPreds[predCount];
			pred.first = bindings[pred.first];
			pred.second = bindings[pred.second];
		}
		return boundPreds;
	}

	var instantiatePerformance = function() {
		var performance = getCurrentAction().performance;
		performance = performance.replace(/%X%/g, currentRoleBindings.x);
		performance = performance.replace(/%Y%/g, currentRoleBindings.y);
		return performance;
	}

	var stageTransition = function() {
		var nextStages = getCurrentStage().nextStages;
		var currentActionLabel = getCurrentAction().label;

		for (var nextStageCount = 0; nextStageCount < nextStages.length; nextStageCount++) {
			var actions = getStageByLabel(nextStages[nextStageCount]).actions;
			for (var actionCount = 0; actionCount < actions.length; actionCount++) {
				if (currentActionLabel === actions[actionCount].label) {
					setCurrentStage(nextStages[nextStageCount]);
					return;
					//console.log("There is a next stage!");
				}
			}
		}
	};

	var getEventStageByLabel = function(stageName, practice) {
		practice = practice || getCurrentPractice();
		for (var stageCount = 0; stageCount < practice.eventStages.length; stageCount++) {
			var stage = practice.eventStages[stageCount];
			if (stage.label === stageName)
				return stage;
		}
	}

	var getStageByLabel = function(stageName, practice) {
			practice = practice || getCurrentPractice();
		for (var stageCount = 0; stageCount < practice.stages.length; stageCount++) {
			var stage = practice.stages[stageCount];
			if (stage.label === stageName) {
				return stage;
			}
		}
	//	console.log("getNextStageByLabel() - No stage with label " + stageName + " was found.");
	}

	var inTerminalStage = function() {
		if (getCurrentStage().nextStages.length === 0) {
			return true;
		}
		return false;
	}

	// if the stage is deleted, need to update the nextStage labels to not reference
	// it anymore
	var deleteStage = function(practiceName, stageName)
	{
		setCurrentPractice(practiceName);

		// if the stage we're deleting is in nextStages, remove it from the list
		for (var i = 0; i < currentPractice['stages'].length; i++) {
			var curStage = currentPractice['stages'][i];
			for (var j=0; j < curStage.nextStages.length; j++)
			{
				if (curStage.nextStages[j] === stageName)
				{
				// remove from list
					currentPractice.stages[i].nextStages.splice(j, 1);
					break;
				}
			}
		}

	}

	// if the stage name has changed, need to update the nextStage labels for other
	// stages that point to this one
	var updateStage = function(practiceName, oldStageName, newStageName)
	{
		// reset practice with new stage info
		setCurrentPractice(practiceName);

		if (newStageName !== oldStageName)
		{
			// stage name has updated and we need to update nextStage labels that may exist
			// go through the next stages of every other stage and see if references old name
			// of this stage. If so, update to new stage name.
			for (var i = 0; i < currentPractice['stages'].length; i++) {
				var curStage = currentPractice['stages'][i];
				for (var j=0; j < curStage.nextStages.length; j++)
				{
					if (curStage.nextStages[j] === oldStageName)
					{
						currentPractice.stages[i].nextStages[j] = newStageName;
						break;
					}
				}
			}
		}
	}



	/*
	get/set

	add/remove/get
		practices

	load practices from json
		call to cif to load individual rules

	MT to intent binding

	Procedures to place:
		score given current stage and previous context


	*/

	/**************************************************************************
	 * evaluateRule implementation and support functions.
	 *************************************************************************/

	 /*
	  * TODO: NOTE: This function really accepts an array of conditions and not a rule.
	  *
	  * This no longer returns a simple true or false value. Now it needs to return
	  * true/false and all of the known character bindings that made the rule's
	  * condition evaluate to true.
	  * returns: {success:true|false, knownRoleBindings[{}*]}
	  */
	var evaluateRule = function(conditions, knownRoleBindings, cast, runAll) {
		if (conditions.length === 0) {
			return {"success":true, "possibleRoleBindings":[knownRoleBindings]};
		}

		if(typeof runAll !== undefined){
			runAll=true;
		}


		//getUnkownRoles(conditions, knownRoleBindings)
		var unkownRoles = getUnkownRoles(conditions, knownRoleBindings);

		//getUnboundCast(knownRoleBindings, cast)
		var unboundCast = getUnboundCast(knownRoleBindings, cast);

		//cast into array for order
		var unboundCastArray = objectToArray(unboundCast);

		//turn unknown role bindings into an array
		var unknownRolesToSearchIndex = objectToArray(unkownRoles);

		var setOfAllTrueRoleBindings = [];

		//true if there is no longer a role binding search space left to search
		var searchSpaceExhausted = false;

		var searchState = [];
		//initialize search space into [0,1,2,3,..,length-1]
		for (var i = 0; i < unknownRolesToSearchIndex.length; i++) {
			searchState.push(i);
		}

		// The case where all the role bindings are known coming in to evaulateRule call.
		/*if(searchState.length < 1) {
			searchSpaceExhausted = true;
		}*/


		while (!searchSpaceExhausted) {
			var boundConditions = generateConditionsWithRoleBindings(conditions, searchState, unboundCast, knownRoleBindings, unknownRolesToSearchIndex);

			if (ruleLibrary.evaluateConditions(boundConditions, {}, {})) {
				allRoleBindings = generateRoleBindings(searchState, unboundCast, knownRoleBindings, unknownRolesToSearchIndex);
				// console.log("TRUE RULE: ***********");
				// console.log(ruleLibrary.predicateArrayToEnglish(boundConditions, false));
				// console.log("---------------");
				if(!runAll) {
					return {"success":true, "possibleRoleBindings":[allRoleBindings]};
				}
				setOfAllTrueRoleBindings.push(allRoleBindings);
			}
			else {
				// console.log("FALSE RULE: ");
				// console.log(ruleLibrary.predicateArrayToEnglish(boundConditions, false));
				// console.log("---------------");
			}

			//wi means window index
			var doneSlidingWindow = false;
			for (var wi = searchState.length-1; wi >= 0 && !doneSlidingWindow; wi--) {
				if (searchState[wi] > highestAvailable(wi, searchState, unboundCast.length)) {
					searchState[wi] = -1;
				}
				else {
					searchState[wi] = nextHighestAvailable(wi, searchState, unboundCast.length);
					doneSlidingWindow = true;
				}
			}

			if (searchState[0] == -1 || searchState.length === 0) {
				searchSpaceExhausted = true;
			}

			for (var i = 0; i < searchState.length; i++) {
				if (searchState[i] == -1) {
					searchState[i] = lowestAvailable(wi, searchState, unboundCast.length);
				}
			}

		}

		if(setOfAllTrueRoleBindings.length > 0) {
			return {"success":true, "possibleRoleBindings":setOfAllTrueRoleBindings};
		}
		return {"success":false, "possibleRoleBindings":[]};
	}

	var testEvaluateRule = function() {
		var conditions = [{"first":"X","second":"Y"},{"first":"X","second":"Z"},{"first":"X","second":"W"}];
		var cast = {"A":{},"B":{},"C":{},"D":{},"E":{}};
		evaluateRule(conditions, {"W":"A"}, cast);
	}


	var highestAvailable = function(wi, searchState, unboundCastLength) {
		var valsInSearchState = {};
		for (var i = 0; i < searchState.length; i++) {
			//Note, the value doesn't matter, we just want keys to be represented
			valsInSearchState[searchState[i]] = i;
		}
		for (var potentialHighestVal = unboundCastLength - 1; potentialHighestVal >= 0; potentialHighestVal--) {
			if (!(potentialHighestVal in valsInSearchState)) {
				return potentialHighestVal;
			}
		}
	//	console.log("highestAvailable() - There was no value left to be highest.");
	}

	var nextHighestAvailable = function(wi, searchState, unboundCastLength) {
		var valsInSearchState = {};
		for (var i = 0; i < searchState.length; i++) {
			//Note, the value doesn't matter, we just want keys to be represented
			valsInSearchState[searchState[i]] = i;
		}
		for (var potentialVal = searchState[wi] + 1; potentialVal < unboundCastLength; potentialVal++) {
			if (!(potentialVal in valsInSearchState)) {
				return potentialVal;
			}
		}
	//	console.log("nextHighestAvailable() - There was no value left to be next highest.");
		return -1
	}

	var lowestAvailable = function(wi, searchState, unboundCastLength) {
		var valsInSearchState = {};
		for (var i = 0; i < searchState.length; i++) {
			//Note, the value doesn't matter, we just want keys to be represented
			valsInSearchState[searchState[i]] = i;
		}
		for (var potentialLowestVal = 0; potentialLowestVal < unboundCastLength; potentialLowestVal++) {
			if (!(potentialLowestVal in valsInSearchState)) {
				return potentialLowestVal;
			}
		}
	//	console.log("lowestAvailable() - There was no value left to be lowest.");
	}

	var generateConditionsWithRoleBindings = function(conditions, searchState, unboundCast, knownRoleBindings, unknownRolesToSearchIndex) {
		var boundConditions = [];

		for (var condIndex = 0; condIndex < conditions.length; condIndex++) {
			var boundCondition = util.clone(conditions[condIndex]);

			if (boundCondition.first in knownRoleBindings) {
				boundCondition.first = knownRoleBindings[boundCondition.first];
			}
			else if (boundConditions !== undefined) {
				boundCondition.first = convertSearchStateIndexToCastMember(searchState, unboundCast, unknownRolesToSearchIndex, boundCondition.first);
			}

			if (boundCondition.second in knownRoleBindings) {
				boundCondition.second = knownRoleBindings[boundCondition.second];
			}
			else if (boundConditions !== undefined) {
				boundCondition.second = convertSearchStateIndexToCastMember(searchState, unboundCast, unknownRolesToSearchIndex, boundCondition.second);
			}

			boundConditions.push(boundCondition);
		}

		return boundConditions;
	}

	//return all roles bound with characters for a rule
	var generateRoleBindings = function(searchState, unboundCast, knownRoleBindings, unknownRolesToSearchIndex) {
		var allBindings = util.clone(knownRoleBindings);
		for (var searchStateIndex = 0; searchStateIndex < searchState.length; searchStateIndex++) {
			var role = unknownRolesToSearchIndex[searchStateIndex];
			allBindings[role] = convertSearchStateIndexToCastMember(searchState, unboundCast, unknownRolesToSearchIndex, role);
		}
		return allBindings;
	}

	var convertSearchStateIndexToCastMember = function(searchState, unboundCast, unknownRolesToSearchIndex, roleName) {
		for (var i = 0; i < unknownRolesToSearchIndex.length; i++) {
			if(unknownRolesToSearchIndex[i] === roleName) {
				//var roleIndex = unknownRolesToSearchIndex[i];
				var unboundCastIndex = searchState[i];
				return unboundCast[unboundCastIndex];
			}
		}
	}

	var getUnkownRoles = function(conditions, knownRoleBindings) {
		var unkownRoleBindings = {};

		for(var condCount = 0; condCount < conditions.length; condCount++) {
			cond = conditions[condCount];
			if (!(cond.first in knownRoleBindings) && cond.first !== undefined) {
				unkownRoleBindings[cond.first] = "";
			}
			if (!(cond.second in knownRoleBindings) && cond.second !== undefined) {
				unkownRoleBindings[cond.second] = "";
			}
		}

		return unkownRoleBindings;
	}

	var getUnboundCast = function(knownRoleBindings, cast) {
		var unknownCast = [];
		for (var castCount = 0; castCount < cast.length; castCount++) {
			var castName = cast[castCount];
			var found = false;
			for (var key in knownRoleBindings) {
				if (knownRoleBindings[key] === castName) {
					found = true;
				}
			}
			if (!found) {
				unknownCast.push(castName);
			}
		}
		return unknownCast;
	}

	//makes an array from the first level of keys in the object.
	var objectToArray = function(o) {
		var array = [];
		for(var key in o) {
			array.push(key);
		}
		return array;
	}

	var getScoredActionsInfo = function() {
		return scoredActionsInfo;
	}

	var getScoredMTInfo = function() {
		return scoredMTInfo;
	}

	return {
		evaluateRule: evaluateRule,
		testEvaluateRule: testEvaluateRule,
		launchStage: launchStage,
		getPractices: getPractices,
		setPractices: setPractices,
		setCast: setCast,
		addPractice: addPractice,
		removePractice: removePractice,
		getCurrentPractice: getCurrentPractice,
		getPracticeByName: getPracticeByName,
		setCurrentPractice: setCurrentPractice,
		getCurrentStage: getCurrentStage,
		setCurrentStage: setCurrentStage,
		getCurrentAction: getCurrentAction,
		setCurrentAction: setCurrentAction,
		getCurrentRoleBindings:getCurrentRoleBindings,
		getEventStageByLabel: getEventStageByLabel,
		getStageByLabel: getStageByLabel,
		getPossibleActions: getPossibleActions,
		generateActions: generateActions,
		selectAction: selectAction,
		instantiatePerformance: instantiatePerformance,
		setBestRoleBindingForAction: setBestRoleBindingForAction,
		applyEffects: applyEffects,
		stageTransition: stageTransition,
		inTerminalStage: inTerminalStage,
		getActionByName: getActionByName,
		getCloneOfBoundPredicates: getCloneOfBoundPredicates,
		getScoredMTInfo:getScoredMTInfo,
		getScoredActionsInfo:getScoredActionsInfo,
		deleteStage: deleteStage,
		updateStage: updateStage
	};
});
