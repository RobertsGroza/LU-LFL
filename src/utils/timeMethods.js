/**
 * Metode salīdzina uzdevumā nodefinētos laikus "mm:ss"
 * Atgriež true, ja time1 ir lielāks par time2
 */
export const compareTime = (time1, time2) => {
    let splitTime1 = time1.split(":");
    let splitTime2 = time2.split(":");

    return parseInt(splitTime1[0]) > parseInt(splitTime2[0]) || (parseInt(splitTime1[0]) === parseInt(splitTime2[0]) && parseInt(splitTime1[1]) > parseInt(splitTime2[1]));
}

/**
 * Metode atņem no pirmā laika otro laiku
 */
export const subtractTime = (time1, time2) => {
    let splitTime1 = time1.split(":");
    let splitTime2 = time2.split(":");

    let minutes = parseInt(splitTime1[0]) - parseInt(splitTime2[0]);
    let seconds = 0;

    if (parseInt(splitTime1[1]) < parseInt(splitTime2[1])) {
        minutes = minutes - 1;
        seconds = 60 + parseInt(splitTime1[1]) - parseInt(splitTime2[1]);
    } else {
        seconds = parseInt(splitTime1[1]) - parseInt(splitTime2[1]);
    }

    if (minutes === 0) {
        minutes = "00"; // Lai rezultātā atgrieztu nevis 0, bet gan 00
    }
    
    if (seconds === 0) {
        seconds = "00"; // Lai rezultātā atgrieztu nevis 0, bet gan 00
    }

    return `${minutes}:${seconds}`;
}

/**
 * Metode saskaita abus laikus kopā
 */
export const addTime = (time1, time2) => {
    let splitTime1 = time1.split(":");
    let splitTime2 = time2.split(":");

    let minutes = parseInt(splitTime1[0]) + parseInt(splitTime2[0]);
    let seconds = 0;

    if (parseInt(splitTime1[1]) + parseInt(splitTime2[1]) > 59) {
        minutes = minutes + 1;
        seconds = parseInt(splitTime1[1]) + parseInt(splitTime2[1]) - 60;
    } else {
        seconds = parseInt(splitTime1[1]) + parseInt(splitTime2[1]);
    }

    if (minutes === 0) {
        minutes = "00";     // Lai rezultātā atgrieztu nevis 0, bet gan 00
    }

    if (seconds === 0) {
        seconds = "00";     // Lai rezultātā atgrieztu nevis 0, bet gan 00
    }

    return `${minutes}:${seconds}`;
}

export default {
    compareTime,
    subtractTime,
    addTime
};
