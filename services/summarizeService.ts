import axios from "axios";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const summarizeText = async (text: string): Promise<string> => {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `Summarize this: ${text}` }],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return (
    response.data.choices?.[0]?.message?.content || "No summary available."
  );
};
