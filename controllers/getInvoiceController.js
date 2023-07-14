require('dotenv').config();
const { ReadCellValue } = require('./ReadCellValue')

/**
 * функция определяет объект с информацией об оплате
 * @param {object} ctx - Информация о сообщении
 * @param {number} cost - Стоимость подписки
 * @returns {object} Возвращает объект с информацией об оплате 
 */
function GetInvoice(ctx, cost) {
    const invoice = {
        chat_id: ctx.from.id, // Уникальный идентификатор целевого чата или имя пользователя целевого канала
        provider_token: ReadCellValue('I2'), // токен 
        start_parameter: 'get_access', 
        title: 'Оформить подписку', // Название продукта, 1-32 символа
        description: 'Получить доступ к классным ответам на отзывы', // Описание продукта, 1-255 знаков
        currency: 'RUB', // Трехбуквенный код валюты ISO 4217
        prices: [{ label: 'Подписка на телеграм-бота', amount: cost * 100 }], 
        payload: { // Полезные данные счета-фактуры, определенные ботом, 1–128 байт. Это не будет отображаться пользователю, используйте его для своих внутренних процессов.
            cost: cost,
            unique_id: `${ctx.from.id}_${Number(new Date())}`,
            provider_token: process.env.PROVIDER_TOKEN 
          }
      }
    
      return invoice
}

module.exports = { GetInvoice }
