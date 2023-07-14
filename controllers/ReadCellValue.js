const xlsx = require('xlsx');

/**
 * Функция считывает значение ячейки из таблицы
 * @param {string} cell - Номер ячейки
 * @returns {string} значение ячейки
 */
function ReadCellValue(cell) {
    const workbook = xlsx.readFile('answers.xlsx');
 
    // Выбор нужного листа (по имени или индексу)
    const sheet = workbook.Sheets['messages'];
     
    // Считывание текста из ячейки cell
    const cellValue = sheet[cell];
    const cellText = cellValue ? cellValue.v.toString() : '';
    
    return cellText;
}

module.exports = { ReadCellValue }