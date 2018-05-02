function runPrintResult(e)
{
    if (e.keyCode == 13)
    {
        printResult();
    }
}


function printResult()
{
    var itemClass = '';
    var messagesObj = {
        not_equal_length: 'Параметры не совпадают по количеству!',
        false: 'Параметры не совпадают!',
        true: 'Параметры полностью совпадают!'
    }

    clearMessages();
    var expectedParams = getFieldValue('expected_input', 'expected_block');
    var actualParams = getFieldValue('actual_input', 'actual_block');
    result = getCompareResult(expectedParams, actualParams);

    switch(result.status) {
        case 'not_equal_length':
            itemClass = 'failed';
            break;
        case false:
            itemClass = 'failed';
            break;
        case 'emtpy':
            return;
        default:
            itemClass = 'successed';
    }

    var resultBlock = renderResultBlock('div', itemClass, 'result', 'content-block');
    renderTextItems('div', resultBlock, messagesObj[result.status]);

    var resultTable = renderResultBlock('div', 'result-table', 't1', 'result');
    var resultTableCell = renderResultBlock('div', 'result-table-cell', 'left_cell', 't1');
    renderTextItems('div', left_cell, 'Ожидаемая последовательность: ');
    for (var key in expectedParams) {
        let className = 'success';
        if (result.kyes_not_found.includes(key)) {
            className = 'fail';
        }
        renderTextItems('mark', resultTableCell, '' + key + ': ' + expectedParams[key] + ', ', className);
        resultTableCell.appendChild(document.createElement('br'));
    }

    resultTableCell = renderResultBlock('div', 'result-table-cell', 'right_cell', 't1');
    renderTextItems('div', right_cell, 'Фактическая последовательность: ');
    for (var key in actualParams) {
        let className = 'success';
        if (result.values_not_found.includes(actualParams[key])) {
            className = 'suspect';
        }
        if (result.other_keys.includes(key)) {
            className = 'useless';
        }
        renderTextItems('mark', resultTableCell, '' + key + ': ' + actualParams[key] + ', ', className);
        resultTableCell.appendChild(document.createElement('br'));
    }
}


function getFieldValue(fieldId, parentBlockId) {
   var fieldValue = document.getElementById(fieldId).value;
   var parentBlock = document.getElementById(parentBlockId);
   if (fieldValue.length == 0) {
        renderAlert(parentBlock, fieldId, 'alert_' + parentBlockId);
        return new Object();
   }
   if (fieldValue.includes('[')) {
        fieldValue = getFormatedStringFromRawString(fieldValue);
   }

   return getObjectFromFormatedString(fieldValue);
}


function getCompareResult(expObj, actObj) {
    var status = true;
    var keysNotFound = [];  // ключи, которые не найдены в фактической последовательности
    var valuesNotFound = []; // неправильные значения при правильных ключах
    var otherKeys = [];  // все другие (необязательные) ключи

    // заполнение данными keysNotFound и valuesNotFound
    for (var key in expObj) {
        if (actObj.hasOwnProperty(key)) {
            if (expObj[key] != actObj[key]) {
                valuesNotFound.push(actObj[key]);
            }
        } else {
            keysNotFound.push(key);         
        }
    }

    // заполнением данными otherKeys
    for (var key in actObj) {
        if ((expObj.hasOwnProperty(key))) {
            continue;
        }
        otherKeys.push(key);
    }
 
    // сравнение expected и actual параметров в виде объектов (ключей и значений)
    if ((Object.keys(expObj).length && Object.keys(actObj).length) == 0) {
        status = 'emtpy';
    } else if (Object.keys(expObj).length > Object.keys(actObj).length) {
        status = 'not_equal_length'
    } else if ((keysNotFound.length || valuesNotFound.length) > 0) {
        status = false;
    }
    console.log(status); // debug-статус операции
    return {
        'status': status,
        'kyes_not_found': keysNotFound,
        'values_not_found': valuesNotFound,
        'other_keys': otherKeys
    }
}


function renderResultBlock(item, itemClass, itemId, parentItemId) {
    var resultItem = document.createElement(item);
    if (itemClass) resultItem.className = itemClass;
    if (itemId) resultItem.id = itemId;
    document.getElementById(parentItemId).appendChild(resultItem);
    return resultItem;
}


function renderTextItems(item, parentItem, message, itemClass, itemId) {
    var resultItem = document.createElement(item);
    if (itemClass) resultItem.className = itemClass;
    if (itemId) resultItem.id = itemId;
    parentItem.appendChild(resultItem);
    resultItem.appendChild(document.createTextNode(message));
}


function renderAlert(parentItem, inputId, alertId) {
    message = 'Поле не должно быть пустым!';
    itemClass = 'alert';
    document.getElementById(inputId).setAttribute('alert-state', 'true');
    renderTextItems('span', parentItem, message, itemClass, alertId);

}


// очистка инпутов и результатов сравнения
function clearMessages() {
    var resultBlock = document.getElementById('result');
    if (resultBlock) {
        document.getElementById('content-block').removeChild(resultBlock);
    }

    var expectedAlertMessage = document.getElementById('alert_expected_block');
    if (expectedAlertMessage) {
        document.getElementById('expected_block').removeChild(expectedAlertMessage);
    }

    var actualAlertMessage = document.getElementById('alert_actual_block');
    if (actualAlertMessage) {
        document.getElementById('actual_block').removeChild(actualAlertMessage);
    }

    var expected_input_field = document.getElementById('expected_input');
    if (expected_input_field.getAttribute('alert-state') == 'true') {
        expected_input_field.setAttribute('alert-state', 'false');
    }

    var actual_input_field = document.getElementById('actual_input');
    if (actual_input_field.getAttribute('alert-state') == 'true') {
        actual_input_field.setAttribute('alert-state', 'false');
    }
}

// извлечение из network-запроса данных между "[" и "]" в виде стринги. Пример запроса:
// https://tt.onthe.io/?k[]=41949:pageviews[event:pageviews,category:n,sub_category:u,cdn_version:97]&s=40d
function getFormatedStringFromRawString (str) {
    var data = str.split('[')[2].split(']')[0].split(',');
    return data.toString();
}

// создание объекта из стринги для удобного перебора ключей\значений
function getObjectFromFormatedString (str) {
    var data_obj = new Object();
    var data = str.split(',');
    data.forEach(function(item)
    {
        var key = decodeURIComponent(item.split(':')[0].trim());
        var value = decodeURIComponent(item.split(':')[1].trim());
        data_obj[key] = value;
    });
    return data_obj;
}
