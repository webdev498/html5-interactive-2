let isNetworkOnline = false;

let ROUND_CURRENT_INDEX = 1;
let Answer_Pass_Index = 0;
let QuizDetail;
let canGoNext = false;
let totalCorrectNum = 0;
let current_round_correct_num = 0;


/* Handle the dropdown component */

$('.dropdown-el').click(function(e) {
    // $('.dropdown-el').removeClass('expanded');
    e.preventDefault();
    e.stopPropagation();
    $(this).toggleClass('expanded');

    $('#'+$(e.target).attr('for')).prop('checked',true);
});

$(document).click(function() {
    $('.dropdown-el').removeClass('expanded');
});


/* Document Ready for initial work */

$(document ).ready(function() {
    //Disable Start Button
    $('.pt-btn-begin').toggleClass('pt-btn-begin-inactive');

    if (navigator.onLine) {
        //Send the responses reporting to server if exists
        sendStoredReportToServer();
    }

    if (!loadLastState()) { //Tried to load the last state first. If failed~~~~~~~~~~~
    
        if (navigator.onLine) { // ------------- Online mode -----------
            isNetworkOnline = true;

            //Get Activity JSON
            $.post("https://gsk.mc3tt.com/tabletop/activities/getactivity/", { activity_id: 124 }, function(data){

                //Enable Start Button
                $('.pt-btn-begin').removeClass('pt-btn-begin-inactive');
                $('.pt-btn-begin').toggleClass('pulse-button');

                //Get the quiz info
                QuizDetail = $.parseJSON(data);

                //Store browser support
                localStorage.setItem("activity_json", data);

                //Update the screens with queries
                updateQuestionsAndAnswers(QuizDetail['Activity124']);
                
            })
                .fail(function() {
                    console.log('Something went wrong!');
                });
        }
        else { // ---------------- Offline mode-------------
            isNetworkOnline = false;

            //Check if browser supports the local storage
            if (typeof(Storage) !== "undefined") {
                let activity_json = localStorage.getItem("activity_json");
                if (!activity_json) {
                    $('#popup-alert-internet-div').css('display', 'block');
                    return;
                }
                else {
                    QuizDetail = $.parseJSON(activity_json);
                    //Update the screens with queries
                    updateQuestionsAndAnswers(QuizDetail['Activity124']);

                    //Enable Start Button
                    $('.pt-btn-begin').removeClass('pt-btn-begin-inactive');
                    $('.pt-btn-begin').toggleClass('pulse-button');

                }
            } else {
                alert('Sorry! No Web Storage support..');
            }
            
        }
    }

});

/* Update the questions and answers with activity json info */

updateQuestionsAndAnswers = (quizInfo) => {
    //Update the questions for 3 rounds (12 questions totally)
    for (i = 1; i <= 12; i ++) {
        questionStr = quizInfo['Question' + i][2][1];
        roundNum = Math.floor((i - 1) / 4) + 1;
        questionNum = (i - 1) % 4 + 1;
        $('#round-' + roundNum + '-' + questionNum + '-question').children().first().text(questionStr);
        $('#round-' + roundNum + '-' + questionNum + '-question-answer').children().first().text(questionStr);
    }

    //Update the answers and add the answers dropdown data
    for (round = 1; round <= 3; round ++) {
        for (index = 1; index <= 4; index ++) {
            let questionIndex = (round - 1) * 4 + index;
            let correctAnswerID = quizInfo['Question' + questionIndex][4][1];
            let answersArray = quizInfo['Question' + questionIndex][5][1].split('&&');

            let strTargetID = 'round-' + round + '-' + index + '-dropdown';
            var $targetDropDown = $('#' + strTargetID);
            let correctAnswerValue;

            //Clear dropdown
            $targetDropDown.empty();
            
            //Add the default option
            let nameValue = 'answersGroup-' + questionIndex;
            let IDValue = 'answer-id-default-' + questionIndex;
            var $newRadio = $( "<input type='radio' name='" + nameValue + "' value='" + IDValue + "' checked='checked' id='" + IDValue + "'>" );
            var $newLabel = $( "<label for='answer-id-0'>Touch Here to Select Answer</label>" );
            $targetDropDown.append($newRadio);
            $targetDropDown.append($newLabel);

            //Add real answers below
            $.each(answersArray, function( index, answerObj ) {
                let answerID = answerObj.split('||')[0];
                let answerString = answerObj.split('||')[1];
                //Test purpose
                // answerString = 'answer-STRING-' + answerID; 
                /////////////

                if (answerID == correctAnswerID) {
                    correctAnswerValue = answerString;
                }

                let IDValue = 'answer-id-' + answerID;
                var $newRadio = $( "<input type='radio' name='" + nameValue + "' value='" + IDValue + "' id='" + IDValue + "'>" );
                var $newLabel = $( "<label for='" + IDValue + "'>" + answerString + "</label>" );

                $targetDropDown.append($newRadio);
                $targetDropDown.append($newLabel);

            });

            //Set correct answer label in answer result screen
            $targetCorrectAnswerLabel = $('#round-' + round + '-' + index + '-correct-answer');
            $targetCorrectAnswerLabel.children().first().text(correctAnswerValue);
        }
    }
}

/* Store the reports to localStorage */

storeReportToLocalStorage = (question_id, answer_id, score) => {
    console.log('-----------Locally Stored the report : ', question_id, answer_id, score);
    var storedReport = JSON.parse(localStorage.getItem("reports"));
    if (!storedReport) storedReport = [];

    storedReport.push({
        question_id: question_id,
        answer_id: answer_id,
        score: score
    });

    localStorage.setItem("reports", JSON.stringify(storedReport));
}

/* Send the stored answering report to server */

sendStoredReportToServer = () => {
    var storedReport = JSON.parse(localStorage.getItem("reports"));

    if (storedReport) {
        $.each(storedReport, function( index, reportObj ) {
            var { question_id, answer_id, score } = reportObj;
            sendReportToServer(question_id, answer_id, score);
        });

        //Remove the reports in local storage
        localStorage.removeItem('reports');
    }
    
}

/* Send the answering report to server */

sendReportToServer = (question_id, answer_id, score) => {
    let localInfo = $.parseJSON(currentJSONString);
    let eventID = localInfo.TTInfoDictionary.TTInfo[0][1];
    let userID = localInfo.TTInfoDictionary.TTInfo[1][1];

    $.post("https://gsk.mc3tt.com/tabletop/activities/addactivitycompetition/", 
            { 
                activity_id: 124,
                user_id: userID,
                event_id: eventID,
                question_id: question_id,
                answer_id: answer_id,
                answer_text: ' ',
                score: score
            }, function(data){

            console.log('====== Successfully Reported ========', question_id, answer_id);
            
        })
            .fail(function() {
                console.log('+++++++++ Error reporting testing result +++++');
            });
}

/* 
- Check if all answers are selected
- Calculate the score
- Update the Answer Review screen elements
- Post or store the answer report
- Display the final Correct or Incorrect symbol
*/
checkCanGoNext = () => {
    let quizInfo = QuizDetail['Activity124'];
    var isAllSelected = true;
    
    
    //Check if all answers are selected
    for (index = 1; index <= 4; index ++) {
        let questionIndex = (ROUND_CURRENT_INDEX - 1) * 4 + index;
        let nameValue = 'answersGroup-' + questionIndex;
        let checkedIDValue = $('input:radio[name=' + nameValue + ']:checked').val();

        if (isAllSelected && checkedIDValue == 'answer-id-default-' + questionIndex){
            //Show the alert view
            $('#popup-alert-div').css('display', 'block');
            isAllSelected = false;

            return false;
        }
    }

    //Calculate the correct answers
    current_round_correct_num = 0;
    for (index = 1; index <= 4; index ++) {
        let questionIndex = (ROUND_CURRENT_INDEX - 1) * 4 + index;
        let nameValue = 'answersGroup-' + questionIndex;
        let checkedIDValue = $('input:radio[name=' + nameValue + ']:checked').val();
        let correctAnswerID = quizInfo['Question' + questionIndex][4][1];
        let answerID = checkedIDValue.split('-').pop();
        let score = 0;
        if (correctAnswerID == answerID) {
            //Increase the total correct count
            totalCorrectNum ++;

            //Save the correct number for this round
            current_round_correct_num ++;

            //Set the score
            score = 100;

            //Remove the correct answer label
            $targetCorrectAnswerLabel = $('#round-' + ROUND_CURRENT_INDEX + '-' + index + '-correct-answer');
            $targetCorrectAnswerLabel.css('display', 'none');
        }

        //Update the contents on Answer Review Screen (Dropdown menu and correct answers underneath the incorrect answer)
        let strTargetID = 'round-' + ROUND_CURRENT_INDEX + '-' + index + '-dropdown';
        $targetDropDownAnswer = $('#' + strTargetID + '-answer');
        nameValue = 'answersGroup-' + questionIndex + '-answer';
        IDValue = 'answer-id-default-' + questionIndex + '-answer';
        selectedAnswerValue = $('label[for=' + checkedIDValue + ']').text();

        $newRadio = $( "<input type='radio' name='" + nameValue + "' value='" + IDValue + "' checked='checked' id='" + IDValue + "'>" );
        $newLabel = $( "<label for='answer-id-0'>" + selectedAnswerValue + "</label>" );
        $targetDropDownAnswer.append($newRadio);
        $targetDropDownAnswer.append($newLabel);

        //Send the report to server
        let questionID = quizInfo['Question' + questionIndex][0][1];
        if (navigator.onLine) {  //Sending to server
            sendReportToServer(questionID, answerID, score);
        }
        else { //Store it in local storage
            storeReportToLocalStorage(questionID, answerID, score);
        }
        
    }

    if(current_round_correct_num == 4) {  //Display Correct
        $('#pt-btn-check-result-' + ROUND_CURRENT_INDEX).toggleClass('pt-btn-check-result-correct');
    }
    else{ //Display Incorrect
        $('#pt-btn-check-result-' + ROUND_CURRENT_INDEX).toggleClass('pt-btn-check-result-incorrect');
    }

    //Update the score board
    $('.pt-score-label .number-score').text(totalCorrectNum * 100);

    //Increase the answer index
    Answer_Pass_Index ++;

    //Save the state
    saveCurrentState();

    return isAllSelected;
}


/* Save the current state */

saveCurrentState = () => {
    currentRound = Answer_Pass_Index;
    currentCorrentNum = totalCorrectNum;

    if (currentRound >= 3) {
        localStorage.removeItem("lastState");
        return;
    }

    state = {
        currentRound: currentRound,
        currentCorrectNum: totalCorrectNum
    }
    localStorage.setItem("lastState", JSON.stringify(state));
}

/* Load the last state */

loadLastState = () => {
    if (typeof(Storage) !== "undefined") {
        let activity_json = localStorage.getItem("activity_json");
        if (!activity_json)
            return false;

        lastState = JSON.parse(localStorage.getItem("lastState"));
        if (!lastState)
            return false;

        QuizDetail = $.parseJSON(activity_json);

        //Enable Start Button
        $('.pt-btn-begin').removeClass('pt-btn-begin-inactive');
        $('.pt-btn-begin').toggleClass('pulse-button');

        //Reset the app 
        resetWithState(lastState);
    }

    return false;
}

/* Reset the app with state */
resetWithState = (state) => {
    //Initialize the global variables
    if (navigator.onLine) isNetworkOnline = true;
    else isNetworkOnline = false;
    canGoNext = false;

    ROUND_CURRENT_INDEX = lastState.currentRound + 1;
    Answer_Pass_Index = lastState.currentRound;
    totalCorrectNum = lastState.currentCorrectNum;
    current_round_correct_num = 0;

    //Update the screens with queries
    updateQuestionsAndAnswers(QuizDetail['Activity124']);

    //Go to the corresponding screen
    PageTransitions.gotoPage(Answer_Pass_Index * 2 + 1);

    //Update the score board
    $('.pt-score-label .number-score').text(totalCorrectNum * 100);
}




/* Event Handler : Close button clicked */

$('.pt-btn-close').click(function() {
    window.location.href = "../index.html";
});

/* Event Handler : OK button clicked in all answer request popup */

$('.pt-btn-popup-ok').click(function() {
    $('#popup-alert-div').css('display', 'none');
});

/* Event Handler : Continue button clicked on Answer review screen for each round */

$('.pt-btn-continue').click(function() {
    ROUND_CURRENT_INDEX ++;
});

/* Event Handler : Result(Continue) button clicked on final 3th round's Answer Review*/
$('.pt-btn-result').click(function() {
    ROUND_CURRENT_INDEX ++;

    //Display the total earned points
    $('#final-earned-points').text(totalCorrectNum * 100 + ' POINTS');

    //Display the count of correct answers
    $('#result-text').text(totalCorrectNum + '/12');
    
});





