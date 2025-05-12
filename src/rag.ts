import { Pinecone } from "@pinecone-database/pinecone";
import { mistralApiKey, pineconeApiKey } from "../utils/environment/index.js";
import { Mistral } from "@mistralai/mistralai";

const query = "tell me about the top technoligies of all time";

const pc = new Pinecone({
  apiKey: pineconeApiKey,
});

const namespace = pc.index("scandium").namespace("users");
const pineconeResponse = await namespace.searchRecords({
  query: {
    inputs: { text: query },
    topK: 10,
  },
  rerank: {
    model: "bge-reranker-v2-m3",
    topN: 5,
    rankFields: ["text"],
  },
});

const technoligies = pineconeResponse.result.hits.map((hit) => {
  const fields = hit.fields as {
    text: string;
    name: string;
  };
  return {
    text: fields.text,
    name: fields.name,
  };
});


const mistral = new Mistral({
  apiKey: mistralApiKey,
});
const updateQuery = `
##QUERY
${query}

---
##CONTEXT
${technoligies.join("\n-")}
`;
console.log(updateQuery);



const response = await mistral.chat.complete({
  model: "mistral-large-latest",
  messages: [
    {
      role: "user",
      content: updateQuery
    },
  ],
});

if(response.choices && response.choices.length > 0) {
  console.log(response.choices[0].message.content);
}
