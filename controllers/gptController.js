require('dotenv').config();
const { ReadCellValue } = require('./ReadCellValue');
const { Configuration, OpenAIApi } = require("openai");

/**
 * Функция регестрирует gpt
 * @param {number} prompt - Promt для gpt
 * @returns {string} Ответ gpt
 */
async function GPTController(prompt) {
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: Number(process.env.MAX_TOKENS),
        n: 1,
        temperature: Number(process.env.TEMPERATURE),
    });
    
    const response = completion.data.choices[0].message.content;
    return response;
}

const openai = new OpenAIApi(
    new Configuration({ apiKey: ReadCellValue('H2') })
);

module.exports = { GPTController }
