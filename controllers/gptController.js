// добавить обработку ошибок

require('dotenv').config()
const { Configuration, OpenAIApi } = require("openai");


const openai = new OpenAIApi(
    new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

async function GPTController(prompt) {
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: Number(process.env.MAX_TOKENS),
        n: 1,
        temperature: Number(process.env.TEMPERATURE),
    });
    
    const response = completion?.data?.choices?.[0]?.message?.content;
    return response;
}

module.exports = { GPTController }