let ROUND_CURRENT_INDEX = 1;
let QuizDetail;
let canGoNext = false;
let totalCorrectNum = 0;
let current_round_correct_num = 0;

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

$(document ).ready(function() {
    //Disable Start Button
    $('.pt-btn-begin').toggleClass('pt-btn-begin-inactive');
    
    if (navigator.onLine) { // ------------- Online mode -----------
        $.post("https://gsk.mc3tt.com/tabletop/activities/getactivity/", { activity_id: 124 }, function(data){

            //Enable Start Button
            $('.pt-btn-begin').removeClass('pt-btn-begin-inactive');

            //Get the quiz info
            QuizDetail = $.parseJSON(data);

            //Update the screens with queries
            updateQuestionsAndAnswers(QuizDetail['Activity124']);
            
        })
            .fail(function() {
                alert('Something went wrong!');
            });
    }
    else { // ---------------- Offline mode-------------
        $('.pt-btn-begin').removeClass('pt-btn-begin-inactive');
    }

});


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
                answerString = 'answer-STRING-' + answerID; 
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

            //Set Answer Section in answer result view
            $targetDropDownAnswer = $('#' + strTargetID + '-answer');
            nameValue = 'answersGroup-' + questionIndex + '-answer';
            IDValue = 'answer-id-default-' + questionIndex + '-answer';
            $newRadio = $( "<input type='radio' name='" + nameValue + "' value='" + IDValue + "' checked='checked' id='" + IDValue + "'>" );
            $newLabel = $( "<label for='answer-id-0'>" + correctAnswerValue + "</label>" );
            $targetDropDownAnswer.append($newRadio);
            $targetDropDownAnswer.append($newLabel);
        }
    }
}


checkCanGoNext = () => {
    let quizInfo = QuizDetail['Activity124'];
    var isAllSelected = true;
    
    
    //Check if all answers are selected
    for (index = 1; index <= 4; index ++) {
        let questionIndex = (ROUND_CURRENT_INDEX - 1) * 4 + index;
        let nameValue = 'answersGroup-' + questionIndex;
        let checkedIDValue = $('input:radio[name=' + nameValue + ']:checked').val();

        if (isAllSelected && checkedIDValue == 'answer-id-default-' + questionIndex){
            alert('Please select all answers!');
            isAllSelected = false;

            return;
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
        if (correctAnswerID == answerID) {
            totalCorrectNum ++;
            current_round_correct_num ++;
        }
    }

    if(current_round_correct_num == 4) {  //Display Correct
        $('#pt-btn-check-result-' + ROUND_CURRENT_INDEX).toggleClass('pt-btn-check-result-correct');
    }
    else{ //Display Incorrect
        $('#pt-btn-check-result-' + ROUND_CURRENT_INDEX).toggleClass('pt-btn-check-result-incorrect');
    }

    return isAllSelected;
}

$('.pt-btn-continue').click(function() {
    ROUND_CURRENT_INDEX ++;
});

$('.pt-btn-result').click(function() {
    ROUND_CURRENT_INDEX ++;

    $('#result-text').text(totalCorrectNum + '/12');
});


